cat << 'EOF' > app.py
"""
================================================================================
FISH DETECTION API - OPEN-SET ENSEMBLE METHOD (v1.0.0)
================================================================================

Production-ready FastAPI application for open-set fish detection using 
3-signal ensemble voting on pre-trained DINO model.

PROBLEM SOLVED:
Your DINO model (trained on 30 fish species) classifies everything as one of 
the 30 classes. This API adds logic to detect:
1. Unknown fish species (not in training data)
2. Non-fish objects (tables, chairs, people, etc.)
3. Known species (correct classification)

METHOD: 3-Signal Ensemble Voting
- Signal 1: Confidence (is top score >= 0.80?)
- Signal 2: Margin (is gap between top scores >= 0.10?)
- Signal 3: Entropy (is prediction concentrated <= 1.5?)
- Decision: If 2+ signals pass → species name; else → "unknown"

QUICK START:
1. Update CONFIG_FILE and CHECKPOINT_FILE paths (lines ~65-70)
2. pip install fastapi uvicorn mmdet torch torchvision opencv-python scipy
3. python app_ensemble_production.py
4. Open http://localhost:8000/docs in browser

================================================================================
"""

import logging
import os
import tempfile
import time
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path

import numpy as np
import cv2
from scipy.special import softmax as scipy_softmax

from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
import uvicorn

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION - MODIFY THESE FOR YOUR MODEL
# ============================================================================

# Model configuration - UPDATE THESE PATHS!
CONFIG_FILE = "/mmdetection/30speciesset_dino_swin_l_36e/test30.py"  # UPDATE THIS PATH
CHECKPOINT_FILE = "/mmdetection/30speciesset_dino_swin_l_36e/epoch_72.pth"  # UPDATE THIS PATH
DEVICE = "cuda:0"  # Use "cpu" if no GPU available

# Ensemble thresholds (data-driven from your experimental analysis)
CONFIDENCE_THRESHOLD = 0.80      # Signal 1: minimum top score
MARGIN_THRESHOLD = 0.10          # Signal 2: minimum gap between top 2 scores
ENTROPY_THRESHOLD = 1.5          # Signal 3: maximum entropy (spread)
MIN_SIGNALS_REQUIRED = 2         # How many signals must pass (out of 3)

# Other configuration
UNKNOWN_CLASS_NAME = "unknown"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
TEMP_DIR = tempfile.gettempdir()
API_VERSION = "1.0.0"

# ============================================================================
# GLOBAL VARIABLES - Will be initialized on startup
# ============================================================================

model = None
cfg = None
CLASS_NAMES = []
device = None

current_thresholds = {
    "confidence_threshold": CONFIDENCE_THRESHOLD,
    "margin_threshold": MARGIN_THRESHOLD,
    "entropy_threshold": ENTROPY_THRESHOLD,
    "min_signals_required": MIN_SIGNALS_REQUIRED
}

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="Fish Detection API - Open-Set Ensemble",
    description="Detect known fish species and mark unknown/non-fish as 'unknown'",
    version=API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# HELPER FUNCTIONS - MATH & STATISTICS
# ============================================================================

def softmax(x: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    """Convert scores to probabilities using softmax."""
    return scipy_softmax(x / temperature)


def compute_entropy(scores: np.ndarray) -> float:
    """
    Calculate Shannon entropy of prediction distribution.
    
    Low entropy (0.2-0.4) = concentrated prediction (confident)
    High entropy (1.5+) = spread prediction (confused)
    """
    probs = softmax(scores)
    eps = 1e-10
    probs = np.clip(probs, eps, 1.0)
    entropy_val = float(-np.sum(probs * np.log(probs)))
    return entropy_val


def compute_margin(scores: np.ndarray) -> float:
    """
    Calculate margin between top-1 and top-2 predictions.
    
    Large margin (>0.90) = clear winner
    Small margin (<0.10) = nearly tied (unclear)
    """
    if len(scores) < 2:
        return 1.0
    
    top_score = float(scores[0])
    second_score = float(scores[1])
    margin_val = top_score - second_score
    return margin_val


def apply_ensemble_logic(
    scores: np.ndarray,
    confidence_th: float = CONFIDENCE_THRESHOLD,
    margin_th: float = MARGIN_THRESHOLD,
    entropy_th: float = ENTROPY_THRESHOLD,
    min_signals: int = MIN_SIGNALS_REQUIRED
) -> Dict:
    """
    Apply 3-signal ensemble voting.
    
    Logic:
    1. Check confidence >= threshold?
    2. Check margin >= threshold?
    3. Check entropy <= threshold?
    4. Count signals that pass
    5. If 2+ signals pass → accept as known; else → mark unknown
    """
    scores_sorted = np.sort(scores)[::-1]
    
    # SIGNAL 1: CONFIDENCE
    top_score = float(scores_sorted[0])
    confidence_ok = top_score >= confidence_th
    
    # SIGNAL 2: MARGIN
    margin = compute_margin(scores_sorted)
    margin_ok = margin >= margin_th
    
    # SIGNAL 3: ENTROPY
    entropy_val = compute_entropy(scores_sorted)
    entropy_ok = entropy_val <= entropy_th
    
    # VOTING
    signals_passed = int(confidence_ok) + int(margin_ok) + int(entropy_ok)
    
    signals_status = []
    signals_status.append(f"Confidence: {'✓' if confidence_ok else '✗'} ({top_score:.4f} vs {confidence_th})")
    signals_status.append(f"Margin: {'✓' if margin_ok else '✗'} ({margin:.4f} vs {margin_th})")
    signals_status.append(f"Entropy: {'✓' if entropy_ok else '✗'} ({entropy_val:.4f} vs {entropy_th})")
    
    reasoning = "; ".join(signals_status) + f"; {signals_passed}/{3} signals passed"
    
    return {
        "signals_passed": signals_passed,
        "confidence_ok": confidence_ok,
        "confidence_value": top_score,
        "margin_ok": margin_ok,
        "margin_value": margin,
        "entropy_ok": entropy_ok,
        "entropy_value": entropy_val,
        "reasoning": reasoning,
        "min_signals_required": min_signals
    }

# ============================================================================
# MODEL INITIALIZATION
# ============================================================================

def init_model():
    """Initialize DINO model from checkpoint."""
    global model, cfg, CLASS_NAMES, device
    
    logger.info("Initializing DINO model...")
    
    try:
        from mmdet.apis import init_detector
        from mmengine.config import Config
        
        device = DEVICE
        cfg = Config.fromfile(CONFIG_FILE)
        model = init_detector(CONFIG_FILE, CHECKPOINT_FILE, device=device)
        
        if hasattr(cfg, 'train_dataloader'):
            CLASS_NAMES = list(cfg.train_dataloader.dataset.metainfo["classes"])
        else:
            logger.warning("Could not extract class names, using numbered classes")
            CLASS_NAMES = [f"class_{i}" for i in range(30)]
        
        logger.info(f"✓ Model loaded successfully on {device}")
        logger.info(f"✓ Found {len(CLASS_NAMES)} classes")
        
    except Exception as e:
        logger.error(f"✗ Failed to load model: {str(e)}")
        raise


def inference_detector(model, img_path: str) -> Tuple[np.ndarray, np.ndarray]:
    """Run inference on image and extract scores and labels."""
    from mmdet.apis import inference_detector
    
    result = inference_detector(model, img_path)
    det_instances = result.pred_instances
    
    if len(det_instances) == 0:
        return np.array([]), np.array([])
    
    scores = det_instances.scores.cpu().numpy()
    labels = det_instances.labels.cpu().numpy()
    
    return scores, labels

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize model on startup."""
    logger.info("=" * 80)
    logger.info("FISH DETECTION API - OPEN-SET ENSEMBLE (v1.0.0)")
    logger.info("=" * 80)
    init_model()
    logger.info(f"Configuration:")
    logger.info(f"  Confidence threshold: {current_thresholds['confidence_threshold']}")
    logger.info(f"  Margin threshold: {current_thresholds['margin_threshold']}")
    logger.info(f"  Entropy threshold: {current_thresholds['entropy_threshold']}")
    logger.info(f"  Min signals required: {current_thresholds['min_signals_required']}")
    logger.info("=" * 80)


@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint - HTML documentation."""
    return """
    <html>
    <head>
        <title>Fish Detection API</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2c3e50; }
            .section { background: #ecf0f1; padding: 20px; margin: 20px 0; border-radius: 5px; }
            code { background: #34495e; color: #ecf0f1; padding: 2px 6px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <h1>🐟 Fish Detection API - Open-Set Ensemble</h1>
        <p>Production-ready API for detecting known fish species and unknown/non-fish objects.</p>
        
        <div class="section">
            <h2>📖 Documentation</h2>
            <ul>
                <li><a href="/docs">Interactive API Documentation (Swagger UI)</a></li>
                <li><a href="/redoc">Alternative Documentation (ReDoc)</a></li>
            </ul>
        </div>
        
        <div class="section">
            <h2>🚀 Quick Start</h2>
            <p>Make a prediction:</p>
            <code>curl -X POST -F "file=@fish.jpg" http://localhost:8000/predict</code>
        </div>
        
        <div class="section">
            <h2>🔧 API Endpoints</h2>
            <ul>
                <li><code>POST /predict</code> - Predict fish species in image</li>
                <li><code>GET /health</code> - Check API status</li>
                <li><code>GET /config</code> - View full configuration</li>
                <li><code>GET /tune_thresholds</code> - Test custom thresholds</li>
            </ul>
        </div>
    </body>
    </html>
    """


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok" if model is not None else "error",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": model is not None,
        "device": DEVICE,
        "num_classes": len(CLASS_NAMES),
        "current_config": current_thresholds
    }


@app.get("/config")
async def get_config():
    """Get detailed configuration."""
    return {
        "api_version": API_VERSION,
        "model_info": {
            "config_file": CONFIG_FILE,
            "checkpoint_file": CHECKPOINT_FILE,
            "device": DEVICE,
            "num_classes": len(CLASS_NAMES)
        },
        "ensemble_method": {
            "num_signals": 3,
            "voting_rule": f"Accept as known if {MIN_SIGNALS_REQUIRED}+ signals pass",
            "signal_1_confidence": {
                "threshold": CONFIDENCE_THRESHOLD,
                "known_fish_range": [0.93, 0.99],
                "unknown_fish_range": [0.46, 0.98],
                "non_fish_range": [0.33, 0.92]
            },
            "signal_2_margin": {
                "threshold": MARGIN_THRESHOLD,
                "known_fish_range": [0.005, 0.99],
                "unknown_fish_range": [0.008, 0.95],
                "non_fish_range": [0.15, 0.95]
            },
            "signal_3_entropy": {
                "threshold": ENTROPY_THRESHOLD,
                "known_fish_range": [0.15, 0.45],
                "unknown_fish_range": [0.10, 1.50],
                "non_fish_range": [0.30, 2.10]
            }
        }
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    confidence_th: float = Query(CONFIDENCE_THRESHOLD, ge=0.0, le=1.0),
    margin_th: float = Query(MARGIN_THRESHOLD, ge=0.0, le=1.0),
    entropy_th: float = Query(ENTROPY_THRESHOLD, ge=0.0, le=3.4),
    min_signals: int = Query(MIN_SIGNALS_REQUIRED, ge=1, le=3)
):
    """
    Predict fish species in uploaded image using ensemble voting.
    
    Parameters:
        file: Image file (JPG, PNG, etc.)
        confidence_th: Custom confidence threshold
        margin_th: Custom margin threshold
        entropy_th: Custom entropy threshold
        min_signals: Custom min signals required
    
    Example:
        curl -X POST -F "file=@fish.jpg" http://localhost:8000/predict
    """
    temp_path = None
    
    try:
        if file.size > MAX_FILE_SIZE:
            return JSONResponse(
                status_code=400,
                content={"error": f"File too large (max {MAX_FILE_SIZE} bytes)"}
            )
        
        temp_path = os.path.join(TEMP_DIR, f"temp_{int(time.time())}_{file.filename}")
        contents = await file.read()
        
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        logger.info(f"Processing image: {file.filename}")
        
        scores, labels = inference_detector(model, temp_path)
        
        if len(scores) == 0:
            logger.info(f"{file.filename}: No detections")
            return {
                "predicted_fish": UNKNOWN_CLASS_NAME,
                "confidence": 0.0,
                "decision_signals": {
                    "confidence_ok": False,
                    "confidence_value": 0.0,
                    "margin_ok": False,
                    "margin_value": 0.0,
                    "entropy_ok": False,
                    "entropy_value": 0.0,
                    "signals_passed": 0
                },
                "reasoning": "No detections found in image",
                "top_candidate": None,
                "num_detections": 0
            }
        
        decision = apply_ensemble_logic(
            scores=scores,
            confidence_th=confidence_th,
            margin_th=margin_th,
            entropy_th=entropy_th,
            min_signals=min_signals
        )
        
        top_label = int(labels[0])
        top_species = CLASS_NAMES[top_label] if top_label < len(CLASS_NAMES) else f"class_{top_label}"
        top_score = float(scores[0])
        
        if decision["signals_passed"] >= min_signals:
            predicted_fish = top_species
            reasoning = f"Top candidate: {top_species} (score: {top_score:.4f}), ensemble accepted it: {decision['signals_passed']} signals passed (need {min_signals})"
        else:
            predicted_fish = UNKNOWN_CLASS_NAME
            reasoning = f"Top candidate: {top_species} (score: {top_score:.4f}), but ensemble rejected it: {decision['signals_passed']} signals passed (need {min_signals})"
        
        logger.info(f"{file.filename}: {predicted_fish} (confidence={top_score:.4f}, signals={decision['signals_passed']}/3)")
        
        return {
            "predicted_fish": predicted_fish,
            "confidence": top_score,
            "decision_signals": {
                "confidence_ok": decision["confidence_ok"],
                "confidence_value": decision["confidence_value"],
                "margin_ok": decision["margin_ok"],
                "margin_value": decision["margin_value"],
                "entropy_ok": decision["entropy_ok"],
                "entropy_value": decision["entropy_value"],
                "signals_passed": decision["signals_passed"]
            },
            "reasoning": reasoning,
            "top_candidate": top_species,
            "num_detections": len(scores)
        }
    
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Processing failed: {str(e)}"}
        )
    
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass


@app.get("/tune_thresholds")
async def tune_thresholds(
    confidence_th: Optional[float] = Query(None, ge=0.0, le=1.0),
    margin_th: Optional[float] = Query(None, ge=0.0, le=1.0),
    entropy_th: Optional[float] = Query(None, ge=0.0, le=3.4),
    min_signals: Optional[int] = Query(None, ge=1, le=3)
):
    """Get recommendations for threshold tuning."""
    return {
        "current_settings": current_thresholds,
        "recommendations": {
            "too_many_false_positives": {
                "symptom": "Too many non-fish marked as known",
                "solution": "Make thresholds STRICTER",
                "try": {
                    "confidence_th": 0.85,
                    "margin_th": 0.12,
                    "entropy_th": 1.3,
                    "min_signals": 3
                }
            },
            "too_many_false_negatives": {
                "symptom": "Too many known fish marked as unknown",
                "solution": "Make thresholds LOOSER",
                "try": {
                    "confidence_th": 0.75,
                    "margin_th": 0.08,
                    "entropy_th": 1.7,
                    "min_signals": 1
                }
            },
            "balanced_default": {
                "symptom": "Good balance",
                "solution": "Use default thresholds",
                "settings": {
                    "confidence_th": 0.80,
                    "margin_th": 0.10,
                    "entropy_th": 1.5,
                    "min_signals": 2
                }
            }
        }
    }


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
EOF