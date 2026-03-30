# LabelMe to COCO Converter

## 📌 Overview

This script converts **LabelMe annotations (JSON format)** into **COCO format**, supporting both:

* Rectangle annotations
* Polygon annotations

It also automatically splits the dataset into:

* Train
* Validation
* Test sets

---

## 🎯 Features

* Converts LabelMe JSON → COCO JSON
* Supports **bounding boxes** and **segmentation masks**
* Automatic dataset split (train/val/test)
* Handles large images (`PIL.Image.MAX_IMAGE_PIXELS = None`)
* Category mapping based on folder names

---

## 📂 Expected Input Directory Structure

```
data_dir/
├── class_1/
│   ├── image1.jpg
│   ├── image1.json
│   ├── image2.jpg
│   └── image2.json
├── class_2/
│   ├── image3.jpg
│   ├── image3.json
│   └── ...
```

👉 Each folder represents a **category (class)**

---

## 📤 Output

The script generates COCO annotation files:

```
output_dir/
├── train_coco.json
├── val_coco.json
└── test_coco.json
```

---

## ⚙️ Installation

Install required dependencies:

```bash
pip install mmengine mmcv scikit-learn pillow
```

---

## 🚀 Usage

Update paths in the script:

```python
data_dir = '/path/to/your/dataset'
output_dir = '/path/to/save/coco/files'
```

Then run:

```bash
python convert_labelme_to_coco.py
```

---

## ⚙️ Parameters

| Parameter     | Description             | Default       |
| ------------- | ----------------------- | ------------- |
| `data_dir`    | Input dataset directory | Required      |
| `output_dir`  | Output COCO directory   | Required      |
| `train_ratio` | Train split ratio       | 0.7           |
| `val_ratio`   | Validation split ratio  | 0.15          |
| `test_ratio`  | Test split ratio        | 0.15          |
| `categories`  | List of class names     | Auto-detected |

---

## 🧠 How It Works

1. Reads all LabelMe JSON files
2. Matches each JSON with corresponding image
3. Extracts:

   * Bounding boxes
   * Segmentation polygons
4. Converts annotations into COCO format
5. Splits dataset into train/val/test
6. Saves JSON files

---

## 📝 Supported Annotation Types

### ✅ Rectangle

Converted to:

* Bounding box
* 4-point segmentation

### ✅ Polygon

Converted to:

* Bounding box
* Polygon segmentation

---

## ⚠️ Notes

* Image name must match JSON name
  (`image.jpg` ↔ `image.json`)
* Only `.jpg` images are supported (modify if needed)
* Ensure dataset is clean (no missing files)

---

## 📊 Example Output (COCO Format)

```json
{
  "images": [...],
  "annotations": [...],
  "categories": [...]
}
```

---

## 🔥 Use Cases

* Object detection training (MMDetection, YOLO, etc.)
* Instance segmentation tasks
* Dataset preprocessing pipelines

---

## 👩‍💻 Author

Developed for marine species detection and general object detection workflows.

---
