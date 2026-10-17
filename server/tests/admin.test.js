import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {once} from 'node:events';
import {AdminService,adminRouter,ADMIN_TTL} from '../src/admin.js';
import {collection} from '../../gacha-store.js';
import {Session} from '../src/session.js';
const secret='local-unit-test-only';
test('admin fails closed when unconfigured, rate limits login and enforces expiry and logout',()=>{
 let now=1000;const service=new AdminService({password:secret,now:()=>now});
 assert.throws(()=>new AdminService({password:''}).login(secret,'a'),e=>e.status===503);
 for(let i=0;i<5;i++)assert.throws(()=>service.login('wrong','a'),e=>e.status===401);
 assert.throws(()=>service.login(secret,'a'),e=>e.status===429);now+=60001;
 const login=service.login(secret,'a');assert.equal(login.expiresAt,now+ADMIN_TTL);assert.equal(JSON.stringify(login).includes(secret),false);
 assert.throws(()=>service.action('unknown',{type:'coins',value:100}),e=>e.status===401);
 service.action(login.token,{type:'coins',value:100});service.logout(login.token);assert.throws(()=>service.action(login.token,{type:'coins',value:100}),e=>e.status===401);
 const other=service.login(secret,'b');now+=ADMIN_TTL;assert.throws(()=>service.session(other.token),e=>e.status===401);
});
test('TEST coins, ownership, selection, draws and pure simulations never mutate player collection or rooms',()=>{
 const before=JSON.stringify(collection.data),s=new AdminService({password:secret,random:()=>.1}),a=s.login(secret,'a').token,b=s.login(secret,'b').token;
 s.action(a,{type:'coins',value:10000});let r=s.action(a,{type:'draw',count:10});assert.equal(r.test.draws,10);assert.equal(r.test.owned.includes('squid'),true);assert.equal(r.test.coins,9550);
 const snapshot=JSON.stringify(r.test);r=s.action(a,{type:'simulate',count:1000});assert.equal(r.result[0].count,1000);assert.equal(r.result[0].expected,5);assert.equal(JSON.stringify(r.test),snapshot);
 assert.equal(s.session(b).store.data.coins,0);s.action(a,{type:'unlock',id:'all'});s.action(a,{type:'select',id:'octopus'});assert.equal(s.session(a).store.data.selected,'octopus');s.action(a,{type:'resetOwned'});assert.deepEqual(s.session(a).store.data.owned,['fish']);
 const room=new Session('09');room.add('a','Actual Player');const bp=room.sim.players[0].points;s.action(a,{type:'game',field:'bp',value:100000,roomId:room.roomId});assert.equal(room.sim.players[0].points,bp);assert.equal(JSON.stringify(collection.data),before);
 for(const body of [{type:'roomBP',value:100},{type:'coins',value:-1},{type:'draw',count:1000},{type:'game',field:'hp',value:999},{type:'select',id:'bad'},{type:'simulate',count:2}])assert.throws(()=>s.action(a,body),e=>e.status===400);
 s.action(a,{type:'resetTest'});assert.equal(s.session(a).store.data.coins,0);
});
test('real Express admin router rejects insecure and unauthenticated operations, accepts credentials and revokes token',async()=>{
 const router=adminRouter({service:new AdminService({password:secret}),env:{NODE_ENV:'development'}});
 const request=(url,body={},token)=>new Promise((resolve,reject)=>{const req={method:'POST',url,headers:token?{authorization:'Bearer '+token}:{},socket:{remoteAddress:'127.0.0.1'},body};const res={headers:{},statusCode:200,set(k,v){this.headers[k]=v;return this;},status(n){this.statusCode=n;return this;},json(data){resolve({status:this.statusCode,data,headers:this.headers});}};router.handle(req,res,reject);});
 assert.equal((await request('/action',{type:'coins',value:100})).status,401);const login=await request('/login',{password:secret});assert.equal(login.status,200);assert.equal(login.headers['Cache-Control'],'no-store');const token=login.data.token;assert.equal((await request('/action',{type:'coins',value:100},token)).data.test.coins,100);assert.equal((await request('/logout',{},token)).status,200);assert.equal((await request('/action',{type:'coins',value:100},token)).status,401);
 const prod=adminRouter({service:new AdminService({password:secret}),env:{NODE_ENV:'production'}});let denied;prod.handle({method:'POST',url:'/login',headers:{'x-forwarded-proto':'https'},socket:{remoteAddress:'127.0.0.1'},body:{password:secret}},{set(){return this;},status(n){denied=n;return this;},json(){}},()=>{});assert.equal(denied,403);
});
