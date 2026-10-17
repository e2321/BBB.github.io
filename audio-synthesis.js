// Original wet-fish Foley synthesis. No copyrighted samples or external assets.
export const AUDIO_RATE=22050;
export function synthesizeWet(kind='land',seed=1){
 const stroke=kind==='stroke',dry=kind==='dry',puddle=kind==='puddle',fast=kind==='fast',light=kind==='light',heavy=kind==='heavy',duration=stroke?.11:fast?.16:dry?.20:puddle?.28:.25,out=new Float32Array(Math.ceil(AUDIO_RATE*duration));let state=seed>>>0;
 const random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
 const bodyHz=(heavy?57:light?115:72)+random()*37,bodyPhase=random()*Math.PI,waterHz=420+random()*260;
 const drops=Array.from({length:stroke?3:dry?2:puddle?11:7},()=>({at:.014+random()*(stroke?.05:.12),hz:1300+random()*2800,amp:(.035+random()*.075)*(dry?.12:puddle?1.35:1)}));
 let low=0,previous=0,wet=0;for(let i=0;i<out.length;i++){
  const t=i/AUDIO_RATE,noise=random()*2-1;low=.83*low+.17*noise;const high=noise-previous;previous=noise;wet=.52*wet+.48*high;
  const attack=1-Math.exp(-t*1800),decay=Math.exp(-t*(stroke?52:dry?36:29));
  const impact=(Math.sin(2*Math.PI*bodyHz*t+bodyPhase)*.45+Math.sin(2*Math.PI*bodyHz*.53*t)*.16)*attack*decay;
  const splash=(wet*.21+low*.30+Math.sin(2*Math.PI*(waterHz*t-450*t*t))*.08)*attack*Math.exp(-t*34)*(1+.25*Math.sin(t*360))*(dry?.1:puddle?1.4:1);
  let droplets=0;for(const d of drops){const age=t-d.at;if(age>=0)droplets+=Math.sin(2*Math.PI*(d.hz*age-1900*age*age))*d.amp*(1-Math.exp(-age*3000))*Math.exp(-age*135);}
  out[i]=(impact+splash+droplets)*(stroke?.45:1)*Math.min(1,(duration-t)*100);
 }
 let peak=0;for(const value of out)peak=Math.max(peak,Math.abs(value));const scale=.72/(peak||1);for(let i=0;i<out.length;i++)out[i]*=scale;return out;
}
export const EFFECT_GAINS={uiSelect:.09,uiStart:.15,rainbow:.28,countdown:.20,matchStart:.28,chefFail:.25,boost:.22,chefSurprise:.22,chefBonus:.25,comboBass:.10,comboUp:.23,comboSuper:.28,water:.12,throw:.17,metal:.20,hit:.22,eat:.20,sashimi:.18,absorb:.25,leader:.36,respawn:.20,fanfare:.26,warning:.25,win:.30,lose:.23};
export function synthesizeEffect(kind,seed=1){
 const notes={uiSelect:[880,1175],uiStart:[659,988,1319],rainbow:[523,659,784,1047,1319,1568],countdown:[440],matchStart:[523,784,1047],chefFail:[392,294,196],boost:[440,660,880],chefSurprise:[220,660,330],chefBonus:[659,880,1047,1320],comboUp:[523,784,1047],comboSuper:[523,659,784,1047,1568],eat:[330,660,440],absorb:[659,880,1047],leader:[523,659,784,1047],respawn:[440,659],fanfare:[523,659,784],warning:[330,440],win:[523,659,784,1047],lose:[392,349,262]},duration=kind==='uiSelect'?.085:kind==='uiStart'?.18:kind==='comboSuper'?.36:kind==='comboBass'?.12:kind==='win'||kind==='lose'?.42:kind==='throw'?.10:kind==='metal'?.22:.26,out=new Float32Array(Math.ceil(AUDIO_RATE*duration));let state=seed,low=0,previous=0;const random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;},detune=.98+random()*.04;
 for(let i=0;i<out.length;i++){const t=i/AUDIO_RATE,n=random()*2-1;low=.76*low+.24*n;const band=n-previous;previous=n;let value=0;
  if(kind==='comboBass')value=(Math.sin(2*Math.PI*(75*t-100*t*t)*detune)*.4+Math.sin(2*Math.PI*150*t*detune)*.08)*Math.exp(-t*32)*(1-Math.exp(-t*1500));
  else if(kind==='throw')value=(band*.38+low*.3)*Math.sin(Math.PI*t/duration)**2;
  else if(kind==='metal')value=(Math.sin(t*2*Math.PI*730*detune)*.35+Math.sin(t*2*Math.PI*1793)*.24+Math.sin(t*2*Math.PI*3281)*.12)*Math.exp(-t*27)*(1-Math.exp(-t*3000));
  else if(kind==='hit')value=(Math.sin(2*Math.PI*(110*t+260*t*t))*.37+low*.22+band*.15)*Math.exp(-t*31)*(1-Math.exp(-t*2000));
  else if(kind==='sashimi')value=(Math.sin(2*Math.PI*(340*t-490*t*t)*detune)* .35+Math.sin(2*Math.PI*(510*t-735*t*t)*detune)*.1)*Math.exp(-t*14)*(1-Math.exp(-t*500));
  else if(kind==='water')value=(low*.23+Math.sin(2*Math.PI*(850*t-850*t*t))*.13)*Math.exp(-t*25)*(1-Math.exp(-t*700));
  else for(let k=0;k<(notes[kind]||[]).length;k++){const age=t-k*(duration/(notes[kind].length+1));if(age>=0)value+=(Math.sin(2*Math.PI*notes[kind][k]*detune*age)*.28+Math.sin(4*Math.PI*notes[kind][k]*age)*.05)*Math.exp(-age*23)*(1-Math.exp(-age*1500));}
  out[i]=value*Math.min(1,(duration-t)*100);
 }let peak=0;for(const v of out)peak=Math.max(peak,Math.abs(v));for(let i=0;i<out.length;i++)out[i]*=.62/(peak||1);return out;
}
