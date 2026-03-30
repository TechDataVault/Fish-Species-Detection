_base_ = 'dino/dino-4scale_r50_improved_8xb2-12e_coco.py'

max_epochs = 24

model = dict(
    bbox_head=dict(num_classes=30),
    backbone=dict(frozen_stages=-1),  # unfrozen backbone
)

train_dataloader = dict(
    batch_size=2,
    dataset=dict(
        data_root='/workspace/fish_coco',
        ann_file='/workspace/fish_coco_json/train_coco.json',
        data_prefix=dict(img=''),
        metainfo=dict(classes=[  # list your 30 fish species
            'Alepes kleinii', 'Amphioctopus neglectus', 'Anodontostoma chacunda', 'Caranx heberi', 'Epinephelus diacanthus', 'Escualosa thoracata',
            'Euthynnus affinis', 'Gerres filamentosus', 'Harpadon nehereus', 'Lactarius lactarius',
            'Megalaspis cordyla', 'Mene maculata', 'Nemipterus japonicus', 'Nemipterus randalli', 'Odonus niger',
            'Otolithes ruber', 'Pampus argenteus', 'Parastromateus niger', 'Polynemus paradiseus', 'Portunus sanguinolentus',
            'Priacanthus hamrur', 'Rachycentron canadum', 'Rastrelliger kanagurta', 'Sardinella gibbosa', 'Sardinella longiceps',
            'Scomberomorus commerson', 'Selar crumenophthalmus', 'Stolephorus indicus', 'Terapon jarbua', 'Uroteuthis duvaucelii',
        ])
    )
)

val_dataloader = dict(
    dataset=dict(
        data_root='/workspace/fish_coco',
        ann_file='/workspace/fish_coco_json/val_coco.json',
        data_prefix=dict(img=''),
        metainfo=dict(classes=[
            'Alepes kleinii', 'Amphioctopus neglectus', 'Anodontostoma chacunda', 'Caranx heberi', 'Epinephelus diacanthus', 'Escualosa thoracata',
            'Euthynnus affinis', 'Gerres filamentosus', 'Harpadon nehereus', 'Lactarius lactarius',
            'Megalaspis cordyla', 'Mene maculata', 'Nemipterus japonicus', 'Nemipterus randalli', 'Odonus niger',
            'Otolithes ruber', 'Pampus argenteus', 'Parastromateus niger', 'Polynemus paradiseus', 'Portunus sanguinolentus',
            'Priacanthus hamrur', 'Rachycentron canadum', 'Rastrelliger kanagurta', 'Sardinella gibbosa', 'Sardinella longiceps',
            'Scomberomorus commerson', 'Selar crumenophthalmus', 'Stolephorus indicus', 'Terapon jarbua', 'Uroteuthis duvaucelii',
        ])
    )
)

test_dataloader = val_dataloader

val_evaluator = dict(ann_file='/workspace/fish_coco_json/val_coco.json')

test_evaluator = val_evaluator

train_cfg = dict(type='EpochBasedTrainLoop', max_epochs=max_epochs, val_interval=1)

param_scheduler = [
    dict(
        type='MultiStepLR',
        begin=0,
        end=max_epochs,
        milestones=[18],
        gamma=0.1,
        by_epoch=True)
]

load_from = '/workspace/mmdetection/checkpoints/dino-4scale_r50_8xb2-12e_coco_20221202_182705-55b2bba2.pth'  # specify your checkpoint here
