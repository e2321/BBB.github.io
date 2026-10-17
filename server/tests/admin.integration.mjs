import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {once} from 'node:events';
import {AdminService,adminRouter} from '../src/admin.js';
const secret='local-unit-test-only';
test('authenticated HTTP actions, revoked token and secure transport requirements are enforced by the router',async()=>{
 const app=express();app.use(express.json());app.use('/admin',adminRouter({service:new AdminService({password:secret}),env:{NODE_ENV:'development'}}));app.use('/production',adminRouter({service:new AdminService({password:secret}),env:{NODE_ENV:'production'}}));const server=app.listen(0,'127.0.0.1');await once(server,'listening');const base='http://127.0.0.1:'+server.address().port;
 const post=(path,body={},token)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
 try{assert.equal((await post('/admin/action',{type:'coins',value:1})).status,401);assert.equal((await post('/production/login',{password:secret})).status,403);const response=await post('/admin/login',{password:secret});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const {token}=await response.json();const result=await post('/admin/action',{type:'coins',value:100},token);assert.equal(result.status,200);assert.equal((await result.json()).test.coins,100);assert.equal((await post('/admin/logout',{},token)).status,200);assert.equal((await post('/admin/action',{type:'coins',value:100},token)).status,401);}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
