import os
import cv2
import json
import numpy as np
from mmdet.apis import init_detector, inference_detector

# --- Make sure these are your actual 30 species in training order ---
SPECIES = [
    'Alepes kleinii', 'Amphioctopus neglectus', 'Anodontostoma chacunda', 'Caranx heberi', 'Epinephelus diacanthus', 'Escualosa thoracata',
    'Euthynnus affinis', 'Gerres filamentosus', 'Harpadon nehereus', 'Lactarius lactarius', 'Megalaspis cordyla', 'Mene maculata',
    'Nemipterus japonicus', 'Nemipterus randalli', 'Odonus niger', 'Otolithes ruber', 'Pampus argenteus', 'Parastromateus niger',
    'Polynemus paradiseus', 'Portunus sanguinolentus', 'Priacanthus hamrur', 'Rachycentron canadum', 'Rastrelliger kanagurta',
    'Sardinella gibbosa', 'Sardinella longiceps', 'Scomberomorus commerson', 'Selar crumenophthalmus', 'Stolephorus indicus',
    'Terapon jarbua', 'Uroteuthis duvaucelii'
]

config_file = '/workspace/configs/dino_swin_l_36e.py'
checkpoint_file = '/workspace/checkpoints/epoch_48.pth'
img_root = '/workspace/test_images'
output_root = '/workspace/test_results_swinl'
os.makedirs(output_root, exist_ok=True)

model = init_detector(config_file, checkpoint_file, device='cuda')
results_json = []

def draw_boxes(image, bboxes, labels, scores, score_thr=0.3):
    for bbox, label, score in zip(bboxes, labels, scores):
        if score < score_thr:
            continue
        x1, y1, x2, y2 = map(int, bbox)
        color = (0, 255, 0)
        label_name = SPECIES[label] if 0 <= label < len(SPECIES) else f'class {label}'
        label_text = f'{label_name}: {score*100:.1f}'
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        (text_width, text_height), baseline = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
        cv2.rectangle(image, (x1, y1 - text_height - 8), (x1 + text_width, y1), color, -1)
        cv2.putText(image, label_text, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
    return image

for folder in os.listdir(img_root):
    img_folder = os.path.join(img_root, folder)
    if not os.path.isdir(img_folder):
        continue
    for img_file in os.listdir(img_folder):
        if img_file.startswith('.'):
            continue
        img_path = os.path.join(img_folder, img_file)
        if not os.path.isfile(img_path):
            continue

        result = inference_detector(model, img_path)
        # For MMDetection 3.x: result is DetDataSample
        pred_instances = result.pred_instances
        bboxes = pred_instances.bboxes.cpu().numpy() if hasattr(pred_instances, "bboxes") else np.empty((0, 4))
        labels = pred_instances.labels.cpu().numpy() if hasattr(pred_instances, "labels") else np.empty((0,))
        scores = pred_instances.scores.cpu().numpy() if hasattr(pred_instances, "scores") else np.empty((0,))
        keep_idx = scores >= 0.3
        bboxes = bboxes[keep_idx]
        labels = labels[keep_idx]
        scores = scores[keep_idx]

        img = cv2.imread(img_path)
        if bboxes.shape[0] > 0:
            img_annot = draw_boxes(img.copy(), bboxes, labels, scores)
        else:
            img_annot = img
        out_img_name = f'{folder}_{img_file}'
        out_img_path = os.path.join(output_root, out_img_name)
        cv2.imwrite(out_img_path, img_annot)

        entry = {
            "image_file": img_file,
            "image_path": img_path,
            "detected_species": [SPECIES[label] for label in labels if 0 <= label < len(SPECIES)],
            "detected_species_ids": [int(label) for label in labels if 0 <= label < len(SPECIES)],
            "detected_scores": [float(f'{score:.4f}') for score in scores],
            "output_image": out_img_path
        }
        results_json.append(entry)

json_save_path = os.path.join(output_root, "inference_report.json")
with open(json_save_path, 'w') as f:
    json.dump(results_json, f, indent=2)

print(f"Inference complete. Annotated images and JSON report saved in {output_root}")
