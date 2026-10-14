# Render 403・CORS修正

対象ゲーム：https://e2321.github.io/BBB.github.io/

対象サーバー：https://bbb-friends-server.onrender.com/

## 調査結果

従来コードは `ALLOWED_ORIGINS` がない場合にlocalhostのみを許可していました。さらに、Colyseusより前のHTTPガードが、Origin拒否時にヘッダーも本文もない403を返していました。設定不足や、ゲームのパスまで含めた許可URLの不一致で、報告された「403＋Access-Control-Allow-Originなし」が発生する経路を確認しました。

今回の環境から公開サーバーへのGET・OPTIONSを試しましたが、ネットワーク制限の `EACCES` で取得できませんでした。したがって、**本番の403がこの旧コードから返されたのか、Renderなどの上流から返されたのかは断定していません。**

## 修正内容

- GET `/health` は明示的にHTTP 200と `{"ok":true,"version":1}` を返す。
- 本番（`NODE_ENV=production` またはRender環境）で未設定の場合、既知のPages Originだけを既定で許可。開発時は既存のlocalhost2種類を維持。
- 設定したURLはOriginへ正規化。末尾の `/` や、誤って `/BBB.github.io/` まで設定した場合も、同一のOriginに整理。リクエストのOriginは完全一致で検証。
- `*` は許可しない。明示したOriginだけを許可し、他のサイトや `Origin: null` は拒否。
- ExpressのAPIとColyseusのmatchmake経路の前で、共通のCORS・OPTIONS処理を実行。
- 許可したOriginには `Access-Control-Allow-Origin`、`Vary: Origin`、Methods、Headers、Credentials、診断ヘッダーのExposeを設定。OPTIONSは204。
- WebSocket Upgradeにも同じOrigin判定を適用。
- 全アプリ応答へ `X-BBB-Service: bbb-friends-server` を追加。Origin拒否は403 JSON、`X-BBB-Error: ORIGIN_NOT_ALLOWED` とRenderログの `[BBB origin denied]`／`[BBB WebSocket origin denied]` で識別する。
- クライアントは読み取れたHTTPステータス・サービス識別・エラーコードを表示し、Consoleの `[BBB online connection]` にURL・Origin・応答情報を出す。HTMLの403をJSON構文エラーとして扱わない。

不許可Originのレスポンスには、そのOriginを許可するヘッダーは付けません。CORSでブラウザーが遮断した場合、JavaScriptはステータスや本文を取得できないため、クライアントはHTTP 403を推測して表示せず、NetworkとRenderログで確認する案内を表示します。

## 本番へ反映する手順

**Renderの再デプロイが必要です。** 環境変数の保存だけでは、公開中の古いサーバーコードは更新されません。

1. 変更内容を確認し、公開者がGitHubへ反映します。この作業ではpushしていません。
2. Renderで `bbb-friends-server` の **Environment** を開き、次を確認します。
   - `NODE_ENV`：`production`
   - `ALLOWED_ORIGINS`：`https://e2321.github.io`
   - `PORT`：Renderの値を使う。2567で上書きしない。
3. **Manual Deploy → Deploy latest commit** を実行します。この作業では実行していません。
4. ログの `[BBB origins]` に `https://e2321.github.io` が含まれ、状態がLiveであることを確認します。
5. ゲーム側の診断表示も更新するため、既存GitHub Pagesの公開ワークフローを実行します。mainへのpushでも自動公開されます。リポジトリ変数 `VITE_ONLINE_SERVER_URL` は `wss://bbb-friends-server.onrender.com` にします。
6. 公開ゲームを再読み込みして、オンライン→ルーム作成→コード参加を別PCで確認します。

## 発生元の切り分け

ブラウザーのDevTools → Networkで `/health` のResponse HeadersとRenderの同時刻ログを確認します。

| 結果 | 判断・次の確認 |
|---|---|
| 200 JSON＋`X-BBB-Service`＋許可Originヘッダー | 更新済みアプリのHTTP・CORSは正常 |
| 403＋`X-BBB-Service`＋`X-BBB-Error: ORIGIN_NOT_ALLOWED` | アプリのOrigin検証で拒否。設定とOrigin拒否ログを比較 |
| 識別ヘッダーがない403 | 上流の拒否、または旧コードが動いている可能性。最新コミットのデプロイ状態とRender設定を確認。ヘッダーなしだけでは発生元を断定しない |
| `/health` には到達できるがmatchmake・WSだけ失敗 | NetworkのOPTIONS・matchmake応答とWebSocketのOrigin拒否ログを確認 |

公開者のPCで使える確認コマンド（Windows）：

```powershell
curl.exe -i -H "Origin: https://e2321.github.io" https://bbb-friends-server.onrender.com/health
curl.exe -i -X OPTIONS -H "Origin: https://e2321.github.io" -H "Access-Control-Request-Method: GET" https://bbb-friends-server.onrender.com/health
```

GETは200、OPTIONSは204、両方に `Access-Control-Allow-Origin: https://e2321.github.io` が期待値です。ブラウザーのConsoleでは次でも確認できます。

```javascript
fetch('https://bbb-friends-server.onrender.com/health')
  .then(async r => console.log(r.status, r.headers.get('X-BBB-Service'), await r.json()))
  .catch(console.error);
```

## ローカル検証

フロントエンド単体114件、サーバー単体14件成功。実Colyseusの既存4クライアント対戦・再接続テストと、今回のCORS／OPTIONS／Origin検証を実サーバーで確認。公開WSS・別PC・実際のRender応答は未確認です。ゲームルール・オフラインBBB・プロローグは変更していません。
