"use strict";

const TectalPanel = (() => {
  const maps = ["tectal-wild", "tectal-mutant"].map(id => document.getElementById(id));
  const site = document.getElementById("tectal-site");
  const colors = ["#71dec2", "#f4ad78"];
  let projections = [], maxRate = 1, currentFrame = 0;
  function update(results, highResolution) {
    projections = results.map(r => Tectum.project(r, Retina.dt, true, highResolution));
    const {rgcs, rows, columns, targets} = projections[0];
    if (Number(site.max) !== targets.length - 1) {
      site.max = targets.length - 1;
      site.value = Math.floor(targets.length / 2);
    }
    maxRate = Math.max(1,...projections.flatMap(p => p.frames.map(f => Math.max(...f))));
    document.getElementById("tectal-count").textContent =
      rgcs.length+" ganglion cells → "+columns+" × "+rows+" sites per hemisphere · 10 ms steps";
  }
  function draw(frame) {
    if (!projections.length) return;
    currentFrame = frame;
    const index = Number(site.value);
    const {columns,rows} = projections[0];
    WholeBrain.draw(projections,frame,index,maxRate);
    maps.forEach((map,k) => {
      const {context:ctx,width,height} = sizeCanvas(map);
      const dx = width/columns, dy = (height-22)/rows;
      ctx.clearRect(0,0,width,height);
      projections[k].frames[frame].forEach((v,i) => {
        const intensity = v/maxRate;
        ctx.fillStyle = 'rgb('+Math.round(22+228*intensity)+','+Math.round(40+155*intensity)+','+Math.round(56+38*intensity)+')';
        ctx.fillRect((i%columns)*dx,Math.floor(i/columns)*dy,Math.ceil(dx),Math.ceil(dy));
      });
      ctx.strokeStyle = "white";
      ctx.strokeRect((index%columns)*dx+1,Math.floor(index/columns)*dy+1,dx-2,dy-2);
      ctx.font="12px system-ui";ctx.fillStyle="#c3d0df";
      ctx.fillText("Anterior",2,height-4);ctx.fillText("Posterior",width-52,height-4);
    });
    const {context:ctx,width,height} = sizeCanvas(document.getElementById("tectal-history"));
    ctx.clearRect(0,0,width,height);
    projections.forEach((p,k) => {
      ctx.strokeStyle=colors[k];ctx.lineWidth=2;ctx.beginPath();
      p.frames.forEach((f,t) => {
        const x=t/(p.frames.length-1)*(width-2),y=height-18-f[index]/maxRate*(height-22);
        if(t) ctx.lineTo(x,y); else ctx.moveTo(x,y);
      });
      ctx.stroke();
    });
    const x=frame/(projections[0].frames.length-1)*(width-2);
    ctx.strokeStyle="white";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height-14);ctx.stroke();
    ctx.font="12px system-ui";ctx.fillStyle="#c3d0df";ctx.fillText("0 ms",2,height-1);ctx.fillText(Retina.duration+" ms",width-58,height-1);
    document.getElementById("tectal-readout").textContent =
      "Site "+(1+Math.floor(index/columns))+", "+(index%columns+1)+" · Wild type (green) "+
      projections[0].frames[frame][index].toFixed(2)+" · synj1 (orange) "+
      projections[1].frames[frame][index].toFixed(2)+" · shared scale 0–"+maxRate.toFixed(1)+" model units";
  }
  site.oninput=()=>draw(currentFrame);
  for (const map of maps) map.onclick=e=>{
    if (!projections.length) return;
    const {columns,rows}=projections[0], rect=map.getBoundingClientRect();
    const row=Math.floor((e.clientY-rect.top)/(rect.height-22)*rows);
    if(row<0 || row>=rows) return;
    site.value=row*columns+Math.min(columns-1,Math.floor((e.clientX-rect.left)/rect.width*columns));
    draw(currentFrame);
  };
  return {update,draw};
})();
