// Input conversion only. All cooldowns, movement, water and scoring stay in the shared game rules.
export class TapInput {
 constructor({flop,attack,view,menu,fullscreen,look,lastKey=()=>''}){this.actions={attack,view,menu,fullscreen};this.flop=flop;this.look=look;this.lastKey=lastKey;this.buttons=new Map();this.camera=null;this.side='';}
 down(id,action){if(this.camera?.id===id||this.buttons.has(id)||[...this.buttons.values()].includes(action))return false;if(action!=='bitan'&&!this.actions[action])return false;this.buttons.set(id,action);if(action==='bitan'){this.side=this.side==='A'?'D':'A';this.flop(this.side);}else this.actions[action]();return true;}
 beginLook(id,x,y){if(this.camera||this.buttons.has(id))return false;this.camera={id,x,y};return true;}
 move(id,x,y){const p=this.camera;if(!p||p.id!==id)return false;const dx=x-p.x,dy=y-p.y;p.x=x;p.y=y;this.look(dx,dy);return true;}
 release(id){this.buttons.delete(id);if(this.camera?.id===id)this.camera=null;}
 reset(){this.buttons.clear();this.camera=null;const key=this.lastKey();this.side=['A','D'].includes(key)?key:'';}
}
