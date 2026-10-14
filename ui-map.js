export function drawMap(canvas,sim){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,data=sim.stageData;const xScale=22,zScale=4.6;const px=x=>w/2+x*xScale,py=z=>12+(8.2-z)*zScale;c.clearRect(0,0,w,h);c.fillStyle='#102d35bb';c.fillRect(0,0,w,h);
 for(const b of data.platforms){c.fillStyle=b.id.includes('chef-arena')?'#c9956480':b.kind==='plate'||b.kind==='bowl'?'#d1c69b90':'#88babd70';c.fillRect(px(b.min.x),py(b.max.z),b.size.x*xScale,b.size.z*zScale);}
 for(const cp of data.checkpoints){c.beginPath();c.arc(px(cp.p.x),py(cp.p.z),3,0,Math.PI*2);c.fillStyle=sim.checkpointId>=cp.id?'#b1f7cd':'#789d93';c.fill();}
 for(const ch of sim.chefs.filter(ch=>ch.active)){c.beginPath();c.arc(px(ch.x),py(ch.z),2.5,0,Math.PI*2);c.fillStyle=ch.state==='STUNNED'?'#a9e0c2':'#df9a79';c.fill();}
 if(data.goal){const g=data.goal;c.beginPath();c.arc(px(g.x),py(g.z),4,0,Math.PI*2);c.strokeStyle='#f4d495';c.lineWidth=1.5;c.stroke();}
 c.save();c.translate(px(sim.p.x),py(sim.p.z));c.rotate(-sim.yaw);c.beginPath();c.moveTo(0,-5);c.lineTo(-3,4);c.lineTo(3,4);c.closePath();c.fillStyle='#fff2d0';c.fill();c.restore();c.font='9px sans-serif';c.fillStyle='#bdd5cf';if(data.goal)c.fillText('排水溝',w/2+10,py(data.goal.z)+3);
}
