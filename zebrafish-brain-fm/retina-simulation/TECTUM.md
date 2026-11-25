# Retina to optic tectum

Open [the simulator](tectum.html) directly in a browser after cloning the repository. Choose a moving bar, broadband flash or UV flash. Use Play or scrub the 2.2-second probe in 10 ms steps. Click a tectal site (or use the selector) to see its afferents and response over time. [Presentation](retinotectal-pilot.pptx)

The default baseline circuit supplies 6 ON and 6 OFF ganglion-cell firing-rate traces. Increasing horizontal retinal coordinate is assigned temporal to nasal. The contralateral tectal sheet has 9 anterior-to-posterior columns and 5 rows. Each site pools the four nearest ganglion cells using normalized Gaussian weights (width 0.48 retinal model units). Only firing above the 6 Hz resting rate drives the pathway, with a 20 ms delay and a 60 ms integration time. Vertical coordinates preserve local adjacency on the flattened sheets. The drawing shows connectivity schematically.

The simulated synj1 condition sets the upstream transmission effect to 65% and invaginating-contact loss probability to 40%. Both conditions use the same tectal weights. The model represents a synthetic feedforward circuit. Its responses are in arbitrary units. The projection direction follows the measured map, while wiring, timing and perturbation effects are assumptions. [Retinotectal anatomy and imaging](https://elifesciences.org/articles/58596)

## Verification

Run `node verify-tectum.js` from this directory. [ThinkStation3 results](tectum-results.json) used the published retinal baseline, three wiring seeds, three stimuli and two retinal conditions. The script checks normalization, finite nonnegative responses, axonal latency and a zero response after tract silencing. Peaks are maxima over all 45 sites and all time steps. The viewer uses seed 17.

## Higher-resolution coupled view

The retinal simulator home page now opens a moving-bar probe with 328 retinal cells, including 48 ganglion cells, and a 33 × 17 contralateral tectal sheet. Choose Original patch for 82 retinal cells, 12 ganglion cells and a 9 × 5 sheet. Each condition uses its own retinal outputs. Both maps and the selected site's time series share one probe clock and one amplitude scale within a run. More spatial samples increase rendering and simulation detail. The time step stays at 10 ms. Tectal sites share inputs through the assumed projection and are not independently measured neurons.

Run `node verify-resolution.js` for the baseline moving-bar probe. On ThinkStation3, the mean anterior and posterior boundary-column responses peaked at 760 and 1190 ms at fine resolution (seed 17). In one CPU run, graph construction, one retinal probe and one tectal projection took 43 ms. Browser drawing and minute-scale sessions are excluded.
