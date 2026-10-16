# 友達がゲームURLとルームコードだけで参加するための公開手順

公開先は次の2つに分けます。

- ゲーム画面：今までどおり https://e2321.github.io/BBB.github.io/
- 対戦サーバー：RenderのWeb Service。Renderが発行した実際のHTTPS/WSS URLを使います。

**以下の初期設定はゲームの公開者だけが行います。友達にはIPアドレス、PowerShell、サーバー起動、環境変数の設定を求めません。現在、外部サーバーの公開はまだ実行していません。**

## 1. 公開するファイル

Gitリポジトリ `C:\Users\shota\game-project\BBB` のソースを使います。新しい `render.yaml` はこのリポジトリのルートにあります。`server/package-lock.json` も必要です。サーバーが共通の `battle-*.js` などを参照するため、`server` フォルダーだけを別のリポジトリへコピーしないでください。

`.env.local`、`node_modules`、`dist` をGitHubへ追加しないでください。GitHub Actionsは今までどおりソースからゲームをビルドします。ローカルの `.env.local` にある localhost は各PC自身を意味するため、本番の接続先には使いません。

変更したファイルをGitHubへ反映する操作は、公開者が内容を確認してから行います。この作業ではcommit、push、Renderへの公開は行っていません。

GitHub Desktopを使う場合は、次の順で反映できます。

1. 対象リポジトリが `BBB.github.io`、作業フォルダーが `C:\Users\shota\game-project\BBB` になっていることを確認します。
2. **Changes** で `render.yaml`、`server/DEPLOYMENT.md`、`ONLINE_FRIENDS.md`、`README.md` の変更内容を確認します。ほかに自分の作業があれば、必要なものだけ選びます。
3. Summaryに公開設定の追加などを入力し、**Commit to main** を押します。
4. **Push origin** を押します。この操作は公開者が確認してから実行してください。既存のGitHub Pages自動公開も開始します。
5. GitHubのリポジトリ画面で `render.yaml` と `server/package-lock.json` が見えることを確認し、次へ進みます。

## 2. Renderでサーバーを作る

1. [Render](https://dashboard.render.com/)に登録・ログインします。
2. GitHubとの接続を許可し、`e2321/BBB.github.io` リポジトリを選べるようにします。
3. **New → Blueprint** を選び、このリポジトリの **main** ブランチを選びます。設定ファイルはルートの **render.yaml** です。
4. サービス名は `bbb-friends-server`、種類は **Web Service / Node** になっていることを確認します。
5. プラン、環境変数、作成されるサービスを確認し、問題なければ **Deploy Blueprint / Apply** を押します。この操作で実際の公開が始まります。
6. ログにテスト成功と `BBB server listening on port ...` が表示され、状態が **Live** になるまで待ちます。

設定ファイルは初回確認用のFreeプランです。**Freeは15分間アクセスがないと休止し、再起動に約1分かかります。** 今のゲームの接続確認は6秒でタイムアウトするため、休止直後は「サーバー未接続」と表示されることがあります。無料で試す場合は、公開者が先にサーバーの `/health` を開いて起動を待ち、その後ゲームを開いてください。初回アクセスから手間なく遊べる運用には、RenderのWeb Serviceを常時稼働する有料Computeプランへ変更してください。料金はRenderの確認画面で確認します。Blueprintに課金プランは指定していません。[Freeの公式仕様](https://render.com/docs/free)

Blueprintが使えない場合は **New → Web Service** から同じリポジトリを選び、次の値を入力できます。

| Renderの項目 | 入力内容 |
|---|---|
| Branch | `main` |
| Root Directory | **空欄**（`server` と入力しない） |
| Language / Runtime | `Node` |
| Region | `Singapore` |
| Build Command | `npm ci --prefix server --omit=dev && npm --prefix server test && npm --prefix server run test:integration` |
| Start Command | `npm --prefix server start` |
| Health Check Path | `/health` |
| Instances | `1` |
| Auto-Deploy | **Off** |
| Environment: NODE_VERSION | `24.21.0` |
| Environment: NODE_ENV | `production` |
| Environment: ALLOWED_ORIGINS | `https://e2321.github.io` |

`PORT` はRenderが設定する値を使うので、2567で上書きしないでください。サーバーは既に `0.0.0.0` と `PORT` に対応しています。外部サーバーは確認してから更新できるよう自動デプロイをOffにしています。既存のGitHub Pagesの自動公開は維持しています。

## 3. サーバーの公開URLを確認する

Renderのサービス画面に表示された **実際のHTTPS URL** をコピーします。ここでは仮のドメインを本番値として設定しません。

1. そのURLの末尾に `/health` を付けてブラウザーで開きます。`{"ok":true,"version":1}` が表示されればHTTPの起動確認ができています。
2. 同じURLの末尾に `/sdk/colyseus.js` を付けて開きます。JavaScriptが表示・ダウンロードされることを確認します。
3. そのHTTPS URLの先頭 `https://` を **`wss://`** に置き換えます。これがゲームに設定する接続先です。末尾に `/health`、`/sdk`、`:2567` は付けません。

HTTPの起動確認だけではオンライン対戦の完成確認にはなりません。後述の別PCでの参加・試合テストも必要です。RenderはWeb ServiceでHTTPSとWebSocketを扱えます。[WebSocketの公式説明](https://render.com/docs/websocket)

## 4. GitHub Pagesに接続先を設定する

1. GitHubの **e2321/BBB.github.io → Settings** を開きます。
2. **Secrets and variables → Actions → Variables** を開きます。
3. **New repository variable** を押します。
4. Nameは **`VITE_ONLINE_SERVER_URL`**、Valueは手順3で作った **実際の `wss://` URL** にします。既に変数がある場合は値を更新します。
5. **Settings → Pages → Source** は既存の **GitHub Actions** のままにします。
6. **Actions → Publish game to GitHub Pages → Run workflow → main → Run workflow** でゲームを再公開します。既存のmainへのpushによる自動公開も利用できます。変数の保存だけでは公開済みのゲームは更新されません。
7. ワークフローが成功した後、ゲームURLを開いてブラウザーを再読み込みします。古い画面が残る場合はCtrl+F5で再読み込みします。

接続先はViteのビルド時にゲームへ組み込まれます。友達ごとに設定する必要はありません。このURLは公開接続先であり、秘密鍵・再接続トークンなどを変数に入れる必要はありません。

公開ワークフローはビルド前に接続先を検査します。`ws://`、localhost、不正なURLを本番値に設定すると公開を中止し、既存の公開ゲームを維持します。未設定の場合は警告を出し、オフラインゲームを公開できます。ゲームのオンライン画面には、公開者が `VITE_ONLINE_SERVER_URL` を設定して再公開する必要があると表示します。

ローカルで本番ビルドを作る場合は、`.env.production.example` を `.env.production.local` にコピーし、実際のWSS接続先を設定して `npm.cmd run prepare:submission` を実行します。オンラインを設定せずオフライン版だけをビルドする場合は値を空にします。このファイルはGit管理から除外しています。開発用 `.env.local` の `ws://localhost:2567` は引き続き `npm.cmd run dev` で使えます。本番ビルドではWSを拒否するため、開発用の値しかない場合は本番用の値を明示してください。

PowerShellで以前 `$env:VITE_ONLINE_SERVER_URL` を設定した場合、その値はenvファイルより優先されます。ファイルの設定を使いたい場合は、ビルドするターミナルで `Remove-Item Env:VITE_ONLINE_SERVER_URL -ErrorAction SilentlyContinue` を実行してください。開発用 `.env.local` の内容は削除する必要はありません。

WSS設定の追加検証では、単体110件、未設定時の本番ビルド・静的パス検査、WS設定の拒否、WSS値のビルド成果物への組み込みが成功しました。HTTPSページのブラウザー検証では、未設定原因の表示、WS・localhost拒否、HTTPSの接続確認リクエストを確認しました。このブラウザー検証のHTTP応答はテスト用で、公開WSSサーバーへの実通信を確認したものではありません。

## 5. 別PCの友達と確認する

1. 両者が **https://e2321.github.io/BBB.github.io/** を開きます。別のネットワークでも試してください。
2. 両者が **BBB（オンライン友達対戦）** を選びます。
3. ホストが **ルームを作成** を押します。2桁数字のルームコード（00〜99）を友達へ伝えます。
4. 友達がコードを入力して **ルームに参加** を押します。名前と人数が同じロビーに表示されることを確認します。
5. 全員が **準備完了** にし、ホストが **ゲーム開始** を押します。2人ならCPU2匹が加わります。
6. 同じ3秒カウントダウンから開始し、互いの移動、包丁、HP、水分、BP、90秒後の順位が同期していることを確認します。
7. オフラインBBBとプロローグも引き続き開始できることを確認します。

ここまで公開URLで確認した後に「友達がURLとコードだけで遊べる」と判断してください。ローカルで動くだけでは公開完了ではありません。

## 6. うまく接続できない場合

| 表示・症状 | 公開者が確認すること |
|---|---|
| オンライン接続先が未設定 | GitHubのVariablesの名前・値、保存後にPagesのワークフローを実行したか |
| HTTPS公開時はWSS… | 変数の先頭が `wss://` か。`ws://localhost:2567` を設定していないか |
| サーバー未接続・応答が遅い | RenderがLiveか、Freeの休止中ではないか、実際のURLの `/health` が応答するか |
| 接続元が許可されていない・403 | `ALLOWED_ORIGINS=https://e2321.github.io` か。`/BBB.github.io/` は含めない |
| Cannot find module | RenderのRoot Directoryが空欄か。共通ゲームJSとserverのソースがGitHubにあるか |
| npm ciが失敗 | `server/package-lock.json` がGitHubにあり、package.jsonと一致しているか |
| ロビーが別々・コードが見つからない | 両者のゲームが同じ公開WSS URLでビルドされているか、サーバーを複数インスタンスにしていないか |

現サーバーはメモリでルームを管理します。インスタンスは1つにしてください。サーバーの再起動・再公開では既存の部屋と試合が終了します。更新は友達との試合が終わってから、Renderの **Manual Deploy → Deploy latest commit** で実施します。

## 今回の確認結果

外部へのpush・サーバー公開・GitHub側設定変更は実行していません。ローカルの実Colyseus統合テストでは、HTTP/SDK配信、4クライアント参加、カウントダウン、不正入力拒否、ジャンプの確定BP・水分、再接続が成功しました。サーバー単体9件、GitHub Pages用ビルドと静的パス検査も成功しました。本番用の許可Origin、Colyseusの認証情報付きCORS、不正Originの403拒否、PORT指定、依存ロックの一致をローカルで確認しています。ゲームルール・オフラインBBB・プロローグのソースは変更していません。別PC・公開HTTPS/WSS・GitHub Pagesからの実通信、RenderでのBlueprint適用はまだ未確認です。

設定仕様の参照：[RenderのNode公開手順](https://render.com/docs/deploy-node-express-app)、[Blueprint設定](https://render.com/docs/blueprint-spec)、[ヘルスチェック](https://render.com/docs/health-checks)。


実績・装備のオンライン検証を再起動後も保持する場合、RenderのEnvironmentでBBB_PROFILE_SECRET（32文字以上のランダム値）を登録してください。実値をGitやVITE_変数へ入れないでください。詳細・集計規則は [ホームと実績](../docs/ARCADE_HOME.md) を参照してください。
