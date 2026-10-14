// Presentation-only timeline. Keep 100 ms of history to absorb 20 Hz packet jitter.
export class RemoteFlopTrack {
 constructor(){this.frames=[];this.pose={p:{x:0,y:0,z:0}};this.lastTime=-Infinity;}
 push(player,time){
  const frames=this.frames,last=frames.at(-1);
  if(last&&time<last.time)return;
  const frame={time,p:{...player.p},yaw:player.yaw,lastKey:player.lastKey,jumpStart:player.jumpStart,jumpPeriod:player.jumpPeriod,grounded:player.grounded};
  if(last&&time===last.time)frames.pop();frames.push(frame);
  if(frames.length>12)frames.shift();
 }
 sample(time){
  const frames=this.frames;if(!frames.length)return null;
  // Rendering must not rewind when a late packet arrives.
  time=Math.max(this.lastTime,Math.min(time,frames.at(-1).time));this.lastTime=time;
  let a=frames[0],b=a;
  for(const frame of frames){if(frame.time<=time)a=frame;else {b=frame;break;}b=a;}
  const t=b.time>a.time?Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time))):0,pose=this.pose;
  pose.time=Math.max(frames[0].time,time);pose.lastKey=a.lastKey;pose.jumpStart=a.jumpStart;pose.jumpPeriod=a.jumpPeriod;pose.grounded=a.grounded;
  pose.yaw=a.yaw+Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))*t;
  pose.p.x=a.p.x+(b.p.x-a.p.x)*t;pose.p.z=a.p.z+(b.p.z-a.p.z)*t;
  // Never blend a grounded body upward into a new hop before its start/side exists.
  pose.p.y=a.grounded?a.p.y:a.p.y+(b.p.y-a.p.y)*t;
  return pose;
 }
}
