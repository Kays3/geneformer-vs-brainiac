# Retinal degeneration in the retinotectal simulator

The retinal page compares two additional zebrafish gene-disruption hypotheses against a matched wild type. Choose a perturbation, start the moving bar and inspect the retinal contacts, tectal maps and contralateral whole-brain overlay.

| Gene | Evidence in zebrafish | Implementation |
|---|---|---|
| pde6c | The w59 mutation disrupts cone phototransduction and produces rapid cone degeneration during larval development. | Reduce light sensitivity equally across surviving cone classes. Remove a deterministic subset of cones and all their input and output contacts. [Stearns et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC6673616/) |
| aipl1b | The gosh mutant shows progressive cone degeneration. In the early opsin assay, red, green and UV opsin-positive areas decreased, while the blue opsin-positive area was preserved. | Apply the same cone-loss mechanism. As an exploratory hypothesis, blue cones receive one-quarter of the sensitivity reduction assigned to other surviving cones. Opsin area does not measure light sensitivity, and the ratio is an assumption. [Iribarne et al.](https://www.nature.com/articles/srep45962) |

The two sliders independently set fractional sensitivity loss and cone-loss probability. A fixed per-cone susceptibility preserves the pattern across time and makes increasing loss cumulative within a wiring seed. The model retains baseline coordinates for indexing. Lost cones are disconnected and hidden in the architecture view. The 2.2-second probe measures the response at a selected severity. The simulator does not estimate disease age, rod compensation, progression rate or direct tectal neuron loss.

## ThinkStation3 check

Fine adaptive circuit, seed 17, single moving bar, 65% sensitivity loss and 40% cone-loss probability. Both presets removed 46 of 128 cones, leaving 82. Peak across all tectal sites and time steps, in model units above baseline, was 14.151 for wild type, 4.091 for pde6c and 4.895 for aipl1b. The difference between gene presets follows the assumed relative blue-cone sparing. These are synthetic outputs. At zero severity each gene reproduced the full wild-type retinal time series. At complete cone loss, tectal activity above baseline vanished to numerical precision. The sham option provides a matched wild-type control in the interface.
