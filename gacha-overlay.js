import {itemDefinition} from './gacha-catalogue.js';
import {CATEGORY_NAMES} from './gacha-config.js';
import {assetURL} from './character-registry.js';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
// Use the existing sound toggle for both regular and developer gacha reveals.
export const gachaVideoMuted=(doc=globalThis.document)=>doc?.getElementById?.('sound')?.getAttribute?.('aria-pressed')==='false';
export const gachaVideoPath=results=>'assets/gacha/videos/'+(results.some(r=>r.type==='character')?'rare':'normal')+'.mp4';
export class GachaOverlay{
 constructor({host,results,cards,preview=()=>{},clearPreview=()=>{},sound=()=>{},closed=()=>{}}){
  Object.assign(this,{host,results,cards,preview,clearPreview,sound,closed});this.timers=[];this.mediaListeners=[];
  this.root=el('section',undefined,'gacha-fullscreen');this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-label','ガチャ排出結果');this.root.setAttribute('data-stage','video');this.returnFocus=document.activeElement;
  const skip=el('button','スキップ','gacha-skip');skip.addEventListener('click',()=>this.showResults());this.stage=el('div',undefined,'gacha-video-stage');this.root.append(skip,this.stage);host.append(this.root);this.root.classList?.toggle?.('rare',results.some(r=>r.type==='character'));
  this.key=e=>{if(e.key==='Escape'){e.preventDefault();this.finished?this.close():this.showResults();}if(e.key==='Tab'){const buttons=[...this.root.querySelectorAll('button')];if(!buttons.length)return;const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};this.root.addEventListener('keydown',this.key);skip.focus?.();this.sound('start');this.playVideo();
 }
 later(fn,ms){this.timers.push(setTimeout(()=>{if(!this.ended&&!this.finished)fn();},ms));}
 playVideo(){
  const video=this.video=el('video',undefined,'gacha-video');video.src=assetURL(gachaVideoPath(this.results));video.preload='auto';video.autoplay=true;video.muted=gachaVideoMuted();video.playsInline=true;video.controls=false;video.loop=false;video.setAttribute('playsinline','');video.setAttribute('aria-label',this.results.some(r=>r.type==='character')?'レア排出動画':'通常排出動画');
  this.videoStatus=el('p','演出動画を読み込んでいます… 結果は保存済みです。','gacha-video-status');this.playButton=el('button','タップして動画を再生','gacha-video-play');this.playButton.hidden=true;this.playButton.addEventListener('click',()=>this.tryPlay());this.stage.append(video,this.videoStatus,this.playButton);
  const listen=(name,fn)=>{const guarded=()=>{if(!this.ended&&!this.finished)fn();};video.addEventListener(name,guarded);this.mediaListeners.push([name,guarded]);};
  listen('playing',()=>{this.videoStarted=true;this.videoStatus.hidden=true;this.playButton.hidden=true;});
  listen('waiting',()=>{this.videoStatus.hidden=false;this.videoStatus.textContent='動画を読み込み中… スキップで結果を確認できます。';});
  listen('ended',()=>this.showResults());listen('error',()=>{this.videoFailure='動画を再生できなかったため、保存済みの結果を表示しました。';this.showResults();});
  this.later(()=>{if(!this.videoStarted){this.videoFailure='動画の読み込みを待ちきれなかったため、保存済みの結果を表示しました。';this.showResults();}},30000);
  this.later(()=>{this.videoFailure='動画の再生が止まったため、保存済みの結果を表示しました。';this.showResults();},180000);
  this.tryPlay();
 }
 tryPlay(){if(this.ended||this.finished)return;if(typeof this.video?.play!=='function'){this.videoFailure='動画非対応のため、保存済みの結果を表示します。';this.showResults();return;}try{const pending=this.video.play();pending?.catch?.(()=>{if(this.ended||this.finished)return;this.videoStatus.hidden=false;this.videoStatus.textContent='再生ボタンを押すか、スキップして結果を確認してください。';this.playButton.hidden=false;});}catch{this.playButton.hidden=false;}}
 stopVideo(){if(!this.video)return;for(const [name,fn]of this.mediaListeners)this.video.removeEventListener?.(name,fn);this.mediaListeners=[];try{this.video.pause?.();this.video.removeAttribute?.('src');this.video.load?.();}catch{}this.video=null;}
 playResultSound(){if(this.sounded)return;this.sounded=true;this.sound(this.results.some(r=>r.type==='character')?'result':'metal');}
 detail(result,host){const d=itemDefinition(result.type,result.id);if(!d)return;this.clearPreview();this.detailPanel?.remove?.();const pane=el('div',undefined,'gacha-large-item'),canvas=el('canvas');canvas.width=canvas.height=256;pane.append(el('h2',result.duplicate?'所持済みアイテム':({character:'新キャラクター獲得！',weapon:'新しい武器を獲得！',splash:'水しぶきエフェクト獲得！',presentation:'新しい演出を獲得！'}[result.type])),canvas,el('strong',d.name),el('p',CATEGORY_NAMES[result.type]),el('b',result.duplicate?`重複：${result.refund||50}コイン返還`:'NEW！'));if(d.slot==='combo')pane.append(el('strong','+50 BP / 50 COMBO',d.id==='combo-glow'?'combo-cosmetic-glow':''));host.append(pane);this.detailPanel=pane;this.preview(canvas,d);}
 showResults(){if(this.ended||this.finished)return;this.finished=true;this.timers.forEach(clearTimeout);this.stopVideo();this.clearPreview();this.root.setAttribute('data-stage','results');this.root.replaceChildren(el('h2',`${this.results.length>1?'10連':'ガチャ'} 結果`));const spotlight=el('div',undefined,'gacha-spotlight');this.root.append(spotlight);this.detail(this.results.find(r=>r.type==='character')||this.results[0],spotlight);if(this.videoFailure)this.root.append(el('p',this.videoFailure,'gacha-video-fallback'));this.cards(this.root,this.results,r=>this.detail(r,spotlight));const done=el('button','結果を閉じる','gacha-done');done.addEventListener('click',()=>this.close());this.root.append(done);this.playResultSound();done.focus?.({preventScroll:true});this.root.scrollTop=0;}
 close(){if(this.ended)return;this.ended=true;this.timers.forEach(clearTimeout);this.stopVideo();this.clearPreview();this.root.removeEventListener?.('keydown',this.key);this.root.remove?.();this.closed();this.returnFocus?.focus?.({preventScroll:true});}
}
