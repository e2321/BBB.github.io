import { PLATFORMS, CHECKPOINTS, GOAL } from './stage.js';
export function drawMap(canvas,sim){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;const px=x=>w/2+x*24,py=z=>12+(8.2-z)/24*205;c.clearRect(0,0,w,h);c.fillStyle='#102d35bb';c.fillRect(0,0,w,h);
 for(const b of PLATFORMS){c.fillStyle=b.id==='chef-arena'?'#c9956480':b.kind==='plate'||b.kind==='bowl'?'#d1c69b90':'#88babd70';c.fillRect(px(b.min.x),py(b.max.z),b.size.x*24,b.size.z/24*205);}
 for(const cp of CHECKPOINTS){c.beginPath();c.arc(px(cp.p.x),py(cp.p.z),4,0,Math.PI*2);c.fillStyle=sim.checkpointId>=cp.id?'#b1f7cd':'#789d93';c.fill();}
 c.beginPath();c.arc(px(GOAL.x),py(GOAL.z),5,0,Math.PI*2);c.strokeStyle='#f4d495';c.lineWidth=2;c.stroke();
 c.save();c.translate(px(sim.p.x),py(sim.p.z));c.rotate(-sim.yaw);c.beginPath();c.moveTo(0,-6);c.lineTo(-4,5);c.lineTo(4,5);c.closePath();c.fillStyle='#fff2d0';c.fill();c.restore();
 c.font='9px sans-serif';c.fillStyle='#bdd5cf';c.fillText('排水溝',w/2+12,py(GOAL.z)+4);c.fillText('START',w/2+12,py(7.1)+4);
}
