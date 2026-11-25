"""Build offline contours from BrainGlobe mpin_zfish v3.0 (1 µm ASR)."""
import itertools
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import requests
from numcodecs import Blosc, Zstd
from skimage.measure import approximate_polygon, find_contours

URL = ("https://brainglobe.s3.us-west-2.amazonaws.com/atlas/annotation-sets/"
       "mpin_zfish-annotation/3_0/annotations.ome.zarr")
SIZE = (974, 359, 597)
STEP = 8


def download(key):
    response = requests.get(f"{URL}/{key}", timeout=45)
    if response.status_code == 404 and key.startswith("s0/c/"):
        return None  # Omitted Zarr chunks contain the declared zero fill value.
    response.raise_for_status()
    return response.content


ids = list(np.frombuffer(Zstd().decode(download("annotation_values/c/0")), dtype="<u4"))


def mask(region):
    channel = ids.index(region)
    volume = np.zeros(tuple((s + STEP - 1) // STEP for s in SIZE), dtype=bool)

    def chunk_at(index):
        key = "/".join(map(str, index))
        raw = download(f"s0/c/{channel}/{key}")
        if raw is None:
            return index, np.zeros((32,) * 3, dtype=bool)
        return index, np.frombuffer(Blosc().decode(raw), dtype=np.uint8).reshape((256,) * 3)[::STEP, ::STEP, ::STEP]

    with ThreadPoolExecutor(6) as pool:
        for idx, data in pool.map(chunk_at, itertools.product(range(4), range(2), range(3))):
            dest = tuple(slice(i * 32, (i + 1) * 32) for i in idx)
            volume[dest] = data[tuple(slice(0, n) for n in volume[dest].shape)]
    assert volume.any(), region
    return volume


layers = {}
dorsal = {}
for name, region in [("forebrain", 893), ("midbrain", 896), ("hindbrain", 897), ("retina", 808), ("neuropil", 832)]:
    volume = mask(region)
    contours = []
    for ap in range(0, len(volume), 3):
        for ring in find_contours(np.pad(volume[ap], 1), 0.5):
            if len(ring) < 9:
                continue
            polygon = approximate_polygon(ring, tolerance=0.7)
            contours.append([[ap * STEP, round((dv-1)*STEP), round((lr-1)*STEP)] for dv,lr in polygon])
    layers[name] = contours
    dorsal[name] = []
    for dv in range(0, volume.shape[1], 4):
        for ring in find_contours(np.pad(volume[:, dv, :], 1), 0.5):
            if len(ring) >= 9:
                dorsal[name].append([[round((ap-1)*STEP), dv*STEP, round((lr-1)*STEP)]
                                     for ap,lr in approximate_polygon(ring, tolerance=0.7)])
    print(name, len(contours), flush=True)

# Project the modeled sheet onto the dorsal surface of the anatomical right neuropil.
volume[:, :, (SIZE[2] // 2) // STEP:] = False
ap_indices = np.where(volume.any(axis=(1, 2)))[0]
surface = []
for col in range(33):
    ap = int(np.quantile(ap_indices, 0.06 + 0.88 * col / 32, method="nearest"))
    lateral = np.where(volume[ap].any(axis=0))[0]
    for row in range(17):
        lr = int(np.quantile(lateral, 0.04 + 0.92 * row / 16, method="nearest"))
        dv = np.where(volume[ap, :, lr])[0][0]
        surface.append([int(ap*STEP), int(dv*STEP), int(lr*STEP)])
Path("brain-atlas.js").write_text("const BrainAtlas = " + json.dumps(
    {"contours": layers, "dorsal": dorsal, "surface": surface}, separators=(",", ":")) + ";\n")
