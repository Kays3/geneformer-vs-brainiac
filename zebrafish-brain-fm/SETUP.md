# Setup

What is checked, on macOS on 15 November 2026: the dependency list in `pyproject.toml` resolves (`uv.lock`), and the stage 0 workflow runs with Neuro-Workflow alone installed. The full `uv sync`, which also installs `torch` and `scanpy`, is untested. So are downloading and training.

## 1. Environment

Needs [uv](https://docs.astral.sh/uv/) and Python 3.11 or later.

```bash
git clone https://github.com/Kays3/geneformer-vs-brainiac.git
cd geneformer-vs-brainiac/zebrafish-brain-fm
uv sync
uv run python -c "import scanpy, torch; print(scanpy.__version__, torch.__version__)"
```

Then run the first workflow. It reads the manifest and lists the data sets that may not be used yet:

```bash
uv run python workflows/stage0_inventory.py
```

`neuroworkflow` is installed from its GitHub repository, which is large; the first install can be slow. The other packages are `anndata` and `scanpy` for single-cell tables, `torch` and `transformers` for the model, and `datasets` for tokenized cells. Image packages come with stage 4.

## 2. Folders

```
zebrafish-brain-fm/
  README.md          introduction and plan
  SETUP.md           this file
  pyproject.toml     dependencies
  uv.lock            resolved versions
  NEURO-WORKFLOW-PLAN.md  the node architecture
  GPU-AND-SCALE.md   tiers, model sizes, GPU rules
  nodes/             Neuro-Workflow nodes of this project
  workflows/         one script per workflow
  compute/gpu-ledger.tsv  one row per GPU run
  data/MANIFEST.tsv  one row per data set: source, path, sha256, licence
  data/raw/          downloads (not in git)
  data/derived/      tokenized cells, region tables (not in git)
  artifact/          the introduction as a web page
```

Add `tests/` with the first node that computes something.

## 3. Data rule

No data in git. For each download, add its path, its sha256 and its licence to `data/MANIFEST.tsv`:

```bash
shasum -a 256 data/raw/<file>
```

A data set with an empty licence cell is not used.

## 4. Stage 0 checklist

- [ ] Read the download and reuse terms of each source in the manifest. Fill the licence column.
- [ ] Fix the genome build and the gene identifier set for the whole project.
- [ ] Choose the reference brain space.
- [ ] Choose the larval stage or stages.
- [ ] Write the stage 1 test and its baseline before any training.
- [ ] Decide where training runs, and how much compute stage 1 may use.

## 5. Hardware

Stage 0 and small checks run on a laptop. Model training needs a GPU machine. The compute for stage 1 is not estimated yet. [GPU-AND-SCALE.md](GPU-AND-SCALE.md) gives the tiers and the rules, including the timed start check before any full run.
