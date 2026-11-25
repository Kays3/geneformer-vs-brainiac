# Tectal stimulation in a transparent larval zebrafish brain

## Research question

Where does a retinally driven response appear within the intact larval brain as a bright bar crosses the visual field? The simulator now displays a transparent anatomical reference on the same 10 ms clock as the retinal and tectal panels. Open the [retinal simulator](../../zebrafish-brain-fm/retina-simulation/index.html), play the moving bar, and follow the amber signal on the right tectum. The modeled input is from the left eye. Changing anatomy opacity affects only the display.

## Anatomy and model

The anatomical reference is the approximately 6 dpf atlas of Kunst and colleagues, distributed as BrainGlobe mpin_zfish_1um v3.0. Coordinates follow anterior-to-posterior, superior-to-inferior and right-to-left axis order. The source masks cover forebrain (893), midbrain (896), hindbrain (897), retina (808) and tectal neuropil (832). The bundled viewer uses contours from two section planes after sampling the source masks on an 8 µm grid. This shows major regional boundaries and both eyes. Individual neurons and fine tectal laminae are unresolved. [Atlas paper](https://doi.org/10.1016/j.neuron.2019.04.034) · [BrainGlobe manifest](https://brainglobe.s3.us-west-2.amazonaws.com/atlas/atlases/mpin_zfish_1um/3_0/manifest.json)

The amber overlay comes from the existing 45-site or 561-site model. Modeled anterior-to-posterior columns are assigned to successive slices through the right neuropil. Rows are distributed across its width and projected to its dorsal surface. This illustrative placement preserves the modeled anterior–posterior order. It has no cell-level registration to recordings. Forebrain, hindbrain and the opposite tectum supply anatomical context only. The simulation varies retinal light input, without a direct electrical or optogenetic stimulus to the tectum. [Experimental retinotectal map](https://elifesciences.org/articles/58596)

## Verification

ThinkStation3 generated the bundled geometry from the source masks. The model uses the same site index, time step, response values and amplitude scale for the brain overlay and the paired tectal maps. Browser checks exercised rotation, opacity, the wild-type and simulated synj1 overlays, and the switch back to the original spatial resolution. Rebuild offline geometry by running [build-brain-atlas.py](../../zebrafish-brain-fm/retina-simulation/build-brain-atlas.py) in the simulator directory with NumPy, Requests, numcodecs and scikit-image installed.

The whole-brain view now supports full turns about two axes using mouse or touch drag, or the Turn and Tilt sliders. The site marker and activity use the same rotation as the atlas contours. Reset view restores the original 0° turn and 15° tilt. The paired retinal patches also rotate continuously with a shared drag gesture.
