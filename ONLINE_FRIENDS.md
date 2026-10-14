# BBB オンライン友達対戦

既存の静的フロントエンドにオンラインメニューと同期用描画を追加し、`server/` に Colyseus 0.16 のサーバーを分けています。オフラインとオンラインは同じ `BattleSimulation` を使用します。オンラインはノーマルのみ。厨房・コンロはオンラインメニューで選択できません。

## 現在の検証状況

サーバーのゲーム・ロビールールは依存ライブラリなしの単体テストで検証しています。この作業環境では npm レジストリへのアクセスが EACCES で拒否されたため、Colyseus のインストール、実サーバー起動、実 WebSocket 接続、複数ブラウザー通信、再接続トークンの実通信は未検証です。オンライン対戦が完成・公開済みという扱いにはしていません。公開前に下記の接続テストを実施してください。

## ローカル起動

Node.js 22.12 以上を使用します。プロジェクトのルートで次を実行します。

```powershell
npm.cmd ci
npm.cmd run server:install
npm.cmd run server:dev
```

別のターミナルでフロントエンドを起動します。

```powershell
$env:VITE_ONLINE_SERVER_URL='ws://127.0.0.1:2567'
npm.cmd run dev
```

必要に応じて `.env.local` に `VITE_ONLINE_SERVER_URL=ws://127.0.0.1:2567` を記載して Vite を再起動できます。サーバー設定は環境変数を使います（`server/.env.example` は説明用で、自動読込ではありません）。接続先が空なら「サーバー未接続」となり、オフライン BBB とチュートリアルは遊べます。

## 2人で接続テスト

1. Edge と Chrome、または通常ウィンドウとシークレットウィンドウで `http://127.0.0.1:5173/` を開きます。
2. 両方で「BBB（オンライン友達対戦）」を選び、名前を入力します。
3. 一方で「ルームを作成」、もう一方で表示された6文字コードを入力して参加します。
4. 2人とも準備完了にし、ホストがゲーム開始します。CPU2匹が追加されます。
5. 3秒のカウントダウン後、A/D・Space・包丁で遊び、位置、HP、水分、BP、順位が一致することを確認します。
6. 90秒終了時の順位を比較します。3人・4人参加、満員、開始後参加、存在しないコードも確認します。
7. 一方の接続を短く切断し、20秒以内の復帰、切断中のCPU操作、20秒経過後の退出を確認します。明示的な退出では復帰トークンを削除します。

```powershell
npm.cmd test
npm.cmd run test:online
npm.cmd --prefix server run test:integration
npm.cmd run prepare:submission
```

`test:online` はゲーム・ロビーの単体テストです。`test:integration` は本物の Colyseus サーバーをポート2568で起動し、SDK配信・4クライアント・カウントダウン・不正入力拒否・再接続を検証します。実ブラウザーの操作感や遅延は別途確認が必要です。

## GitHub Pages

フロントエンドは従来どおり Vite の相対パス `base: './'` と `.github/workflows/pages.yml` で公開します。GitHub の Settings → Pages → Source は **GitHub Actions** を維持してください。

サーバー公開後、Settings → Secrets and variables → Actions → Variables に `VITE_ONLINE_SERVER_URL` を追加し、実際の `wss://` 接続先を設定します。既存ワークフローはこの変数をビルドへ渡します。未設定ならオフライン公開を継続できます。環境変数変更後は再ビルドが必要です。URLは秘密情報ではありません。トークンや管理者秘密鍵は設定しないでください。

SDK は設定されたオンラインサーバーの `/sdk/colyseus.js` から読み込みます。GitHub Pages のビルドには Colyseus 依存を追加していません。サーバーへの接続を選ぶまで外部SDKを読み込みません。

## オンラインサーバー公開

- Node.js と WebSocket 常時接続に対応したホストを用意し、このプロジェクトのソースも含めて配置します。サーバーはルートの共通ゲーム判定を参照するため、`server/` 単体だけをコピーしないでください。
- 初回は `npm --prefix server install`、起動は `npm --prefix server start`。インストール成功後の `server/package-lock.json` を保存し、以降は `npm --prefix server ci` で固定してください。この環境ではロックファイルを生成できていません。
- `PORT` をホスト指定値、`ALLOWED_ORIGINS` を `https://e2321.github.io` に設定します。開発用接続元を併記する場合はカンマ区切りにします。
- HTTPS/WSS と WebSocket の Upgrade 転送を有効にし、`/health`、`/rooms`、`/sdk/colyseus.js`、Colyseus `/matchmake` と WebSocket 経路を同じドメインで公開します。
- 現実装は単一プロセス・単一インスタンスです。ルーム管理をメモリに保持するため複数インスタンスへの無設定の分散配信はできません。サーバー再起動では試合が終了します。
- インストール後に統合テストと複数ブラウザー試験を行ってから公開してください。GitHubへのpush・外部デプロイはユーザーの確認後に行います。

## 実装上の分担と制限

サーバーが位置・HP・水分・BP・コンボ・包丁・刺身・ブースト・CPU・試合時間・結果を計算します。クライアントは操作と視点を送り、描画・カメラ・効果音を担当します。入力の連番、種類、数値、頻度を検証し、BP/HP/位置の確定値を受け付けません。部屋のコードはサーバーの暗号乱数から生成し、ホスト作成チケットと Colyseus の再接続トークンを使用します。

描画は20Hzの確定状態へ補間し、自分のジャンプ姿勢と位置のみを先行表示します。完全な入力履歴巻き戻し・再計算は未実装です。高遅延での操作感、大量接続の負荷、実トークンの不正復帰拒否は今後の実通信試験で確認が必要です。オンライン厨房は未実装です。

参考： [Colyseus 0.16 のクライアントAPI](https://0-16-x.docs.colyseus.io/client)、[ルームと再接続](https://0-16-x.docs.colyseus.io/room)。
