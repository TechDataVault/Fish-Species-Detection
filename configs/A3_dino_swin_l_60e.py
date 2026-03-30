_base_ = 'dino/dino-5scale_swin-l_8xb2-12e_coco.py'

max_epochs = 60

model = dict(
    bbox_head=dict(num_classes=110),
    backbone=dict(
        _delete_=True,
        type='SwinTransformer',
        pretrain_img_size=224,
        embed_dims=192,
        depths=[2, 2, 18, 2],
        num_heads=[6, 12, 24, 48],
        window_size=12,
        mlp_ratio=4,
        qkv_bias=True,
        drop_rate=0.,
        attn_drop_rate=0.,
        drop_path_rate=0.1,
        patch_norm=True,
        out_indices=(0, 1, 2, 3),
        with_cp=True,
        convert_weights=True,
        frozen_stages=-1,
    )
)

train_dataloader = dict(
    batch_size=1,
    dataset=dict(
        data_root='/workspace/A3-model-species',
        ann_file='/workspace/A3-model-species_json/train_coco.json',
        data_prefix=dict(img=''),
        metainfo=dict(classes=[
    'Acanthurus mata','Diagramma spp','Metapenaeus monoceros','Portunus gladiator','Sepiella spp',
    'Alectis ciliaris','Diodon spp','Minous spp','Portunus pelagicus','Sepioteuthis lessoniana',
    'Alectis indica','Elagatis bipinnulata','Mobula mobular','Priacanthus spp','Seriolina nigrofasciata',
    'Alectis spp','Epinephelus chlorostigma','Mugil spp','Pristipomoides spp','Setipinna spp',
    'Amphioctopus marginatus','Epinephelus longispinis','Muraenesox spp','Psenopsis cyanea','Siganus canaliculatus',
    'Amphioctopus spp','Fistularia petimba','Ostichthys spp','Pseudorhombus spp','Sillago spp',
    'Apogonichthyoides sialis','Fistularia spp','Ostorhinchus fleurieu','Pseudorhombus triocellatus','Solea ovata',
    'Apogonichthyoides spp','Galeocerdo cuvier','Otolithes spp','Pterois spp','Solenocera spp',
    'Ariosoma maurostigma','Gymnothorax reticularis','Panulirus spp','Rastrelliger spp','Sphyraena obtusata',
    'Aristeus alcocki','Gymnothorax spp','Parapenaeopsis maxillipedo','Rhizoprionodon acutus','Sphyraena putnamae',
    'Arius maculatus','Hemiramphus lutkei','Parascolopsis aspinosa','Sarda orientalis','Sphyraena spp',
    'Arius spp','Hemiramphus spp','Parastromateus spp','Sargocentron rubrum','Sphyrna lewini',
    'Arius subrostratus','Himantura tutul','Penaeus indicus','Saurida spp','Stolephorus baganensis',
    'Brevitrygon imbricata','Johnius belangerii','Penaeus monodon','Saurida undosquamis','Strongylura strongylura',
    'Brevitrygon spp','Johnius carutta','Penaeus semisulcatus','Scoliodon laticaudus','Synaptura commersonnii',
    'Calappa bilineata','Lagocephalus guentheri','Pinjalo pinjalo','Scolopsis vosmeri','Triacanthus nieuhofii',
    'Calappa lophos','Lagocephalus spp','Pinjalo spp','Scomberoides spp','Triacanthus spp',
    'Carangoides talamparoides','Loliolus hardwickei','Plesionika quasigrandis','Scomberoides tol','Upeneus supravittatus',
    'Cephalopholis sonnerati','Lophiodes spp','Plotosus lineatus','Secutor ruconius','Uroteuthis spp',
    'Chaetodon collare','Lutjanus argentimaculatus','Pomadasys furcatus','Secutor spp','Zenarchopterus spp',
    'Charybdis smithii','Lutjanus lemniscatus','Pomadasys maculatus','Selaroides leptolepis','metapenaeopsis stridulans',
    'Cynoglossus bilineatus','Megalaspis spp','Pomadasys spp','Sepiella inermis','samaris cristatus'
            
        ])
    )
)

val_dataloader = dict(
    dataset=dict(
        data_root='/workspace/A3-model-species',
        ann_file='/workspace/A3-model-species_json/val_coco.json',
        data_prefix=dict(img=''),
        metainfo=dict(classes=[
    'Acanthurus mata','Diagramma spp','Metapenaeus monoceros','Portunus gladiator','Sepiella spp',
    'Alectis ciliaris','Diodon spp','Minous spp','Portunus pelagicus','Sepioteuthis lessoniana',
    'Alectis indica','Elagatis bipinnulata','Mobula mobular','Priacanthus spp','Seriolina nigrofasciata',
    'Alectis spp','Epinephelus chlorostigma','Mugil spp','Pristipomoides spp','Setipinna spp',
    'Amphioctopus marginatus','Epinephelus longispinis','Muraenesox spp','Psenopsis cyanea','Siganus canaliculatus',
    'Amphioctopus spp','Fistularia petimba','Ostichthys spp','Pseudorhombus spp','Sillago spp',
    'Apogonichthyoides sialis','Fistularia spp','Ostorhinchus fleurieu','Pseudorhombus triocellatus','Solea ovata',
    'Apogonichthyoides spp','Galeocerdo cuvier','Otolithes spp','Pterois spp','Solenocera spp',
    'Ariosoma maurostigma','Gymnothorax reticularis','Panulirus spp','Rastrelliger spp','Sphyraena obtusata',
    'Aristeus alcocki','Gymnothorax spp','Parapenaeopsis maxillipedo','Rhizoprionodon acutus','Sphyraena putnamae',
    'Arius maculatus','Hemiramphus lutkei','Parascolopsis aspinosa','Sarda orientalis','Sphyraena spp',
    'Arius spp','Hemiramphus spp','Parastromateus spp','Sargocentron rubrum','Sphyrna lewini',
    'Arius subrostratus','Himantura tutul','Penaeus indicus','Saurida spp','Stolephorus baganensis',
    'Brevitrygon imbricata','Johnius belangerii','Penaeus monodon','Saurida undosquamis','Strongylura strongylura',
    'Brevitrygon spp','Johnius carutta','Penaeus semisulcatus','Scoliodon laticaudus','Synaptura commersonnii',
    'Calappa bilineata','Lagocephalus guentheri','Pinjalo pinjalo','Scolopsis vosmeri','Triacanthus nieuhofii',
    'Calappa lophos','Lagocephalus spp','Pinjalo spp','Scomberoides spp','Triacanthus spp',
    'Carangoides talamparoides','Loliolus hardwickei','Plesionika quasigrandis','Scomberoides tol','Upeneus supravittatus',
    'Cephalopholis sonnerati','Lophiodes spp','Plotosus lineatus','Secutor ruconius','Uroteuthis spp',
    'Chaetodon collare','Lutjanus argentimaculatus','Pomadasys furcatus','Secutor spp','Zenarchopterus spp',
    'Charybdis smithii','Lutjanus lemniscatus','Pomadasys maculatus','Selaroides leptolepis','metapenaeopsis stridulans',
    'Cynoglossus bilineatus','Megalaspis spp','Pomadasys spp','Sepiella inermis','samaris cristatus'
        ])
    )
)

test_dataloader = val_dataloader

val_evaluator = dict(ann_file='/workspace/A3-model-species_json/val_coco.json')

test_evaluator = val_evaluator

train_cfg = dict(type='EpochBasedTrainLoop', max_epochs=max_epochs, val_interval=2)

param_scheduler = [
    dict(
        type='MultiStepLR',
        begin=0,
        end=max_epochs,
        milestones=[32, 40, 44],
        gamma=0.1,
        by_epoch=True)
]

load_from = '/workspace/mmdetection/checkpoints/dino-5scale_swin-l_8xb2-12e_coco_20230228_072924-a654145f.pth'

