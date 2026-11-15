"""Stage 1 on real retina cells, tier S, as a Neuro-Workflow graph.

    Loader -> Split -> Tokenizer -> Train -> Embed -> Probe               the model
    Train -> Embed (untrained weights) -> Probe                          control: what training adds
    Embed -> Probe with permuted training labels                         control: must fail
    Split -> PCA -> Probe                                                the baseline

Data: GSE239410, single-nucleus RNA of the zebrafish retina (Lyu et al. 2023).
The benchmarks are fixed in STAGE1-RETINA.md. Run from the zebrafish-brain-fm folder:

    uv run python workflows/stage1_retina_tier_s.py --tiny
    uv run python workflows/stage1_retina_tier_s.py --steps 3000 --ceiling 45 --seed 0
"""

import json
import sys
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import f1_score

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "nodes"))

from neuroworkflow import WorkflowBuilder  # noqa: E402

from cell_type_probe import CellTypeProbeNode  # noqa: E402
from embed_cells import EmbedCellsNode  # noqa: E402
from encoder_train import EncoderTrainNode  # noqa: E402
from mtx_atlas_loader import MtxAtlasLoaderNode  # noqa: E402
from pca_features import PcaFeaturesNode  # noqa: E402
from rank_tokenizer import RankTokenizerNode  # noqa: E402
from sample_split import SampleSplitNode  # noqa: E402


def option(flag, default):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


tiny = "--tiny" in sys.argv
seed = int(option("--seed", 0))
n_cells = 1000 if tiny else int(option("--cells", 10000))
name = "stage1_retina_tiny" if tiny else f"stage1_retina_tier_s_seed{seed}"
raw, derived, run = ROOT / "data" / "raw" / "GSE239410", ROOT / "data" / "derived", ROOT / "runs" / name
stem = "GSE239410_muti_omic_injury_snRNAseq_mat"

loader, split, tokenizer = MtxAtlasLoaderNode("Loader"), SampleSplitNode("Split"), RankTokenizerNode("Tokenizer")
train, pca = EncoderTrainNode("Train"), PcaFeaturesNode("PCA")
embed, embed_untrained = EmbedCellsNode("Embed"), EmbedCellsNode("EmbedUntrained")
probes = {k: CellTypeProbeNode(k) for k in ("ProbeModel", "ProbeUntrained", "ProbePCA", "ProbePermuted")}

# The data sample and the split use seed 0 always; --seed changes only the model.
loader.configure(mtx_path=str(raw / f"{stem}.mtx.gz"), genes_path=str(raw / f"{stem}_genes.txt.gz"),
                 cells_path=str(raw / f"{stem}_cells.txt.gz"), cache_path=str(derived / "GSE239410_rna_full.h5ad"),
                 n_cells=n_cells, seed=0, out_path=str(derived / f"GSE239410_rna_{n_cells}.h5ad"))
split.configure(holdout_fraction=0.2, seed=0, out_path=str(derived / f"GSE239410_rna_{n_cells}_split.h5ad"))
tokenizer.configure(out_path=str(derived / f"GSE239410_rna_{n_cells}_tokens.pt"))
train.configure(steps=50 if tiny else int(option("--steps", 3000)), ceiling_minutes=float(option("--ceiling", 45)),
                seed=seed, out_dir=str(run))
pca.configure(n_components=128, out_path=str(run / "pca_features.npy"))
embed.configure(out_path=str(run / "embeddings.npy"))
embed_untrained.configure(random_init=True, seed=seed, out_path=str(run / "embeddings_untrained.npy"))
for key, probe in probes.items():
    probe.configure(out_path=str(run / f"{key}_predictions.npy"), permute_labels=(key == "ProbePermuted"))

builder = WorkflowBuilder(f"zfbrain_{name}", context={"species": "zebrafish", "tissue": "retina", "accession": "GSE239410"})
for node in (loader, split, tokenizer, train, pca, embed, embed_untrained, *probes.values()):
    builder.add_node(node)
builder.connect("Loader", "data_path", "Split", "data_path")
builder.connect("Split", "data_path", "Tokenizer", "data_path")
builder.connect("Split", "data_path", "PCA", "data_path")
builder.connect("Tokenizer", "tokens_path", "Train", "data_path")
for node in ("Embed", "EmbedUntrained"):
    builder.connect("Tokenizer", "tokens_path", node, "tokens_path")
    builder.connect("Train", "checkpoint_path", node, "checkpoint_path")
for features, probe in (("Embed", "ProbeModel"), ("EmbedUntrained", "ProbeUntrained"), ("PCA", "ProbePCA"), ("Embed", "ProbePermuted")):
    builder.connect(features, "features_path", probe, "features_path")
    builder.connect("Tokenizer", "tokens_path", probe, "tokens_path")
workflow = builder.build()
success = workflow.execute()

# Paired bootstrap over held-out cells: macro F1 of the model minus macro F1 of the PCA baseline.
data = torch.load(tokenizer.get_output("tokens_path"))
truth = data["cell_type"].numpy()[data["is_heldout"].numpy()]
classes = np.unique(truth)
model_pred, pca_pred = (np.load(probes[k].get_output("predictions_path")) for k in ("ProbeModel", "ProbePCA"))
rng = np.random.default_rng(0)
diffs = []
for _ in range(1000):
    pick = rng.integers(0, len(truth), len(truth))
    diffs.append(f1_score(truth[pick], model_pred[pick], labels=classes, average="macro", zero_division=0)
                 - f1_score(truth[pick], pca_pred[pick], labels=classes, average="macro", zero_division=0))

results = {
    "workflow_success": bool(success), "name": name, "seed": seed, "cells": n_cells,
    "heldout_samples": split.get_output("heldout_samples"), "heldout_cells": split.get_output("n_heldout_cells"),
    "vocab_size": tokenizer.get_output("vocab_size"), "median_genes_per_cell": tokenizer.get_output("median_genes_per_cell"),
    "cell_types": data["cell_type_names"],
    "heldout_cells_per_type": {data["cell_type_names"][c]: int((truth == c).sum()) for c in classes},
    "training": train.get_output("metrics"),
    "probes": {k: probe.get_output("metrics") for k, probe in probes.items()},
    "model_minus_pca_macro_f1": {"difference": round(float(np.mean(diffs)), 4),
                                 "interval_95": [round(float(np.percentile(diffs, 2.5)), 4), round(float(np.percentile(diffs, 97.5)), 4)],
                                 "method": "paired bootstrap over held-out cells, 1,000 draws"},
}
run.mkdir(parents=True, exist_ok=True)
(run / "results.json").write_text(json.dumps(results, indent=2) + "\n")
print("\n--- stage 1, retina, tier S ---")
print(json.dumps(results, indent=2))
