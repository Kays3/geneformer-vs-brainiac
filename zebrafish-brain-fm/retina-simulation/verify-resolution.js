"use strict";
const assert = require("node:assert/strict");
const Retina = require("./model");
const Tectum = require("./tectum");
for (const density of [1,2]) {
  const start = performance.now(), graph = Retina.makeGraph(17, "baseline", density);
  const response = Retina.simulate(Retina.makeCase(graph,{stimulus:"bar"}));
  const map = Tectum.project(response,Retina.dt,true,density===2);
  assert.equal(graph.nodes.length,82*density*density);
  assert.equal(map.targets.length,density===2?561:45);
  assert.equal(map.rgcs.length,12*density*density);
  assert(map.frames.every(f=>f.every(x=>x>=0 && Number.isFinite(x))));
  function peakTime(column) {
    const f=map.frames.map(values=>values.reduce((s,v,i)=>s+(i%map.columns===column?v:0),0));
    return f.indexOf(Math.max(...f))*Retina.dt;
  }
  const anterior=peakTime(0), posterior=peakTime(map.columns-1);
  assert(posterior>anterior);
  console.log({density,retinalCells:graph.nodes.length,tectalSites:map.targets.length,anterior,posterior,elapsedMs:Math.round(performance.now()-start)});
}
