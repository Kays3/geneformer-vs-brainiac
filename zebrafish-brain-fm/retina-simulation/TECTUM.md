# Retina to optic tectum

Open [the simulator](tectum.html) directly in a browser after cloning the repository. Choose a moving bar, broadband flash or UV flash. Use Play or scrub the 2.2-second probe in 10 ms steps. Click a tectal site (or use the selector) to see its afferents and response over time. [Presentation](retinotectal-pilot.pptx)

The default baseline circuit supplies 6 ON and 6 OFF ganglion-cell firing-rate traces. Increasing horizontal retinal coordinate is assigned temporal to nasal. The contralateral tectal sheet has 9 anterior-to-posterior columns and 5 rows. Each site pools the four nearest ganglion cells using normalized Gaussian weights (width 0.48 retinal model units). Only firing above the 6 Hz resting rate drives the pathway, with a 20 ms delay and a 60 ms integration time. Vertical coordinates preserve local adjacency on the flattened sheets. The drawing shows connectivity schematically.

The simulated synj1 condition sets the upstream transmission effect to 65% and invaginating-contact loss probability to 40%. Both conditions use the same tectal weights. The model represents a synthetic feedforward circuit. Its responses are in arbitrary units. The projection direction follows the measured map, while wiring, timing and perturbation effects are assumptions. [Retinotectal anatomy and imaging](https://elifesciences.org/articles/58596)

## Verification

Run `node verify-tectum.js` from this directory. [ThinkStation3 results](tectum-results.json) used the published retinal baseline, three wiring seeds, three stimuli and two retinal conditions. The script checks normalization, finite nonnegative responses, axonal latency and a zero response after tract silencing. Peaks are maxima over all 45 sites and all time steps. The viewer uses seed 17.
