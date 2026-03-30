import os
import os.path as osp
import json
from mmengine.fileio import dump
from mmcv.utils import track_iter_progress
from sklearn.model_selection import train_test_split
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

def convert_labelme_to_coco(data_dir, output_dir, train_ratio=0.7, val_ratio=0.15, test_ratio=0.15, categories=None):
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, "Ratios must sum to 1"
    if categories is None:
        categories = sorted(os.listdir(data_dir))
    category2id = {cat: i for i, cat in enumerate(categories)}

    samples = []
    for category in categories:
        category_folder = osp.join(data_dir, category)
        if not osp.isdir(category_folder):
            continue
        for fname in os.listdir(category_folder):
            if fname.endswith('.json'):
                img_fname = fname.replace('.json', '.jpg')
                img_path = osp.join(category_folder, img_fname)
                json_path = osp.join(category_folder, fname)
                if osp.exists(img_path):
                    samples.append((img_path, json_path, category))

    print(f"Total samples found: {len(samples)}")

    train_samples, tmp_samples = train_test_split(samples, train_size=train_ratio, random_state=42, shuffle=True)
    val_samples, test_samples = train_test_split(tmp_samples, train_size=val_ratio/(val_ratio + test_ratio),
                                                random_state=42, shuffle=True)

    splits = {'train': train_samples, 'val': val_samples, 'test': test_samples}
    os.makedirs(output_dir, exist_ok=True)

    for split_name, sample_list in splits.items():
        images = []
        annotations = []
        image_id = 0
        annotation_id = 0

        for img_path, json_path, category in track_iter_progress(sample_list):
            img = Image.open(img_path)
            width, height = img.size

            images.append(dict(id=image_id, file_name=os.path.relpath(img_path, data_dir), height=height, width=width))

            with open(json_path, 'r') as f:
                labelme_data = json.load(f)

            for shape in labelme_data.get('shapes', []):
                shape_type = shape.get('shape_type', '').lower()
                if shape_type == 'rectangle':
                    points = shape['points']
                    x_min = min(points[0][0], points[1][0])
                    y_min = min(points[0][1], points[1][1])
                    x_max = max(points[0][0], points[1][0])
                    y_max = max(points[0][1], points[1][1])
                    bbox = [x_min, y_min, x_max - x_min, y_max - y_min]
                    area = bbox[2] * bbox[3]

                    segmentation = [
                        x_min, y_min,
                        x_max, y_min,
                        x_max, y_max,
                        x_min, y_max
                    ]

                    annotations.append(dict(
                        id=annotation_id,
                        image_id=image_id,
                        category_id=category2id[category],
                        bbox=bbox,
                        area=area,
                        segmentation=[segmentation],
                        iscrowd=0
                    ))
                    annotation_id += 1

                elif shape_type == 'polygon':
                    points = shape['points']
                    segmentation = []
                    for x, y in points:
                        segmentation.extend([x, y])
                    x_coords = [p[0] for p in points]
                    y_coords = [p[1] for p in points]
                    x_min, y_min, x_max, y_max = min(x_coords), min(y_coords), max(x_coords), max(y_coords)
                    bbox = [x_min, y_min, x_max - x_min, y_max - y_min]
                    area = bbox[2] * bbox[3]

                    annotations.append(dict(
                        id=annotation_id,
                        image_id=image_id,
                        category_id=category2id[category],
                        bbox=bbox,
                        area=area,
                        segmentation=[segmentation],
                        iscrowd=0
                    ))
                    annotation_id += 1

            image_id += 1

        coco_output = dict(
            images=images,
            annotations=annotations,
            categories=[{'id': v, 'name': k, 'supercategory': 'fish'} for k, v in category2id.items()]
        )
        out_file = osp.join(output_dir, f"{split_name}_coco.json")
        dump(coco_output, out_file)
        print(f"Saved {split_name} set with {len(images)} images and {len(annotations)} annotations to {out_file}")

if __name__ == '__main__':
    data_dir = '/home/ubuntu/30speciesset'
    output_dir = '/home/ubuntu/30spec-con-rec'
    categories = sorted(os.listdir(data_dir))
    convert_labelme_to_coco(data_dir, output_dir, categories=categories)
