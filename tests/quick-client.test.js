import test from 'node:test';import assert from 'node:assert/strict';import {OnlineFriends} from '../online-client.js';
class Node extends EventTarget{constructor(){super();this.hidden=false;this.value='';this.style={};this.children=[];}replaceChildren(){this.children=[];}append(n){this.children.push(n);}}
function fixture(){const old=globalThis.document,nodes=new Map();globalThis.document={getElementById(id){if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);},createElement:()=>new Node()};const f=new OnlineFriends(()=>({receive(){}}),()=>{},()=>{});f.enabled=true;f.sdk=async()=>{};f.ensureConnected=async()=>{};return{f,nodes,close(){f.leave(false);globalThis.document=old;}};}
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const room=()=>({sessionId:'a',reconnectionToken:'secret',listeners:{},onMessage(k,fn){this.listeners[k]=fn;},onLeave(){},onError(){},send(){},async leave(){this.left=true;}});
test('one quick click starts exactly one request; cancellation prevents a late reservation from joining',async()=>{const {f,close}=fixture();try{let calls=0,joins=0;const d=defer();f.api=async()=>{calls++;return d.promise;};f.client={consumeSeatReservation:async()=>{joins++;return room();}};const first=f.quickMatch();await new Promise(r=>setImmediate(r));await f.quickMatch();assert.equal(calls,1);f.cancelQuick();d.resolve({});await first;assert.equal(joins,0);assert.equal(f.room,null);assert.equal(f.busy,false);}finally{close();}});
test('late WebSocket completion after cancel is left and cannot replace the next room',async()=>{const {f,close}=fixture();try{const d=defer(),old=room();f.api=async()=>({});f.client={consumeSeatReservation:()=>d.promise};const first=f.quickMatch();await new Promise(r=>setImmediate(r));f.cancelQuick();d.resolve(old);await first;assert.equal(old.left,true);assert.equal(f.room,null);}finally{close();}});
test('quick lobby shows waiting humans and quick results; private room retains its rematch controls',()=>{const {f,nodes,close}=fixture();try{f.room=room();const data={code:'00',host:'a',phase:'LOBBY',round:0,quick:true,quickRemaining:5,fillCpu:true,maxHP:3,players:[{id:'a',slot:0,name:'A',connected:true},{id:'b',slot:1,name:'B',connected:true}]};f.renderLobby(data);assert.match(nodes.get('onlineQuickCount').textContent,/2 \/ 4/);assert.equal(nodes.get('onlineReady').disabled,true);f.renderLobby({...data,phase:'RESULT'});assert.equal(nodes.get('onlineQuickResults').hidden,false);assert.equal(nodes.get('onlineResultsControls').hidden,true);f.renderLobby({...data,quick:false,phase:'RESULT'});assert.equal(nodes.get('onlineQuickResults').hidden,true);assert.equal(nodes.get('onlineResultsControls').hidden,false);}finally{close();}});
test('quick result retry exits the previous room and consumes one fresh reservation',async()=>{const {f,close}=fixture();try{const old=room(),next=room();f.room=old;f.api=async()=>({});f.client={consumeSeatReservation:async()=>next};await f.quickMatch(true);assert.equal(old.left,true);assert.equal(f.room,next);assert.equal(f.seq,0);}finally{close();}});

test('friend joining preserves two-digit leading zero in lookup and Colyseus join options',async()=>{const {f,nodes,close}=fixture();try{document.getElementById('onlineCodeInput').value='00';const joined=room();let lookup,options;f.api=async path=>{lookup=path;return {code:'00',roomId:'private'};};f.client={joinById:async(id,data)=>{assert.equal(id,'private');options=data;return joined;}};await f.join(false);assert.equal(lookup,'/rooms/00');assert.equal(options.code,'00');assert.equal(f.code,'00');assert.equal(f.room,joined);}finally{close();}});


test('menu wake and repeated quick clicks share one health request and reserve exactly once',async()=>{
 const {f,close}=fixture(),oldLocation=globalThis.location;globalThis.location={protocol:'https:',origin:'https://example.invalid'};
 try{f.url='wss://fixture.invalid';f.ensureConnected=OnlineFriends.prototype.ensureConnected.bind(f);const d=defer();let health=0,reservations=0;f.api=async path=>{if(path==='/health'){health++;return d.promise;}assert.equal(path,'/quick-match');reservations++;return {};};f.client={consumeSeatReservation:async()=>room()};const menu=f.show(),quick=f.quickMatch();await f.quickMatch();assert.equal(health,1);d.resolve({ok:true});await Promise.all([menu,quick]);assert.equal(reservations,1);assert.equal(f.checking,false);assert.ok(f.room);
 }finally{close();globalThis.location=oldLocation;}
});

test('cancel during health wake prevents reservation and retry uses a fresh connection task',async()=>{
 const {f,close}=fixture(),oldLocation=globalThis.location;globalThis.location={protocol:'https:',origin:'https://example.invalid'};
 try{f.url='wss://fixture.invalid';f.ensureConnected=OnlineFriends.prototype.ensureConnected.bind(f);const d=defer();let health=0,reservations=0;f.api=async path=>{if(path==='/health')return ++health===1?d.promise:{ok:true};reservations++;return {};};f.client={consumeSeatReservation:async()=>room()};const cancelled=f.quickMatch();f.cancelQuick();const next=f.quickMatch();d.resolve({ok:true});await Promise.all([cancelled,next]);assert.equal(health,2);assert.equal(reservations,1);assert.ok(f.room);
 }finally{close();globalThis.location=oldLocation;}
});


test('quick retry resumes quick matching after a wake failure, never a private room',async()=>{
 const {f,nodes,close}=fixture();try{let wakes=0;f.ensureConnected=async()=>{if(++wakes===1)throw new Error('起動待ち失敗');};const paths=[];f.api=async path=>{paths.push(path);return {};};f.client={consumeSeatReservation:async()=>room()};await f.quickMatch();assert.equal(f.room,null);assert.equal(nodes.get('onlineQuickWaiting').hidden,true);assert.match(nodes.get('onlineRetry').textContent,/再試行/);await f.retryConnection();assert.deepEqual(paths,['/quick-match']);assert.ok(f.room);assert.equal(f.retryAction,null);}finally{close();}
});

test('private create and code-join retry resume their own action after wake failure',async()=>{
 for(const create of [true,false]){const {f,close}=fixture();try{document.getElementById('onlineCodeInput').value='07';let calls=0;f.ensureConnected=async()=>{if(++calls===1)throw new Error('sleeping');};const paths=[];f.api=async(path,method)=>{paths.push([path,method]);return {code:'07',roomId:'private',ticket:'ticket'};};f.client={joinById:async()=>room()};await f.join(create);assert.equal(f.room,null);await f.retryConnection();assert.deepEqual(paths,[[create?'/rooms':'/rooms/07',create?'POST':'GET']]);assert.equal(f.code,'07');assert.ok(f.room);}finally{close();}}
});

test('friend room request and SDK wait for successful health; cancellation during wake blocks both',async()=>{
 const {f,nodes,close}=fixture(),oldLocation=globalThis.location;globalThis.location={protocol:'https:',origin:'https://example.invalid'};
 try{f.url='wss://fixture.invalid';f.ensureConnected=OnlineFriends.prototype.ensureConnected.bind(f);const d=defer();let sdk=0,roomRequests=0;f.sdk=async()=>{sdk++;};f.api=async path=>{if(path==='/health')return d.promise;roomRequests++;return {};};const pending=f.join(true);assert.equal(nodes.get('onlineConnection').hidden,false);assert.match(nodes.get('onlineConnectionText').textContent,/オンラインサーバーを起動/);assert.equal(sdk,0);assert.equal(roomRequests,0);f.cancelQuick();d.resolve({ok:true});await pending;assert.equal(sdk,0);assert.equal(roomRequests,0);assert.equal(f.retryAction,null);
 }finally{close();globalThis.location=oldLocation;}
});
