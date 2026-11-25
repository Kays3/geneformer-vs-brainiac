"use strict";
(() => {
  const el = id => document.getElementById(id);
  const graph = Retina.makeGraph(17);
  let retina, tectum, playing = false, start = 0, raf;
  const shape = (name, attrs, words = "") => {
    const item = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (const [key, value] of Object.entries(attrs)) item.setAttribute(key, value);
    item.textContent = words;
    return item;
  };
  const pos = (n, target) => [ (target ? 683 : 192) + n.x * 108, 149 + n.z * 96 ];
  const label = (svg,x,y,words,size=16) => svg.append(shape("text",{x,y,"font-size":size},words));
  function draw() {
    const t = Number(el("time").value), frame = Math.round(t / Retina.dt);
    const selected = Number(el("site").value);
    const target = tectum.targets[selected], map = el("map"), trace = el("trace");
    map.replaceChildren(); trace.replaceChildren();
    label(map,28,30,"Retinal ganglion cells",22); label(map,510,30,"Contralateral optic tectum",22);
    label(map,35,274,"Temporal"); label(map,287,274,"Nasal");
    label(map,535,274,"Anterior"); label(map,777,274,"Posterior");
    const [endX,endY] = pos(target,true);
    for (const input of target.inputs) {
      const [x,y] = pos(retina.nodes[input.id],false);
      map.append(shape("path",{d:`M${x} ${y} C390 ${y}, 443 ${endY}, ${endX} ${endY}`,fill:"none",stroke:"#81cfc2","stroke-width":1+4*input.weight,opacity:el("tract").value==="intact"?.65:.16}));
    }
    for (const n of tectum.rgcs) {
      const [x,y] = pos(n,false), value = Math.max(0,retina.frames[frame][n.id]-6);
      const attrs = {fill:n.type===5?"#73ffda":"#d8b1ff","fill-opacity":.18+.82*Math.min(1,value/16),stroke:"#92bcba"};
      map.append(n.type===5 ? shape("circle",{cx:x,cy:y,r:8,...attrs}) : shape("rect",{x:x-6,y:y-6,width:12,height:12,...attrs}));
    }
    tectum.targets.forEach((n,i) => {
      const [x,y] = pos(n,true), value = tectum.frames[frame][i];
      const cell = shape("circle",{cx:x,cy:y,r:i===selected?10:8,fill:"#ffcb74","fill-opacity":.13+.87*Math.min(1,value/12),stroke:i===selected?"white":"#907e63","data-site":i});
      map.append(cell);
    });
    const values = tectum.frames.map(f=>f[selected]);
    const scale = Math.max(12, ...values), pointY = v => 94 - v/scale*81;
    trace.append(shape("path",{d:values.map((v,i)=>(i?"L":"M")+(44+816*i/(values.length-1))+" "+pointY(v)).join(" "),fill:"none",stroke:"#ffcb74","stroke-width":3}));
    const x=44+816*t/Retina.duration;
    trace.append(shape("line",{x1:x,x2:x,y1:6,y2:97,stroke:"white"}));
    label(trace,4,19,scale.toFixed(0),14); label(trace,15,96,"0",14);
    label(trace,44,119,"0 ms",14); label(trace,801,119,"2,200 ms",14);
    el("stamp").textContent=t+" ms";
    el("rate").textContent="Tectal response · "+values[frame].toFixed(2)+" model units above baseline";
  }
  function run() {
    retina=Retina.simulate(Retina.makeCase(graph,{stimulus:el("light").value, mode:el("condition").value, stress:.65, contactLoss:.4}));
    tectum=Tectum.project(retina,Retina.dt,el("tract").value==="intact");
    draw();
  }
  function stop() {playing=false;cancelAnimationFrame(raf);el("play").textContent="Play";}
  function tick(now) {
    el("time").value=Math.min(Retina.duration,Math.round((now-start)/Retina.dt)*Retina.dt);
    draw();
    if (+el("time").value>=Retina.duration) stop(); else raf=requestAnimationFrame(tick);
  }
  for(let i=0;i<45;i++) el("site").add(new Option("Row "+(1+Math.floor(i/9))+" · column "+(1+i%9),i));
  el("site").value=22;
  el("play").onclick=()=>{if(playing) return stop(); playing=true;el("play").textContent="Pause";start=performance.now()-(+el("time").value===Retina.duration?0:+el("time").value);raf=requestAnimationFrame(tick);};
  el("time").oninput=()=>{stop();draw();};
  el("site").onchange=draw;
  el("map").onclick=e=>{if(e.target.hasAttribute("data-site")){el("site").value=e.target.getAttribute("data-site");draw();}};
  for(const id of ["light","condition","tract"]) el(id).onchange=run;
  run();
})();
