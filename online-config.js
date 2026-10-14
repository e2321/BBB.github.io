// Shared by Vite, publication checks and the browser. No network or game rules here.
export function resolveOnlineConfig(value,{production=false,pageProtocol='http:'}={}){
 const raw=String(value||'').trim();if(!raw)return {url:'',http:''};
 let endpoint;try{endpoint=new URL(raw);}catch{throw new Error('オンライン接続先URLの形式が不正です。公開者がVITE_ONLINE_SERVER_URLを確認してください。');}
 if(!['ws:','wss:'].includes(endpoint.protocol))throw new Error('オンライン接続先にはws://またはwss://を指定してください。本番公開ではwss://が必要です。');
 if((production||pageProtocol==='https:')&&endpoint.protocol!=='wss:')throw new Error('本番公開・HTTPSページではWSSが必須です。公開者がVITE_ONLINE_SERVER_URLに公開サーバーのwss://URLを設定して再公開してください。');
 if(production&&(endpoint.hostname==='localhost'||endpoint.hostname.endsWith('.localhost')||endpoint.hostname==='[::1]'||endpoint.hostname==='0.0.0.0'||/^127\./.test(endpoint.hostname)))throw new Error('本番接続先にlocalhostは使えません。公開サーバーのWSS URLを設定してください。');
 if(endpoint.username||endpoint.password)throw new Error('接続先URLに認証情報を含めないでください。公開サーバーのWSS URLだけを設定してください。');
 if(endpoint.search||endpoint.hash)throw new Error('接続先URLにクエリや#を含めないでください。サーバーの接続先URLを確認してください。');
 const url=endpoint.toString().replace(/\/$/,'');return {url,http:url.replace(/^ws/,'http')};
}
export function missingOnlineMessage(production){return production?'サーバー未接続：公開用の接続先が未設定です。公開者がGitHub Actionsのリポジトリ変数VITE_ONLINE_SERVER_URLを設定し、ゲームを再公開してください。友達側の設定は不要です。':'サーバー未接続：開発用の接続先が未設定です。ゲーム本体の.env.localにVITE_ONLINE_SERVER_URLを設定し、Viteを再起動してください。';}
