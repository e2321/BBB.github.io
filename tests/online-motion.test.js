import test from 'node:test';
import assert from 'node:assert/strict';
import {remoteFlopPose} from '../online-motion.js';
import {Session} from '../server/src/session.js';
test('remote A/D landing stays on authoritative support, including raised surfaces',()=>{for(const y of [.28,1.48])for(const elapsed of [0,.02,.1,.5])assert.equal(remoteFlopPose({grounded:true},{y,time:2,v:{y:0}},elapsed,'PLAYING').y,y);});
test('airborne A/D height and pose clock advance together without packet replay',()=>{const p={grounded:false,jumpGravity:20},s={y:1,time:3,v:{y:2}};assert.ok(Math.abs(remoteFlopPose(p,s,.05,'PLAYING').y-1.075)<1e-12);assert.equal(remoteFlopPose(p,s,.05,'PLAYING').time,3.05);assert.deepEqual(remoteFlopPose(p,s,.5,'PLAYING'),remoteFlopPose(p,s,.1,'PLAYING'));assert.equal(remoteFlopPose(p,s,.05,'COUNTDOWN').time,3);});
test('server colors are distinct and survive host exit and replacement',()=>{const s=new Session('ABC123');s.add('a','A');s.add('b','B');s.add('c','C');const color=s.members.get('b').color;s.remove('a');s.add('d','D');assert.equal(s.members.get('b').color,color);assert.equal(new Set(s.lobby().players.map(p=>p.color)).size,3);for(const p of s.members.values())s.ready(p.id,true);assert.equal(s.start(s.host),true);assert.equal(new Set(s.snapshot().players.map(p=>p.color)).size,4);s.connection('b',false);s.connection('b',true);assert.equal(s.snapshot().players[1].color,color);});

