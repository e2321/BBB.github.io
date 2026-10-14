export async function readOnlineResponse(response,context){
 const diagnostic={...context,status:response.status,service:response.headers.get('X-BBB-Service'),code:response.headers.get('X-BBB-Error'),contentType:response.headers.get('Content-Type')};
 const text=await response.text();let data;try{data=JSON.parse(text);}catch{}
 const source=diagnostic.service==='bbb-friends-server'?'ゲームサーバー':'発生元未確認（Renderまたは旧サーバーを確認）';
 if(!response.ok){const reason=typeof data?.error==='string'?data.error.slice(0,200):'接続が拒否されたか、サーバーが応答できませんでした。';const error=new Error(`HTTP ${response.status} / ${source}：${reason}`);error.diagnostic=diagnostic;throw error;}
 if(!data||typeof data!=='object'){const error=new Error(`HTTP ${response.status} / ${source}：JSONではない応答です。サーバーの起動待ち・公開設定を確認してください。`);error.diagnostic=diagnostic;throw error;}
 return data;
}
