# 公開・提出準備の確認結果

GitHubへのアップロード・Pagesの設定変更・公開実行は行っていません。ローカルの静的成果物を確認した結果です。

- `npm.cmd run prepare:submission`：ビルド・公開用パス・資産検査に成功。
- `npm.cmd test`：57件成功。プロローグ・BBBのルールと元のGLBを確認。
- `npm.cmd run test:pages`：以下の4通りが成功。開発サーバーや開発フックを使用しない本番ビルドを検証。

| URLの配置 | モード | モデル・開始・操作・WebGL | JS例外・404・通信失敗 |
| --- | --- | --- | --- |
| / | PROLOGUE | 成功 | なし |
| / | BBB | 成功 | なし |
| /submission-check/ | PROLOGUE | 成功 | なし |
| /submission-check/ | BBB | 成功 | なし |

Three.js・addonsは公開用JavaScriptへ同梱。検証中の要求はすべて同じ配信元・同じ公開フォルダー配下に収まり、CDNやローカルPCのファイルを取得しません。モデルのテクスチャはGLB内に内包され、ビルド後のモデルのSHA-256は元ファイルと一致します。開発用`window.__game`は公開版にありません。

公開用ファイル：`dist/`の12ファイル、合計58,709,667バイト（約58.7MB / 56.0MiB）。`.nojekyll`とThree.jsのライセンス表記を含みます。ゲームのJS/CSS・モデル・ルール・操作・演出を変更せず、既存のソースをビルドしています。

新設・変更：
- `.github/workflows/pages.yml`：所有者が手動で開始するビルド・Pages公開ワークフロー。
- `package.json`・`package-lock.json`：Node.js要件と公開用検証コマンド。依存バージョンは維持。
- `index.html`：エントリーの参照を相対URLで明示。
- `public/.nojekyll`：静的成果物のマーカー。
- `tools/check-pages.mjs`・`tests/pages-smoke.mjs`：静的パス・モデルとサブフォルダーでの動作確認。
- `README.md`・`PUBLISHING.md`：最新の開発・公開手順。以前のREADMEは`docs/DEVELOPMENT_HISTORY.md`へ保全。
- `.gitignore`：生成した検証画像・結果を除外。開発ソース・制作資産・バックアップは保持。

未確認：GitHubのリポジトリ設定、GitHub Actionsの実行、実際の公開HTTPS URL、閲覧者のGPU・回線・実際のスピーカーでの音。所有者が公開した後、`PUBLISHING.md`の公開後チェックを行ってください。

公開後も同じソースを編集・Pushし、同じワークフローを手動実行すると同じURLを更新できます。Windows実行ファイルや別の提出専用ゲームは不要です。
