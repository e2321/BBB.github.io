import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

export async function checkPages(directory='dist'){
 const root=resolve(directory),html=await readFile(join(root,'index.html'),'utf8'),entries=[];
 for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
  const url=match[1];assert.ok(url.startsWith('./'),`Entry must use a relative URL: ${url}`);
  assert.ok((await stat(resolve(root,url))).isFile(),`Missing entry asset: ${url}`);entries.push(url);
 }
 assert.ok(entries.some(url=>url.endsWith('.js')),'No production JavaScript');assert.ok(entries.some(url=>url.endsWith('.css')),'No production CSS');
 const files=[];async function walk(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const path=join(folder,entry.name);if(entry.isDirectory())await walk(path);else if(entry.isFile())files.push(path);}}await walk(root);
 for(const path of files.filter(path=>/\.(html|js|css)$/.test(path))){const text=await readFile(path,'utf8');
  assert.ok(!/(?:file:\/\/|[A-Za-z]:[\\/](?:Users|Program Files)|https?:\/\/(?:localhost|127\.0\.0\.1))/.test(text),`Local-only reference in ${relative(root,path)}`);
  if(path.endsWith('.js'))assert.ok(!/\b(?:from|import)\s*["'](?:three(?:\/|["'])|https?:\/\/)/.test(text),'An external JavaScript dependency was not bundled');
 }
 const models=[];for(const name of ['madai.glb','chef.glb','squid.glb']){
  const built=await readFile(join(root,'assets/models',name)),original=await readFile(join('public/assets/models',name));assert.equal(built.toString('ascii',0,4),'glTF',`Invalid or LFS-pointer model: ${name}`);
  assert.equal(createHash('sha256').update(built).digest('hex'),createHash('sha256').update(original).digest('hex'),`Model changed during build: ${name}`);
  const gltf=JSON.parse(built.subarray(20,20+built.readUInt32LE(12)).toString());for(const asset of [...(gltf.buffers||[]),...(gltf.images||[])])assert.ok(!asset.uri||asset.uri.startsWith('data:'),`Model refers to an external file: ${asset.uri}`);
  models.push({name,bytes:built.length,embeddedTextures:true});
 }
 for(const name of ['.nojekyll','THIRD_PARTY_NOTICES.txt','favicon.svg'])assert.ok((await stat(join(root,name))).isFile(),`Missing ${name}`);
 const bytes=(await Promise.all(files.map(file=>stat(file)))).reduce((sum,file)=>sum+file.size,0);
 return {directory:root,relativeEntries:entries,files:files.length,bytes,models};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await checkPages(),null,2));
