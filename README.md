# iMATSYA: Marine Fish Detection System

End‑to‑end pipeline for **marine fish species detection** and **open‑set recognition** using:

- DINO object detection (MMDetection)
- ResNet‑50 and Swin‑L backbones
- LabelMe + auto‑labelling (YOLOv8 + VGG16)
- COCO conversion utilities
- Dockerized training on L40S and H100
- FastAPI inference server with 3‑signal OSR ensemble
- (Optional) Text‑grounded multimodal detection

This README is for someone **new to the project** who has GPU resources and wants to reproduce the full pipeline.

---

## 0. End‑to‑End Pipeline Overview

![End‑to‑end training and deployment pipeline](https://agi-prod-file-upload-public-main-use1.s3.amazonaws.com/1165a966-5338-46c1-8273-19e54ba80e0e)

---

## 1. Repository Structure

A suggested layout for this repo:

```text
marine-fish-detection-system/
├─ README.md
├─ requirements.txt                  # for light-weight tools (LabelMe, scripts)
├─ docker/
│  ├─ Dockerfile.l40s               # MMDetection docker for L40S / generic GPUs
│  └─ Dockerfile.h100               # Custom SM90 image for H100
├─ configs/
│  ├─ dino_r50_24e.py               # 30-species ResNet-50 baseline
│  ├─ A3_dino_swin_l_60e.py         # 30-species Swin-L on L40S
│  ├─ 30speciesset_dino_swin_l_36e.py   # 30-species Swin-L on H100
│  └─ test30species.py              # eval config for 30-species Swin-L
├─ data_tools/
│  ├─ auto_label_yolov8_vgg16.py    # YOLOv8 + VGG16 LabelMe autolabeller
│  ├─ convert_labelme_to_coco.py    # LabelMe (rectangles & polygons) → COCO
│  └─ README.md                     # explains expected folder layouts
├─ inference/
│  ├─ batch_infer_r50.py            # batch inference for ResNet-50 model
│  ├─ batch_infer_swin.py           # batch inference for Swin-L model
│  ├─ app_ensemble.py               # FastAPI OSR server (3-signal gate)
├─ scripts/
│  ├─ build_docker_l40s.sh          # docker build for L40S
│  ├─ build_docker_h100.sh          # docker build for H100
│  ├─ verify_env_h100.py            # checks mmcv CUDA ops on H100
└─ mmdetection/                     # (optional submodule or external clone)
```

You do **not** need this exact layout, but the README assumes these logical locations.

---

## 2. Prerequisites

### 2.1 Hardware

- Linux machine with:
  - At least one NVIDIA GPU  
    - L40S or similar for 30‑species experiments
    - H100 (SM90) for 30‑species high‑resolution training
- Disk space for:
  - Raw images + LabelMe JSONs
  - COCO JSONs
  - MMDetection checkpoints and logs

### 2.2 System Software

On the **host** (outside Docker):

- Docker `>= 20.x`
- NVIDIA drivers and `nvidia-container-toolkit` installed so `docker run --gpus all ...` works
- Optional: Python 3.9+ if you want to run scripts outside Docker (for auto‑labelling, LabelMe, etc.)

---

## 3. Data Preparation

### 3.1 Dataset Layout (Raw Images)

Raw images are provided species‑wise, one folder per species.

```text
/path/to/raw_dataset/
├─ Alepes kleinii/
│  ├─ img_0001.jpg
│  ├─ img_0002.jpg
│  └─ ...
├─ Amphioctopus neglectus/
│  ├─ ...
└─ ...
```

You will need this structure for:

- Manual LabelMe annotation
- Auto‑labelling pipeline
- LabelMe → COCO conversion

---

### 3.2 Manual Annotation with LabelMe

1. Create and activate a virtual env on your workstation or EC2 box:

```bash
python3 -m venv labelme-env
source labelme-env/bin/activate
pip install labelme
```

2. Launch LabelMe:

```bash
labelme
```

3. In the GUI:

- **Open Dir** → select a species folder
- For each image:
  - Use rectangle tool (Ctrl+R) to draw bounding boxes around each fish
  - Right‑click to assign the correct species label
  - Save → this creates a `*.json` with:
    - `shape_type: "rectangle"`
    - `points`: `[ [x1, y1], [x2, y2] ]`

The output is one JSON per image in the same folder as the image.

---

### 3.3 Auto‑Labelling (Optional but Recommended)

When the dataset exceeds a few hundred images, you can use the provided YOLOv8+VGG16 script to generate LabelMe JSONs automatically.

```bash
python data_tools/auto_label_yolov8_vgg16.py
```

Key behaviour:

- Uses YOLOv8 to detect fish and pick the largest bounding box per image.
- If YOLO finds nothing, uses a fallback 90% image‑covering box.
- Crops that region, classifies with VGG16, and writes a LabelMe‑compatible JSON with:
  - `shape_type: "rectangle"`
  - `points`: top‑left and bottom‑right
  - embedded base64 image
- Outputs three artifacts per image: raw copy, labeled image (box + label), and JSON, preserving species‑wise folder structure.

Update these paths inside the script:

```python
DATASET_PATH      = "/path/to/raw_dataset"
OUTPUT_BASE_PATH  = "/path/to/autolabel_output"
```

You can mix auto‑labelled and manually‑labelled data; both use the same LabelMe format.

---

### 3.4 Converting LabelMe → COCO

MMDetection expects COCO annotations. Use the included converter:

```bash
python data_tools/convert_labelme_to_coco.py \
  --data_dir /path/to/labelme_dataset \
  --output_dir /path/to/coco_output
```

What it does:

- Recursively scans class‑wise folders: each folder = species.
- For each `*.json`, pairs it with the corresponding `*.jpg`.
- Supports both:
  - `shape_type: "rectangle"` (two points → `[x_min, y_min, width, height]`)
  - `shape_type: "polygon"` (polygon points → segmentation + bbox)
- Splits dataset into **train / val / test** with default ratios 70/15/15.
- Writes:
  - `train_coco.json`
  - `val_coco.json`
  - `test_coco.json`

Example directory structure from the original experiments (replace with your own):

- Input (LabelMe): `/path/to/30speciesset`
- Output (COCO JSONs): `/path/to/30spec-con-rec`

---

## 4. Training with MMDetection (Docker)

You can train in plain Python, but the project standardizes on **Docker** for reproducibility.

### 4.1 Clone MMDetection (if using it as submodule)

Either use the `mmdetection/` subfolder from this repo or clone it alongside:

```bash
git clone https://github.com/open-mmlab/mmdetection.git
cd mmdetection
git checkout v3.3.0   # align with configs
```

### Model Download Links

The pretrained DINO checkpoints used here (MMDetection v3.0):

1. ResNet‑50, 4‑scale, 12 epochs (base for `dino_r50_24e.py`):  
   `https://download.openmmlab.com/mmdetection/v3.0/dino/dino-4scale_r50_8xb2-12e_coco/dino-4scale_r50_8xb2-12e_coco_20221202_182705-55b2bba2.pth`

2. Swin‑Large, 5‑scale, 12 epochs (base for Swin‑L configs):  
   `https://download.openmmlab.com/mmdetection/v3.0/dino/dino-5scale_swin-l_8xb2-12e_coco/dino-5scale_swin-l_8xb2-12e_coco_20230228_072924-a654145f.pth`

After downloading, place them under:

```text
/path/to/mm-det/mmdetection/checkpoints/
```

or any directory you mount into the container as `/workspace/mmdetection/checkpoints`.

---

### 4.2 Build Docker Image (Generic / L40S)

From `mmdetection/`:

```bash
docker build -t mmdetection docker/
```

This installs:

- PyTorch + CUDA
- MMCV
- MMDetection
- All dependencies from the standard MMDetection image.

### 4.3 Build Docker Image (H100 / SM90)

For H100 you must compile MMCV from source with SM90 support and pin NumPy < 2.0.

From `mmdetection/`:

```bash
bash scripts/build_docker_h100.sh
# internally:
# docker build --no-cache -t mmdetection-h100 docker/
```

The H100 Dockerfile should:

- Use `pytorch/pytorch:2.1.2-cuda12.1-cudnn8-devel`
- Set `TORCH_CUDA_ARCH_LIST="9.0"`
- Install `mmengine`, then build `mmcv==2.1.0` from source (no wheels)
- Pin `numpy<2.0` and compatible `opencv-python<4.10`

After build, verify inside the container:

```bash
python scripts/verify_env_h100.py
# prints GPU name, torch/mmcv versions, and runs mmcv.ops.sigmoid_focal_loss on CUDA
```

---

### 4.4 Run Docker Container (Example: 30‑Species on L40S)

```bash
docker run --gpus all --shm-size=8g -it \
  -v /path/to/30speciesset:/workspace/fish_coco \
  -v /path/to/30spec-con-rec:/workspace/fish_coco_json \
  -v $PWD/configs:/workspace/mmdetection/configs \
  -v $PWD/checkpoints:/workspace/mmdetection/checkpoints \
  mmdetection:latest
```

Inside the container, your paths become:

- Images: `/workspace/fish_coco/`
- Annotations:
  - Train: `/workspace/fish_coco_json/train_coco.json`
  - Val:   `/workspace/fish_coco_json/val_coco.json`
- Configs: `/workspace/mmdetection/configs`
- Checkpoints: `/workspace/mmdetection/checkpoints`

---

### 4.5 Train ResNet‑50 Baseline (30 Species)

Inside the container:

```bash
python tools/train.py /workspace/mmdetection/configs/dino_r50_24e.py
```

This config (simplified) does:

- `_base_ = 'dino/dino-4scale_r50_improved_8xb2-12e_coco.py'`
- Sets `bbox_head.num_classes = 30`
- Unfreezes ResNet‑50 backbone (`frozen_stages=-1`)
- Points `train_dataloader` / `val_dataloader` to the COCO JSONs
- Trains for 24 epochs with a MultiStep LR (decay at epoch 18)

Baseline performance (from original runs, 30‑species):

- `AP@[0.50:0.95] ≈ 0.846`
- `AP@0.50 ≈ 0.99`
- `AP@0.75 ≈ 0.977`
- `AR@[0.50:0.95] ≈ 0.89`

---

### 4.6 Train Swin‑L (30 Species, L40S)

Config: `configs/A3_dino_swin_l_60e.py`.

Key differences:

- `_base_ = 'dino/dino-5scale_swin-l_8xb2-12e_coco.py'`
- `bbox_head.num_classes = 30`
- Backbone set to Swin‑L with:
  - `pretrain_img_size=224` to save memory
  - `batch_size=1`
  - `with_cp=True` (gradient checkpointing)
- Uses same COCO JSON paths
- `max_epochs` around 48–60 with LR milestones e.g. `[32, 40, 44]`

Run:

```bash
python tools/train.py /workspace/mmdetection/configs/A3_dino_swin_l_60e.py
```

This is your high‑capacity 30‑species model, used later for OSR inference.

---

### 4.7 Train Swin‑L (30 Species, H100)

Config: `configs/30speciesset_dino_swin_l_36e.py` (despite the name, used for ~80 epochs on H100).

H100 container run:

```bash
docker run --gpus all --shm-size=8g -it \
  -v /path/to/30speciesset:/workspace/data \
  -v /path/to/30spec-con-rec:/workspace/annotations \
  -v /path/to/mm-det/mmdetection/configs:/workspace/configs \
  -v /path/to/mm-det/mmdetection/checkpoints:/workspace/checkpoints \
  mmdetection-h100
```

Then:

```bash
python tools/train.py /workspace/configs/30speciesset_dino_swin_l_36e.py
```

This configuration:

- Uses Swin‑L at **384×384** resolution (H100 memory enables this)
- Larger batch size and extended epochs (up to ~80)
- Trains on 30 classes
- Achieved mAP ≈ 0.86, `AP@0.50 ≈ 0.994`, `AR ≈ 0.90` in the original experiments.

---

### 4.8 Monitoring and Logs

Inside the container:

- Monitor GPU:

```bash
watch -n 1 nvidia-smi
```

- TensorBoard:

```bash
tensorboard --logdir /mmdetection/work_dirs/<your_config_name>/
```

---

## 5. Evaluation & Batch Inference

### 5.1 Test Config (`test30species.py`)

`configs/test30species.py` is a full evaluation config for the Swin‑L 30‑species model.

Key points:

- `model.bbox_head.num_classes = 30`
- `test_dataloader.dataset.data_root = '/workspace/30spec_fish_coco'`
- `test_dataloader.dataset.ann_file = '/workspace/30spec_fish_coco_json/val_coco.json'`
- `metainfo.classes` lists the 30 species in **exact label order**
- Same class list appears for `train_dataloader`, `val_dataloader`, and `test_dataloader` to keep label indices consistent across splits.

Run eval:

```bash
python tools/test.py configs/test30species.py \
  checkpoints/epoch_72.pth \
  --eval bbox
```

### 5.2 Batch Inference Scripts

Use `inference/batch_infer_r50.py` or `inference/batch_infer_swin.py` to run inference over a folder and save annotated outputs + JSONs.

Typical usage:

```bash
python inference/batch_infer_swin.py \
  --config configs/test30species.py \
  --checkpoint checkpoints/epoch_72.pth \
  --input-dir /workspace/test_images \
  --output-dir /workspace/test_results
```

Outputs:

- Images with bounding boxes and labels.
- Aggregate JSON with all detections.

---

## 6. Open‑Set Inference API (FastAPI + 3‑Signal Ensemble)

For production, the preferred entrypoint is the **FastAPI server** implementing an open‑set recognition (OSR) gate on top of the Swin‑L model.

### 6.1 OSR Gate Thresholds

The ensemble gate uses **three signals** and a voting rule:

- **Signal 1 – Confidence:**  
  `CONFIDENCE_THRESHOLD = 0.80`  
  Top softmax score must be ≥ 0.80.

- **Signal 2 – Margin:**  
  `MARGIN_THRESHOLD = 0.10`  
  Difference between top‑1 and top‑2 scores must be ≥ 0.10.

- **Signal 3 – Entropy:**  
  `ENTROPY_THRESHOLD = 1.5`  
  Shannon entropy of the class distribution must be ≤ 1.5.

- **Voting rule:**  
  `MIN_SIGNALS_REQUIRED = 2`  
  At least **2 out of 3** signals must pass for a prediction to be accepted as a known species. Otherwise it is labeled `"unknown"`.

These defaults are data‑driven from validation on known species, unknown species, and non‑fish objects.

### 6.2 Running the FastAPI Server

`inference/app_ensemble.py` is the main server.

1. Make sure the `CONFIG_FILE` and `CHECKPOINT_FILE` at the top point to your trained Swin‑L config and checkpoint, e.g.:

```python
CONFIG_FILE    = "/mmdetection/30speciesset_dino_swin_l_36e/test30.py"
CHECKPOINT_FILE = "/mmdetection/30speciesset_dino_swin_l_36e/epoch_72.pth"
DEVICE         = "cuda:0"
```

2. Install FastAPI deps (inside the container or a separate env):

```bash
pip install fastapi uvicorn scipy opencv-python
# MMDetection + PyTorch already installed in the training docker
```

3. Run the server:

```bash
python inference/app_ensemble.py
# or explicitly:
# uvicorn inference.app_ensemble:app --host 0.0.0.0 --port 8000
```

4. Open in browser:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 6.3 Calling the API

**cURL example:**

```bash
curl -X POST \
  -F "file=@path/to/fish.jpg" \
  "http://localhost:8000/predict"
```

Response structure:

```json
{
  "predicted_fish": "Alepes kleinii" | "unknown",
  "confidence": 0.94,
  "decision_signals": {
    "confidence_ok": true,
    "confidence_value": 0.94,
    "margin_ok": true,
    "margin_value": 0.23,
    "entropy_ok": true,
    "entropy_value": 0.32,
    "signals_passed": 3
  },
  "reasoning": "Top candidate: Alepes kleinii (score: 0.9400), ensemble accepted it: 3 signals passed (need 2)",
  "top_candidate": "Alepes kleinii",
  "num_detections": 1
}
```

You can experiment with thresholds at query‑time:

```bash
curl -X POST \
  -F "file=@fish.jpg" \
  "http://localhost:8000/predict?confidence_th=0.85&margin_th=0.12&entropy_th=1.3&min_signals=3"
```

For tuning guidance, use:

```bash
curl "http://localhost:8000/tune_thresholds"
```

It returns presets for stricter / looser / balanced settings.

---

## 7. (Optional) Text‑Grounded Multimodal Detection

If you include the multimodal extension:

- `inference/text_grounded_infer.py` loads:
  - Swin‑L visual backbone features (P3–P7 pyramid)
  - Species descriptions passed through BERT (e.g., *"12 dorsal spines, coarse gill cover edge, 50–53 lateral line scales"*)
- Cross‑attention layers fuse image and text tokens, improving fine‑grained disambiguation between morphologically similar species (e.g., **Nemipterus japonicus vs N. randalli**, **Sardinella gibbosa vs S. longiceps**).

Usage pattern is similar to `batch_infer_swin.py`, with additional text config (e.g. a YAML of species descriptions).

---

## 8. Reproducing the Full Pipeline (Checklist)

1. **Clone this repo**  
   `git clone https://github.com/<you>/marine-fish-detection-system.git`

2. **Prepare raw dataset**  
   Organize images per species as described in §3.1.

3. **Annotate**  
   - Use LabelMe manually **or** run `data_tools/auto_label_yolov8_vgg16.py`.

4. **Convert to COCO**  
   - Run `data_tools/convert_labelme_to_coco.py` to produce `train_coco.json`, `val_coco.json`, `test_coco.json`.

5. **Build Docker image**  
   - L40S: `docker build -t mmdetection docker/`  
   - H100: `docker build --no-cache -t mmdetection-h100 docker/`

6. **Run container and mount data**  
   - Ensure `/workspace/...` paths in configs match your mounts.

7. **Train models**  
   - ResNet‑50: `dino_r50_24e.py`  
   - Swin‑L 30‑species (L40S): `A3_dino_swin_l_60e.py`  
   - Swin‑L 30‑species (H100): `30speciesset_dino_swin_l_36e.py`

8. **Evaluate and export best checkpoints**  
   - Use `test30species.py` and `tools/test.py`.

9. **Start open‑set API**  
   - Run `inference/app_ensemble.py` with OSR thresholds  
     - confidence ≥ **0.80**  
     - margin ≥ **0.10**  
     - entropy ≤ **1.50**  
     - 2‑of‑3 signals must pass.

10. **Integrate with UI**  
    - Frontend/React or any client can call `/predict` and display species name or `"unknown"` with explanation.

---

## 9. License and Third‑Party Components

### 9.1 Repository License

Copyright (c) 2026 Frontier Business System.

All rights reserved.

This repository is provided to \<CMFRI\> under the terms of the Master Services Agreement and associated Statement(s) of Work between Frontier Business Systems and \<CMFRI\>. No part of this software may be redistributed, sublicensed, or used outside that agreement without prior written consent from Frontier Business Sytemss.

Unless explicitly stated otherwise in a file header, all code in this repository is owned by TechDataVault.

### 9.2 Third‑Party Components

This project depends on several third‑party libraries and tools which are **not** redistributed in this repository. Users are responsible for installing them separately and complying with their licenses:

- **MMDetection / MMCV / MMEngine** – OpenMMLab object detection framework and dependencies (Apache‑2.0 license).
- **LabelMe** – Image annotation tool used for bounding‑box labeling.
- **Ultralytics YOLOv8** – Detection model used in the optional auto‑labelling pipeline (AGPL‑3.0 or commercial Enterprise license).
- **PyTorch** and related ecosystem packages (CUDA, cuDNN, etc.).

Before deploying or redistributing any system built from this repository, ensure that your use of these third‑party components is compatible with their respective licenses and, where applicable, that you have obtained appropriate commercial licenses.

---

With this README, someone new to the project—but familiar with Docker, PyTorch, and basic ML workflows—should be able to **reproduce the full iMATSYA pipeline end‑to‑end** on their own hardware.
