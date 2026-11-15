# Plan: Neuro-Workflow as the main architecture

[Neuro-Workflow](https://github.com/oist/neuro-workflow) is a model builder from the Neural Computation Unit at OIST. It organizes brain modelling as a graph of nodes. Each node is a Python class with a schema that states its role, inputs, outputs and parameters, so that people and AI agents can both read and connect it. This plan makes that graph the frame of the zebrafish brain model: every step of every stage is a node, and every stage is a workflow.

Read at commit `3a4b03b6` (14 November 2026). Neuro-Workflow is not yet published; its README asks users to check back for the citation.

## What is checked

One workflow runs: [`workflows/stage0_inventory.py`](workflows/stage0_inventory.py) connects two nodes from [`nodes/`](nodes/), reads the data manifest and reports which data sets may be used. On 15 November 2026 it ran to the end and reported 0 ready and 8 blocked, which is correct for an empty manifest. Nothing else in this plan has been run.

## Why use it

- **One form for every step.** A loader, a tokenizer, a training run and a null test all become nodes with typed ports. The stages in the [introduction](README.md) become graphs that can be read, saved and rerun.
- **Agents can operate it.** The schema carries a description of each node, port and parameter. An agent can assemble a test from nodes without reading their code.
- **The path to simulation.** Neuro-Workflow already runs NEST and TVB as nodes. A zebrafish model built in the same frame can later feed a whole-brain simulation, which is the step a model of expression alone cannot take.

## How the project maps to nodes

Neuro-Workflow's stage list is `io`, `neuron`, `population`, `synapse`, `connectivity`, `stimulus`, `simulation`, `analysis`, `optimization`.

| Project stage | Nodes | Neuro-Workflow stage |
|---|---|---|
| 0 Inventory | Manifest loader, manifest check (both written) | `io`, `analysis` |
| 1 Cell encoder | Atlas loader; rank tokenizer; encoder training; embedding; held-out classifier; baseline classifier | `io`, then see the gap below |
| 2 Cells into the brain | Region atlas loader; marker map loader; region predictor; random marker null | `io`, `analysis` |
| 3 Functional genomics | Mutant map loader; in silico gene removal; region comparison; matched random gene null | `io`, `analysis` |
| 4 Image encoder | Stack loader; 3D encoder training | `io`, then see the gap below |
| Later: simulation | Region wiring from the atlas to a TVB connectome; whole-brain simulation; comparison with measured activity maps | `connectivity`, `simulation`, `analysis` |

## Gaps to settle first

1. **No stage for machine learning.** Tokenizing, pretraining and fine-tuning match none of the nine stages. The node guide allows a new stage to be proposed. Decide the names (for example `representation` and `training`) and ask the Neuro-Workflow maintainers before many nodes exist.
2. **Long GPU runs inside a node are untried here.** The library describes itself as an in-memory workflow library. A training node should launch and watch a job and return a path to a checkpoint. It should not hold the model in a port. See [GPU-AND-SCALE.md](GPU-AND-SCALE.md).
3. **Large data on ports.** Ports carry Python objects. Atlases of hundreds of thousands of cells should pass as file paths with a sha256, not as arrays.
4. **Licence.** Neuro-Workflow is under PolyForm Noncommercial 1.0.0. This project depends on it as an installed package and copies none of its code. Choose this repository's own licence with that in mind.
5. **Where nodes live.** Nodes stay in this repository's `nodes/` folder. Offering them to the Neuro-Workflow node library is a later, separate decision.

## Node rules for this project

- One node is one scientific operation.
- `type` starts with `zfbrain_`. `model_source` points to the paper or repository behind the node.
- Every description is written for a reader who cannot see the code.
- Every node that produces a result has a partner node that produces its null or baseline, and the workflow connects both.
- Each method returns a dictionary whose keys are the names of its output ports.

## Order of work

1. Settle gaps 1 and 4.
2. Finish stage 0 with the two existing nodes: fill the manifest until the check reports 8 ready.
3. Write the stage 1 nodes on a 10,000-cell sample (tier S in the GPU plan), baseline node first.
4. Add the training node only after the tier S workflow runs end to end on a laptop.

## Sources

- Neuro-Workflow repository, README, `NODE_SCHEMA.md` and `NODE_CREATION_GUIDE.md`: <https://github.com/oist/neuro-workflow>
- Gutierrez et al. A spiking neural network builder for systematic data-to-model workflow. *Frontiers in Neuroinformatics* (2022). [doi:10.3389/fninf.2022.855765](https://doi.org/10.3389/fninf.2022.855765) (the first-generation builder that the README names)

The mapping, the gaps and the rules are the author's proposal.
