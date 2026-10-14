export const SERVICE_HEADER='bbb-friends-server';
export const PAGES_ORIGIN='https://e2321.github.io';
export function originPolicy(env=process.env){
 const production=env.NODE_ENV==='production'||env.RENDER==='true';
 const fallback=production?PAGES_ORIGIN:'http://localhost:5173,http://127.0.0.1:5173';
 const origins=new Set((env.ALLOWED_ORIGINS?.trim()||fallback).split(',').filter(value=>value.trim()).map(value=>{
  let url;try{url=new URL(value.trim());}catch{throw new Error('ALLOWED_ORIGINSにはHTTP(S)の接続元URLをカンマ区切りで設定してください。');}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('ALLOWED_ORIGINSにワイルドカード・認証情報・クエリは使用できません。');
  // An accidental full game URL or trailing slash still denotes its exact Origin.
  return url.origin;
 }));
 if(!origins.size)throw new Error('ALLOWED_ORIGINSに有効な接続元がありません。');
 return {origins,production,allows:origin=>origin===undefined||origin===''||origins.has(origin)};
}
export function corsHeaders(origin,policy){
 const headers={'X-BBB-Service':SERVICE_HEADER,'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept, Authorization','Access-Control-Expose-Headers':'X-BBB-Service, X-BBB-Error','Access-Control-Allow-Credentials':'true'};
 if(origin&&policy.allows(origin))headers['Access-Control-Allow-Origin']=origin;
 return headers;
}
export function handleCors(req,res,policy){
 for(const [key,value] of Object.entries(corsHeaders(req.headers.origin,policy)))res.setHeader(key,value);
 if(!policy.allows(req.headers.origin)){
  console.warn('[BBB origin denied]',JSON.stringify({method:req.method,path:req.url.split('?')[0],origin:req.headers.origin}));
  res.setHeader('X-BBB-Error','ORIGIN_NOT_ALLOWED');res.setHeader('Content-Type','application/json; charset=utf-8');res.writeHead(403);res.end(JSON.stringify({error:'許可されていない接続元です。公開者がALLOWED_ORIGINSを確認してください。',code:'ORIGIN_NOT_ALLOWED'}));return false;
 }
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return false;}
 return true;
}
