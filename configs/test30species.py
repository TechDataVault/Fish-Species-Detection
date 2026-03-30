import os
import cv2
import json
import numpy as np
from mmdet.apis import init_detector, inference_detector

SPECIES = [
    'Alepes kleinii',
    'Amphioctopus neglectus',
    'Atropus Atropus',
    'Caranx heberi',
    'Decapterus',
    'Epinephelus diacanthus',
    'Escualosa thoracata',
    'Fistularia petimba',
    'Gerres filamentoses',
    'Grammoplites suppositus',
    'Mene maculata',
    'Nemipterus japonicus',
    'Nemipterus randalli',
    'Odonus niger',
    'Otolithes ruber',
    'Pampus argenteus',
    'Parastromateus niger',
    'Plotosus lineatus',
    'Portunus sanguinolentus',
    'Priacanthus hamrur',
    'Pterois spp',
    'Rastrelliger kanagurta',
    'Sardinella longiceps',
    'Scomberomorus commerson',
    'Selar crumenophthalmus',
    'Stolephorus indicus',
    'Terapon jarbua',
    'Thenus unimaculatus',
    'Uroteuthis duvaucelii',
    'lactarius lactarius',

]

config_file = '/workspace/configs/30speciesset_dino_swin_l_30.py'
checkpoint_file = '/workspace/checkpoints/epoch_72.pth'

img_root = '/workspace/untrained_images'
output_root = '/workspace/untrainedoutput'
os.makedirs(output_root, exist_ok=True)

model = init_detector(config_file, checkpoint_file, device= 'cuda')
results_json = []

def draw_boxes(image, bboxes, labels, scores, score_thr=0.3):
    for bbox, label, score in zip(bboxes, labels, scores):
        if score < score_thr:
            continue

        x1, y1, x2, y2 = map(int, bbox)
        color = (0, 255, 0)

        class_name = SPECIES[label] if 0 <= label < len(SPECIES) else f'class_{label}'
        label_text = f'{class_name}: {score * 100:.1f}%'

        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
        cv2.rectangle(image, (x1, y1 - th - 8), (x1 + tw, y1), color, -1)
        cv2.putText(
            image,
            label_text,
            (x1, y1 - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 0, 0),
            2
        )
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
        pred_instances = result.pred_instances

        bboxes = pred_instances.bboxes.cpu().numpy() if hasattr(pred_instances, "bboxes") else np.empty((0, 4))
        labels = pred_instances.labels.cpu().numpy() if hasattr(pred_instances, "labels") else np.empty((0,))
        scores = pred_instances.scores.cpu().numpy() if hasattr(pred_instances, "scores") else np.empty((0,))

        keep = scores >= 0.3
        bboxes = bboxes[keep]
        labels = labels[keep]
        scores = scores[keep]

        img = cv2.imread(img_path)
        img_annot = draw_boxes(img.copy(), bboxes, labels, scores) if len(bboxes) > 0 else img

        out_img_name = f'{folder}_{img_file}'
        out_img_path = os.path.join(output_root, out_img_name)
        cv2.imwrite(out_img_path, img_annot)

        results_json.append({
            "image_file": img_file,
            "image_path": img_path,
            "detected_species": [SPECIES[l] for l in labels],
            "detected_species_ids": [int(l) for l in labels],
            "detected_scores": [float(f'{s:.4f}') for s in scores],
            "output_image": out_img_path
        })

# =========================================================
# 🔹 Save JSON report
# =========================================================
json_path = os.path.join(output_root, "inference_report.json")
with open(json_path, "w") as f:
    json.dump(results_json, f, indent=2)

print(f"✅ Inference complete. Results saved to: {output_root}")
