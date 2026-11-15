"""Tier M timing run as a Neuro-Workflow graph: SyntheticCells -> EncoderTrain.

The tier M model (6 layers, width 256) on synthetic cells. It measures speed and
memory for the GPU plan. It is not the tier M model of the plan, which needs real
cells, and it says nothing about zebrafish. Run from the zebrafish-brain-fm folder:

    uv run python workflows/tier_m_timing.py --steps 12 --ceiling 5 --name calibration
    uv run python workflows/tier_m_timing.py --steps 600 --ceiling 60
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "nodes"))

from neuroworkflow import WorkflowBuilder  # noqa: E402

from encoder_train import EncoderTrainNode  # noqa: E402
from synthetic_cells import SyntheticCellsNode  # noqa: E402


def option(flag, default):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


name = "tier_m_" + option("--name", "timing")
cells = SyntheticCellsNode("Cells")
train = EncoderTrainNode("Train")
cells.configure(n_cells=int(option("--cells", 20000)), out_path=str(ROOT / "data" / "derived" / "tier_m_cells.pt"))
train.configure(
    layers=6, width=256, heads=4,
    steps=int(option("--steps", 600)),
    batch_size=int(option("--batch", 32)),
    ceiling_minutes=float(option("--ceiling", 60)),
    out_dir=str(ROOT / "runs" / name),
)

builder = WorkflowBuilder(f"zfbrain_{name}", context={"species": "none (synthetic cells)"})
builder.add_node(cells)
builder.add_node(train)
builder.connect("Cells", "data_path", "Train", "data_path")
workflow = builder.build()

success = workflow.execute()
print("\n--- tier M timing ---")
print("workflow success:", success)
print(json.dumps(train.get_output("metrics"), indent=2))
