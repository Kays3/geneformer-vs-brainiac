"use strict";
const assert = require("node:assert/strict");
const Retina = require("./model");
const Tectum = require("./tectum");
for (const density of [1,2]) {
  for (const circuit of (Retina.scaleProbe ? ["baseline","adaptive"] : ["baseline"])) {
    const graph=Retina.makeGraph(17,circuit,density);
    const run=(mode, stress=0, contactLoss=0)=>Retina.simulate(Retina.makeCase(graph,{mode,stress,contactLoss,stimulus:"bar"}));
    const wild=run("wild");
    const peak=r=>Math.max(...Tectum.project(r,Retina.dt,true,density===2).frames.map(f=>Math.max(...f)));
    for (const gene of ["pde6c","aipl1b"]) {
      assert.deepEqual(run(gene).frames,wild.frames);
      const affected=run(gene,.65,.4);
      assert(affected.lost.size>0);
      assert(affected.contacts.every(e=>e.active===(!affected.lost.has(e.from)&&!affected.lost.has(e.to))));
      assert(peak(affected)>0 && peak(affected)<peak(wild));
      assert(peak(run(gene,1,1))<1e-10);
      console.log(graph.model,density,gene,affected.lost.size,peak(wild).toFixed(3),peak(affected).toFixed(3));
    }
  }
}
