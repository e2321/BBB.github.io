// A drawing-buffer resize clears its content, even if the size is unchanged.
// Queue changes from UI/FPS events and apply them before the next game draw.
export class DrawingBufferSize {
 constructor(renderer,camera){this.renderer=renderer;this.camera=camera;this.pending=null;this.applied=null;this.requests=0;this.changes=0;}
 request(width,height,ratio){if(![width,height,ratio].every(Number.isFinite)||width<=0||height<=0||ratio<=0)return false;this.requests++;this.pending={width:Math.max(1,Math.floor(width)),height:Math.max(1,Math.floor(height)),ratio};return true;}
 apply(){const next=this.pending;if(!next)return false;this.pending=null;const old=this.applied,canvas=this.renderer.domElement;
  if(old&&old.width===next.width&&old.height===next.height&&canvas.width===Math.floor(next.width*next.ratio)&&canvas.height===Math.floor(next.height*next.ratio))return false;
  // One operation instead of setPixelRatio (which calls setSize) + setSize.
  this.renderer.setDrawingBufferSize(next.width,next.height,next.ratio);this.camera.aspect=next.width/next.height;this.camera.updateProjectionMatrix();this.applied=next;this.changes++;return true;
 }
}
export class SingleFrameLoop {
 constructor(draw,{request=callback=>requestAnimationFrame(callback),cancel=id=>cancelAnimationFrame(id)}={}){this.draw=draw;this.request=request;this.cancel=cancel;this.running=false;this.pending=null;this.starts=0;this.frames=0;this.maxPending=0;this.callback=now=>{this.pending=null;if(!this.running)return;try{this.draw(now);this.frames++;}finally{this.schedule();}};}
 schedule(){if(this.running&&this.pending===null){this.pending=this.request(this.callback);this.maxPending=Math.max(this.maxPending,1);}}
 start(){if(this.running)return false;this.running=true;this.starts++;this.schedule();return true;}
 stop(){this.running=false;if(this.pending!==null)this.cancel(this.pending);this.pending=null;}
 snapshot(){return {activeLoops:this.running?1:0,pendingFrames:this.pending===null?0:1,starts:this.starts,frames:this.frames,maxPending:this.maxPending};}
}
