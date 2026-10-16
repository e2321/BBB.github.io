import test from 'node:test';
import assert from 'node:assert/strict';
import {wakeServer,abortableDelay} from '../online-wakeup.js';
import {developmentEnv} from '../tools/dev-all.mjs';
test('sleeping service retries only health, with a finite budget and progress',async()=>{let calls=0;const attempts=[];await wakeServer(async()=>{if(++calls<3)throw new TypeError('network');return {ok:true};},{onAttempt:n=>attempts.push(n),wait:async()=>{}});assert.equal(calls,3);assert.deepEqual(attempts,[1,2,3]);});
test('persistent failure stops after three attempts; permission errors do not retry',async()=>{let calls=0;await assert.rejects(wakeServer(async()=>{calls++;throw new Error('down');},{wait:async()=>{}}),/down/);assert.equal(calls,3);calls=0;await assert.rejects(wakeServer(async()=>{calls++;const e=new Error('forbidden');e.diagnostic={status:403};throw e;},{wait:async()=>{}}),/forbidden/);assert.equal(calls,1);});
test('cancelling wake wait prevents further requests',async()=>{const c=new AbortController();let calls=0;await assert.rejects(wakeServer(async()=>{calls++;throw new Error('sleeping');},{signal:c.signal,wait:async()=>c.abort()}),{name:'AbortError'});assert.equal(calls,1);});
test('invalid health does not count as success',async()=>{await assert.rejects(wakeServer(async()=>({html:true}),{wait:async()=>{}}),/起動確認/);});
test('combined development command overrides production endpoint only in child environment',()=>{const original={NODE_ENV:'production',VITE_ONLINE_SERVER_URL:'wss://example.invalid',KEEP:'yes'};const local=developmentEnv(original);assert.equal(local.VITE_ONLINE_SERVER_URL,'ws://localhost:2567');assert.equal(local.PORT,'2567');assert.equal(local.KEEP,'yes');assert.equal(original.NODE_ENV,'production');});

test('backoff cancellation clears its timer immediately',async()=>{const controller=new AbortController();const pending=abortableDelay(2000,controller.signal);controller.abort();await assert.rejects(pending,{name:'AbortError'});});
