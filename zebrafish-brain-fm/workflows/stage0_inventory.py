"""Stage 0 as a Neuro-Workflow graph: ManifestLoader -> ManifestCheck.

Run from the zebrafish-brain-fm folder:

    uv run python workflows/stage0_inventory.py
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "nodes"))

from neuroworkflow import WorkflowBuilder  # noqa: E402

from manifest_check import ManifestCheckNode  # noqa: E402
from manifest_loader import ManifestLoaderNode  # noqa: E402

loader = ManifestLoaderNode("Manifest")
check = ManifestCheckNode("Check")
loader.configure(manifest_path=str(ROOT / "data" / "MANIFEST.tsv"))

builder = WorkflowBuilder(
    "zfbrain_stage0_inventory",
    context={"species": "zebrafish", "resource_requirements": {"cpus": 1, "memory_gb": 1}},
)
builder.add_node(loader)
builder.add_node(check)
builder.connect("Manifest", "rows", "Check", "rows")
workflow = builder.build()

success = workflow.execute()
ready, blocked = check.get_output("ready"), check.get_output("blocked")
print("\n--- stage 0 inventory ---")
print("workflow success:", success)
print(f"ready: {len(ready)}  blocked: {len(blocked)}")
for name, missing in blocked.items():
    print(f"  {name}: missing {', '.join(missing)}")
