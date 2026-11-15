"""Stage 0 as a Neuro-Workflow graph: ManifestLoader -> ManifestCheck -> ManifestVerify.

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
from manifest_verify import ManifestVerifyNode  # noqa: E402

loader = ManifestLoaderNode("Manifest")
check = ManifestCheckNode("Check")
verify = ManifestVerifyNode("Verify")
loader.configure(manifest_path=str(ROOT / "data" / "MANIFEST.tsv"))
verify.configure(root=str(ROOT))

builder = WorkflowBuilder(
    "zfbrain_stage0_inventory",
    context={"species": "zebrafish", "resource_requirements": {"cpus": 1, "memory_gb": 1}},
)
builder.add_node(loader)
builder.add_node(check)
builder.add_node(verify)
builder.connect("Manifest", "rows", "Check", "rows")
builder.connect("Manifest", "rows", "Verify", "rows")
builder.connect("Check", "ready", "Verify", "ready")
workflow = builder.build()

success = workflow.execute()
ready, blocked = check.get_output("ready"), check.get_output("blocked")
verified, failed, absent = (verify.get_output(k) for k in ("verified", "failed", "absent"))
print("\n--- stage 0 inventory ---")
print("workflow success:", success)
print(f"ready: {len(ready)}  blocked: {len(blocked)}")
print(f"of the ready: verified on this machine {len(verified)}, failed {len(failed)}, not on this machine {len(absent)}")
for name in verified:
    print(f"  verified: {name}")
for name, reason in failed.items():
    print(f"  FAILED: {name}: {reason}")
for name in absent:
    print(f"  not here: {name}")
for name, missing in blocked.items():
    print(f"  blocked: {name}: missing {', '.join(missing)}")
