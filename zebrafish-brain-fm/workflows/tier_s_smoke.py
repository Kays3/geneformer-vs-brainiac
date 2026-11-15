"""Tier S smoke test as a Neuro-Workflow graph: SyntheticCells -> TierSTrain.

Synthetic cells only. It checks that the smallest model trains and gives timing.
It says nothing about zebrafish. Run from the zebrafish-brain-fm folder:

    uv run python workflows/tier_s_smoke.py            # tier S: 10,000 cells, 2,048 genes per cell
    uv run python workflows/tier_s_smoke.py --steps 300  # fewer steps, to fit the time ceiling
    uv run python workflows/tier_s_smoke.py --tiny     # seconds on a laptop CPU
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "nodes"))

from neuroworkflow import WorkflowBuilder  # noqa: E402

from synthetic_cells import SyntheticCellsNode  # noqa: E402
from tier_s_train import TierSTrainNode  # noqa: E402

tiny = "--tiny" in sys.argv
name = "tier_s_tiny" if tiny else "tier_s_smoke"
cells = SyntheticCellsNode("Cells")
train = TierSTrainNode("Train")
cells.configure(out_path=str(ROOT / "data" / "derived" / f"{name}_cells.pt"))
train.configure(out_dir=str(ROOT / "runs" / name))
if tiny:
    cells.configure(n_cells=200, vocab_size=500, seq_len=64)
    train.configure(steps=30, batch_size=16, ceiling_minutes=1.0)

if "--steps" in sys.argv:
    train.configure(steps=int(sys.argv[sys.argv.index("--steps") + 1]))

builder = WorkflowBuilder(f"zfbrain_{name}", context={"species": "none (synthetic cells)"})
builder.add_node(cells)
builder.add_node(train)
builder.connect("Cells", "data_path", "Train", "data_path")
workflow = builder.build()

success = workflow.execute()
print("\n--- tier S smoke test ---")
print("workflow success:", success)
print(json.dumps(train.get_output("metrics"), indent=2))
