// Serialize selection + Colyseus seat reservation in the single Render process.
// Reserved seats count towards capacity before the WebSocket connects.
export class QuickMatcher {
 constructor({list,create,reserve}){this.list=list;this.create=create;this.reserve=reserve;this.tail=Promise.resolve();}
 join(options){const task=this.tail.then(async()=>{
  let candidates=[...this.list()].filter(r=>r.session.quick&&r.session.phase==='LOBBY'&&(r.session.waitDeadline===undefined||r.session.now()<r.session.waitDeadline)&&!r.locked&&!r.hasReachedMaxClients()).sort((a,b)=>(b.session.members?.size||0)-(a.session.members?.size||0));
  for(const room of candidates){try{return await this.reserve(room,options);}catch(error){if(!room.locked&&!room.hasReachedMaxClients())throw error;}}
  const room=await this.create();return this.reserve(room,options);
 });this.tail=task.catch(()=>{});return task;}
}
export const QUICK_WAIT_SECONDS=60;
