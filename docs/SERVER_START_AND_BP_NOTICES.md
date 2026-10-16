# 開発サーバー起動とBP一時通知の修正

## ローカル起動（Windows PowerShell）

ゲーム本体の `package.json` があるディレクトリで初回のみ実行：

```powershell
npm install
npm run server:install
```

以後は次の1コマンドでViteとColyseusを起動する：

```powershell
npm run dev:all
```

- ゲーム： http://127.0.0.1:5173/
- Colyseus： ws://localhost:2567
- 終了：起動したPowerShellで `Ctrl+C`。Windowsでは子プロセスのツリーも終了対象にする。
- 起動前に5173・2567の使用を確認する。使用中なら起動せず、既存サーバーを終了する案内を出す。既存プロセスを勝手に停止しない。
- 子プロセスが異常終了した場合はもう片方も終了する。
- 接続先は子プロセスの環境変数 `VITE_ONLINE_SERVER_URL=ws://localhost:2567` で設定する。保存済みの本番設定や `.env.local` を書き換えない。
- Viteの変更反映は継続。共通ロジックを含めサーバーコードを変更した場合は、このコマンドを終了して再起動する。
- 従来の個別起動 `npm run dev`、`npm run server:dev` は残してある。個別のVite起動でも開発用接続先が空ならlocalhost:2567を使う。

## 公開版

GitHub Actionsのリポジトリ変数 `VITE_ONLINE_SERVER_URL` に本番WSS URLを設定する：

```text
wss://bbb-friends-server.onrender.com
```

既存のPagesワークフローはこの値をビルドへ渡す。本番の未設定時はlocalhostへ接続せず、設定不足を案内する。

オンライン選択時とルーム作成・参加・クイックマッチ時は、HTTPの `/health` を確認する。同時に選択しても起動確認は共有する。起動確認のみ最大3回、1回30秒・間隔2秒、合計最大約94秒で打ち切る。403など設定上のエラーは即座に案内する。接続中・起動待ち・成功・失敗を表示し、待機中のキャンセルを用意した。

ルーム作成POSTやクイックマッチ予約POSTは自動再送しない。ルーム接続は25秒で打ち切り、キャンセルやタイムアウト後に遅れて成立した接続は退出させる。2桁コード・ロビー・再戦のサーバールールは変更していない。

`render.yaml` は既存の `plan: free`、`healthCheckPath: /health`、Node起動コマンド、Origin制限を維持している。実際に契約中のプランやDashboard設定はこの作業環境から確認できていない。

[Render公式仕様](https://render.com/docs/free)では、無料Webサービスは15分の無通信で休止し、次のHTTP/WebSocket接続で復帰する（約1分）。起動待ちをなくしたい場合は、Render Dashboardの該当WebサービスのInstance Typeで有料インスタンスへの変更を検討する。クライアント修正では常時稼働を保証できない。監視サービス等の定期アクセスは追加していない。

起動・BP通知修正だけならRender再デプロイは不要。ただし、後続のレインボー水分消費変更はサーバーが共通ルールを読み込むため、Renderにも再デプロイが必要（詳細は RENDER_WAKEUP.md）。公開フロントエンドへの反映には、変更のコミット・Push後、既存のPages自動公開が必要（Push・デプロイは実行していない）。

## BP表示が残る原因と修正

旧処理はCSSの `animationend` だけでDOMを削除していた。設定の「動きを減らす」は全体に `animation:none!important` を適用するため、終了イベントが発生せず一時表示が残った。

- CSSとは独立した850msの期限で削除する。
- 同時表示は最大4個、古いものから削除する。
- 管理タイマーは1つ。高速に1000回通知しても表示数とタイマー数を制限する。
- イベント種別・魚ID・発生時刻・獲得量から重複を抑止する履歴は最大64件。
- 試合開始・結果・再戦・ホーム復帰による破棄時にDOMとタイマーをクリアする。
- コンボ横の一時的なBP表示にも実時間の期限を追加する。
- 合計BPのHUD、計算、実績・統計の記録には変更を加えていない。

## 確認結果と限界

PowerShellから両サーバーの起動ログを確認。再度の起動はポート競合で拒否され、Ctrl+C後は両ポートを再確保できた。

自動テストで、無アニメーション時の期限削除・高速通知の上限・重複抑止・クリア・起動確認の有限再試行・キャンセル・同時接続確認の共有・遅延した接続の退出を確認した。

本環境ではループバックへのHTTP通信がアクセス制限で拒否されたため、起動済みゲームへのブラウザ接続、PC/スマホ実機、Render起動復帰、実際の2人クイックマッチと友達ルームの再戦は未確認。Renderの公開 `/health` も取得できず、本番通信の成功は未確認。

フロント274件・サーバー29件の自動テストが全件成功。Vite本番ビルドとPages相対パス検査も成功。ビルドには既存の500kB超チャンクに関する警告がある。


## 変更ファイル

- `package.json`、`tools/dev-all.mjs`：同時起動・終了とポート確認。
- `online-client.js`、`online-wakeup.js`、`game.js`、`index.html`：自動起動確認・待機案内・キャンセル・有限再試行。
- `battle-view.js`、`tutorial-view.js`、`bp-notifications.js`：通知の期限・上限・重複抑止と場面切り替え時のクリア。
- `tests/bp-notifications.test.js`、`tests/online-wakeup.test.js`、`tests/quick-client.test.js`、`tests/rainbow-area-life.test.js`：回帰テストの追加・既存UIモックの更新。
- 本書。ゲームの得点計算・サーバー側ルール・公開設定の変更なし。

Git管理されている `BBB/` と、その親の既存開発用ファイルへ同じ変更を反映した。`node_modules`、`dist`、環境変数ファイルをGit管理へ追加していない。
