import os
import cv2
import json
import base64
import numpy as np
from ultralytics import YOLO
from tqdm import tqdm
from tensorflow.keras.applications.vgg16 import VGG16, preprocess_input
import tensorflow as tf

# ==============================
# Configuration
# ==============================
DATASET_PATH = "/home/ubuntu/A4/AutoLabel"   # Input dataset directory
OUTPUT_BASE_PATH = "/home/ubuntu/A4/AutoLabel_Output"  # Output directory

os.makedirs(OUTPUT_BASE_PATH, exist_ok=True)

# ==============================
# TensorFlow Fix: Disable GPU for VGG16
# ==============================
# This prevents CUDA handle errors on L40/L4 GPUs
tf.config.set_visible_devices([], 'GPU')
print("✅ TensorFlow GPU disabled for VGG16 (YOLO still uses GPU)")

# ==============================
# Load Models
# ==============================
print("🔄 Loading models...")
model_yolo = YOLO('yolov8n.pt')  # 'yolov8m.pt' = higher accuracy but slower
vgg_model = VGG16(weights='imagenet', include_top=True)
print("✅ Models loaded successfully!\n")

# Optional mapping (customize as needed)
idx_to_class = {0: "fish"}

# ==============================
# Helper: Select one box or fallback
# ==============================
def get_main_box(boxes, img_w, img_h):
    """Selects the largest bounding box or defaults to 90% of the image."""
    if len(boxes) == 0:
        # fallback: use 90% of image area
        return [int(0.05 * img_w), int(0.05 * img_h),
                int(0.95 * img_w), int(0.95 * img_h)]
    # select largest bounding box
    areas = [(b[2] - b[0]) * (b[3] - b[1]) for b in boxes]
    return boxes[np.argmax(areas)]

# ==============================
# Main Loop
# ==============================
for folder in tqdm(os.listdir(DATASET_PATH), desc="Processing folders"):
    class_folder = os.path.join(DATASET_PATH, folder)
    if not os.path.isdir(class_folder):
        continue

    # Create same folder in output
    out_class_folder = os.path.join(OUTPUT_BASE_PATH, folder)
    os.makedirs(out_class_folder, exist_ok=True)

    for img_name in tqdm(os.listdir(class_folder), desc=f"{folder}", leave=False):
        img_path = os.path.join(class_folder, img_name)
        img = cv2.imread(img_path)
        if img is None:
            print(f"⚠️ Skipping unreadable image: {img_path}")
            continue

        img_h, img_w = img.shape[:2]

        # --- YOLO detection ---
        results = model_yolo(img, imgsz=640, verbose=False)
        detections = []
        for r in results:
            for b in r.boxes.xyxy.cpu().numpy():
                detections.append(b.tolist())

        # --- Select main bounding box or fallback ---
        x1, y1, x2, y2 = map(int, get_main_box(detections, img_w, img_h))

        # --- Crop and classify (VGG16) ---
        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            print(f"⚠️ Empty crop for {img_name}, skipping...")
            continue
        crop = cv2.resize(crop, (224, 224))
        crop_arr = np.expand_dims(preprocess_input(np.array(crop, dtype=np.float32)), axis=0)
        preds = vgg_model.predict(crop_arr, verbose=0)
        pred_class = idx_to_class.get(np.argmax(preds), folder)
        pred_conf = float(np.max(preds))

        # ==============================
        # Encode image as Base64 (for LabelMe JSON)
        # ==============================
        _, buffer = cv2.imencode(".jpg", img)
        image_base64 = base64.b64encode(buffer).decode("utf-8")

        # ==============================
        # Create LabelMe JSON structure
        # ==============================
        labelme_json = {
            "version": "5.8.1",
            "flags": {},
            "shapes": [
                {
                    "label": pred_class,
                    "points": [
                        [float(x1), float(y1)],
                        [float(x2), float(y2)]
                    ],
                    "group_id": None,
                    "description": "",
                    "shape_type": "rectangle",
                    "flags": {}
                }
            ],
            "imagePath": img_name,
            "imageData": image_base64,  # embedded Base64 image
            "imageHeight": img_h,
            "imageWidth": img_w
        }

        # ==============================
        # Save JSON file
        # ==============================
        json_path = os.path.join(out_class_folder, f"{os.path.splitext(img_name)[0]}.json")
        with open(json_path, "w") as f:
            json.dump(labelme_json, f, indent=4)

        # ==============================
        # Save Original (raw) image
        # ==============================
        raw_img_path = os.path.join(out_class_folder, img_name)
        cv2.imwrite(raw_img_path, img)

        # ==============================
        # Save Labeled (boxed) image
        # ==============================
        labeled_img = img.copy()
        cv2.rectangle(labeled_img, (x1, y1), (x2, y2), (0, 255, 0), 3)
        label_text = f"{pred_class} ({pred_conf:.2f})"
        cv2.putText(labeled_img, label_text, (x1 + 5, y1 + 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        labeled_img_path = os.path.join(out_class_folder, f"{os.path.splitext(img_name)[0]}_labeled.jpg")
        cv2.imwrite(labeled_img_path, labeled_img)

        print(f"✅ Saved:\n   🖼️ Raw: {raw_img_path}\n   🟩 Labeled: {labeled_img_path}\n   📄 JSON: {json_path}")

print("\n🎉 All done! Raw images, labeled images, and LabelMe JSON files saved to:")
print(OUTPUT_BASE_PATH)

