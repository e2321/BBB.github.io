import {test,expect} from '@playwright/test';
test('offline Web Audio renders real stereo wet Foley and bounded eight-voice mixes',async({page})=>{
 await page.goto('/');const result=await page.evaluate(async()=>{
  const {synthesizeWet,AUDIO_RATE}=await import('/audio-synthesis.js');
  async function render(voices,spatial){const c=new OfflineAudioContext(2,AUDIO_RATE*.5,AUDIO_RATE),gain=c.createGain(),compressor=c.createDynamicsCompressor();gain.gain.value=.45;compressor.threshold.value=-18;compressor.knee.value=12;compressor.ratio.value=4;compressor.attack.value=.003;compressor.release.value=.12;gain.connect(compressor);compressor.connect(c.destination);
   for(let i=0;i<voices;i++){const data=synthesizeWet('land',i*911+31),buffer=c.createBuffer(1,data.length,AUDIO_RATE);buffer.copyToChannel(data,0);const source=c.createBufferSource();source.buffer=buffer;if(spatial){const panner=c.createPanner();panner.panningModel='equalpower';panner.distanceModel='inverse';panner.refDistance=2;panner.rolloffFactor=1.2;panner.positionX.value=-3;panner.positionZ.value=-1;source.connect(panner);panner.connect(gain);}else source.connect(gain);source.start();}
   const output=await c.startRendering(),channels=[output.getChannelData(0),output.getChannelData(1)];return {rms:channels.map(a=>Math.sqrt(a.reduce((n,v)=>n+v*v,0)/a.length)),peak:Math.max(...channels.map(a=>Math.max(...a.map(Math.abs)))),finite:channels.every(a=>a.every(Number.isFinite))};}
  return {stereo:await render(1,true),mix:await render(8,false)};
 });expect(result.stereo.finite).toBe(true);expect(result.stereo.rms[0]).toBeGreaterThan(.005);expect(result.stereo.rms[0]).toBeGreaterThan(result.stereo.rms[1]*2);expect(result.mix.finite).toBe(true);expect(result.mix.peak).toBeLessThan(1);console.log('OfflineAudio render:',JSON.stringify(result));
});

test('high-combo impacts and achievement accents stay below clipping in an eight-voice mix',async({page})=>{
 await page.goto('/');const result=await page.evaluate(async()=>{
  const {synthesizeWet,synthesizeEffect,EFFECT_GAINS,AUDIO_RATE}=await import('/audio-synthesis.js');
  const results=[];for(const accents of [false,true]){const c=new OfflineAudioContext(1,AUDIO_RATE*.6,AUDIO_RATE),master=c.createGain(),compressor=c.createDynamicsCompressor();master.gain.value=.45;compressor.threshold.value=-18;compressor.knee.value=12;compressor.ratio.value=4;compressor.attack.value=.003;compressor.release.value=.12;master.connect(compressor);compressor.connect(c.destination);
   for(let i=0;i<8;i++){const kind=accents&&i>=4?['comboBass','comboBass','comboUp','comboSuper'][i-4]:'heavy',data=kind==='heavy'?synthesizeWet(kind,59+i%3*139):synthesizeEffect(kind,27+i%3*197),buffer=c.createBuffer(1,data.length,AUDIO_RATE);buffer.copyToChannel(data,0);const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;gain.gain.value=kind==='heavy'?1.12*1.3*1.07:EFFECT_GAINS[kind]*1.07;source.connect(gain);gain.connect(master);source.start();}
   const buffer=await c.startRendering(),data=buffer.getChannelData(0);results.push({peak:Math.max(...data.map(Math.abs)),finite:data.every(Number.isFinite)});
  }return results;
 });for(const mix of result){expect(mix.finite).toBe(true);expect(mix.peak).toBeGreaterThan(.05);expect(mix.peak).toBeLessThan(1);}console.log('High-combo eight-voice mixes:',result);
});
