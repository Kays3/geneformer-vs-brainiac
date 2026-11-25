"use strict";
const assert = require("node:assert/strict");
const Retina = require("./model.js");
const Tectum = require("./tectum.js");
const peak = result => Math.max(...result.frames.map(f => Math.max(...f)));
const runs = [];
for (const seed of [17, 31, 53]) {
  const graph = Retina.makeGraph(seed);
  for (const stimulus of ["bar", "uv", "white"]) {
    for (const mode of ["wild", "contacts"]) {
      const r = Retina.simulate(Retina.makeCase(graph,{stimulus,mode,stress:.65,contactLoss:.4}));
      const t = Tectum.project(r,Retina.dt);
      assert.equal(t.frames.length, r.frames.length);
      assert.equal(t.rgcs.length,12);
      assert.equal(t.targets.length,45);
      for (const n of t.targets) {
        assert.equal(n.inputs.length,4);
        assert.ok(Math.abs(n.inputs.reduce((s,i)=>s+i.weight,0)-1)<1e-12);
      }
      assert.ok(t.frames.every(f=>f.every(v=>Number.isFinite(v)&&v>=0)));
      assert.equal(peak(Tectum.project(r,Retina.dt,false)),0);
      assert.ok(peak(t)>0);
      const firstRetinal = r.frames.findIndex(f=>t.rgcs.some(n=>f[n.id]>6));
      assert.ok(t.frames.findIndex(f=>Math.max(...f)>0)>=firstRetinal+2);
      runs.push({seed, stimulus, mode, peak:peak(t)});
    }
  }
}
console.log(JSON.stringify(runs,null,2));
