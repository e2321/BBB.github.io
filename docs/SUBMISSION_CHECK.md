# 公開・提出準備の確認結果（2026-10-14）

今回の変更はローカルで検証済みです。GitHubへのpush・デプロイ・設定変更は実行していません。

- npm.cmd test：104件成功。サーバーの依存なし単体テスト9件も成功。
- npm.cmd run prepare:submission：Viteビルド・静的パス検査成功。
- ブラウザーテスト：厨房・開始演出・短いチュートリアル・既存機能の17件が成功。全体実行の16件と、旧プロローグの期待値を短縮版に更新した該当1件の再実行を合わせて確認。
- npm.cmd run test:pages：本番ビルドの6通りの起動成功。

| 配信パス | プロローグ | BBBノーマル | BBB厨房 |
| --- | --- | --- | --- |
| / | 成功 | 成功 | 成功 |
| /submission-check/ | 成功 | 成功 | 成功 |

モデル読み込み・開始・WebGLを確認。JavaScript例外、404、通信失敗はありません。Three.jsはビルドに同梱され、CDNやローカル絶対パスに依存しません。公開版には開発用window.__gameはありません。

成果物はdist/の12ファイル、58,749,961バイト。元の魚・コックGLBは変更せず、ビルド後もハッシュが一致します。distとnode_modulesはGit管理へ追加していません。

Viteの相対base設定と.github/workflows/pages.ymlは今回変更していません。公開・更新手順は[PUBLISHING.md](../PUBLISHING.md)を参照してください。

未確認：オンラインBBBの実Colyseus接続・複数ブラウザー通信（npm接続がEACCESで拒否され、ライブラリ未取得）、今回の変更をデプロイしたGitHub Actionsと公開HTTPS上の動作、Ryzen 5 5625U・内蔵GPU・8GB実機でのFPS、実プレイによる難易度評価、実スピーカーでの音量。ブラウザーテストはEdgeのソフトウェアWebGLを使用しています。

CPUの復元元、最終バランス、操作方法、変更ファイル一覧は [CHEF_TACTICS_AND_BALANCE.md](CHEF_TACTICS_AND_BALANCE.md) に記載しています。

プロローグは短い3段階の練習へ変更し、スキップ・BBBへの遷移・クリア済み保存を確認しました。操作を即実行する通し自動テストは23.65秒、各段階に8秒の読解待ちを入れたシミュレーションは45.88秒でした。初見の人による実測は未確認です。BBBはノーマル・厨房の2ステージで、コンロは選択肢と未使用定義を削除しました。詳細は [SHORT_TUTORIAL_UPDATE.md](SHORT_TUTORIAL_UPDATE.md) を参照してください。

今回のオンライン構成・起動・公開手順は [ONLINE_FRIENDS.md](../ONLINE_FRIENDS.md)、最新のBBB仕様は [BBB_LATEST_UPDATE.md](../BBB_LATEST_UPDATE.md)。旧ブラウザー検証件数は前回の記録で、今回の追加検証結果は最新変更記録へ記載します。
