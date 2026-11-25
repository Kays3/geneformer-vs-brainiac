"use strict";

// Model one eye and its opposite tectal hemisphere on two flattened sheets.
const Tectum = (() => {
  function project(retina, dt, intact = true, highResolution = false) {
    const rgcs = retina.nodes.filter(n => n.type === 5 || n.type === 6);
    const targets = [];
    const columns = highResolution ? 33 : 9;
    const rows = highResolution ? 17 : 5;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = (col / (columns - 1) - 0.5) * 2.48, z = (row / (rows - 1) - 0.5) * 1.52;
        // Sheet coordinates run temporal to nasal and anterior to posterior.
        const inputs = rgcs.map(n => ({
          id: n.id, weight: Math.exp(-((n.x - x) ** 2 + (n.z - z) ** 2) / (2 * 0.48 ** 2))
        })).sort((a, b) => b.weight - a.weight).slice(0, 4);
        const total = inputs.reduce((s, i) => s + i.weight, 0);
        for (const input of inputs) input.weight /= total;
        targets.push({x, z, inputs});
      }
    }
    let state = targets.map(() => 0);
    const lag = Math.round(20 / dt);
    const frames = retina.frames.map((_, t) => {
      state = targets.map(({inputs}, j) => {
        const drive = intact && t >= lag ? inputs.reduce((s, i) =>
          s + i.weight * Math.max(0, retina.frames[t - lag][i.id] - 6), 0) : 0;
        return state[j] + (1 - Math.exp(-dt / 60)) * (drive - state[j]);
      });
      return state;
    });
    return {rgcs, targets, frames, rows, columns};
  }
  return {project};
})();
if (typeof module === "object" && module.exports) module.exports = Tectum;
