"use strict";

// The atlas coordinate order is anterior–posterior, superior–inferior, right–left.
const WholeBrain = (() => {
  const section = document.createElement("section");
  section.className = "panel";
  section.setAttribute("aria-labelledby","brain-title");
  section.innerHTML = `<div class="section-head"><div><h2 id="brain-title">Whole brain</h2>
    <p>Left-eye stimulation → right optic tectum · larval atlas, approximately 6 dpf</p></div></div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:18px;margin:12px 0"><label>Response
    <select id="brain-condition"><option>Wild type</option><option>Simulated synj1</option></select></label>
    <label>Rotate <input id="brain-angle" type="range" min="-90" max="90" value="15" aria-label="Rotate from dorsal toward lateral view"></label>
    <label>Anatomy opacity <input id="brain-opacity" type="range" min="0" max="100" value="55"></label></div>
    <canvas id="brain-volume" style="width:100%;height:clamp(260px,36vw,440px);touch-action:pan-y" aria-label="Rotatable transparent atlas with simulated activity on the right tectal neuropil"></canvas>
    <p>Contours show forebrain (green), midbrain (blue), hindbrain (violet) and retinas (gray). Amber marks modeled tectal activity. The white ring follows the site selected on the map below.</p>`;
  document.querySelector('[aria-labelledby="tectal-heading"]').before(section);
  const canvas = section.querySelector("canvas");
  const angle = section.querySelector("#brain-angle");
  const opacity = section.querySelector("#brain-opacity");
  const condition = section.querySelector("select");
  const layerColors = {forebrain:"#7ccfb0",midbrain:"#84c9ef",hindbrain:"#b9a8ed",retina:"#a8b3bc",neuropil:"#eccf91"};
  let current;
  function paint() {
    if (!current) return;
    const {projections, frame, selected, maxRate} = current;
    const p = projections[condition.selectedIndex];
    const {context:ctx,width,height} = sizeCanvas(canvas);
    const a = Number(angle.value)*Math.PI/180;
    const scale = Math.min((width-30)/974,(height-40)/600);
    const point = ([ap,dv,lr]) => [
      width/2+(ap-475)*scale,
      height/2+((lr-298)*Math.cos(a)+(dv-178)*Math.sin(a))*scale
    ];
    ctx.clearRect(0,0,width,height);
    const alpha = Number(opacity.value)/100;
    for (const [name,rings] of Object.entries(BrainAtlas.contours)) {
      ctx.strokeStyle=layerColors[name]; ctx.fillStyle=layerColors[name];
      for (const ring of rings) {
        ctx.beginPath();
        ring.forEach((q,i)=>{const [x,y]=point(q); if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
        ctx.closePath(); ctx.globalAlpha=alpha*.045;ctx.fill();
        ctx.globalAlpha=alpha*.61;ctx.lineWidth=.85;ctx.stroke();
      }
    }
    // Dorsal view foreshortens coronal contours. Add the atlas-derived dorsal outlines.
    for (const [name,rings] of Object.entries(BrainAtlas.dorsal || {})) {
      ctx.strokeStyle=layerColors[name];ctx.globalAlpha=alpha*.74;
      for (const ring of rings) {
        ctx.beginPath();
        ring.forEach((q,i)=>{const [x,y]=point(q);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
        ctx.closePath();ctx.stroke();
      }
    }
    const coordinates = i => BrainAtlas.surface[
      Math.round(i%p.columns/(p.columns-1)*32)*17+Math.round(Math.floor(i/p.columns)/(p.rows-1)*16)];
    ctx.fillStyle="#ffbe5e";
    p.frames[frame].forEach((v,i)=>{
      const relative = v/maxRate;
      if(relative<.005)return;
      const [x,y]=point(coordinates(i));ctx.globalAlpha=Math.min(1,relative*1.7);
      ctx.beginPath();ctx.arc(x,y,Math.max(1.2,4.5*scale),0,2*Math.PI);ctx.fill();
    });
    ctx.globalAlpha=1;ctx.strokeStyle="white";ctx.lineWidth=1.5;
    const [x,y]=point(coordinates(selected)); ctx.beginPath();ctx.arc(x,y,5,0,2*Math.PI);ctx.stroke();
    ctx.fillStyle="#d2deea";ctx.font="12px system-ui";ctx.fillText("Anterior",6,height-6);
    ctx.fillText("Posterior",width-56,height-6);
    ctx.fillText(frame*Retina.dt+" ms",8,17);
  }
  for(const el of [condition,angle,opacity])el.addEventListener("input",paint);
  function draw(projections,frame,selected,maxRate) {
    current={projections,frame,selected,maxRate};paint();
  }
  return {draw};
})();
