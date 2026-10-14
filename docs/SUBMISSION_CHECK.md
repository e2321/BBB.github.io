# 公開・提出準備の確認結果（2026-10-14）

今回の変更はローカルで検証済みです。GitHubへのpush・デプロイ・設定変更は実行していません。

- npm.cmd test：71件成功。
- npm.cmd run prepare:submission：Viteビルド・静的パス検査成功。
- ブラウザーテスト：13件成功（全体実行後、修正した期待値と関連項目を再実行）。
- npm.cmd run test:pages：本番ビルドの6通りの起動成功。

| 配信パス | プロローグ | BBBノーマル | BBB厨房 |
| --- | --- | --- | --- |
| / | 成功 | 成功 | 成功 |
| /submission-check/ | 成功 | 成功 | 成功 |

モデル読み込み・開始・WebGLを確認。JavaScript例外、404、通信失敗はありません。Three.jsはビルドに同梱され、CDNやローカル絶対パスに依存しません。公開版には開発用window.__gameはありません。

成果物はdist/の12ファイル、58,729,074バイト。元の魚・コックGLBは変更せず、ビルド後もハッシュが一致します。distとnode_modulesはGit管理へ追加していません。

Viteの相対base設定と.github/workflows/pages.ymlは今回変更していません。公開・更新手順は[PUBLISHING.md](../PUBLISHING.md)を参照してください。

未確認：今回の変更をデプロイしたGitHub Actionsと公開HTTPS上の動作、Ryzen 5 5625U・内蔵GPU・8GB実機でのFPS、初心者による難易度評価、実スピーカーでの音量。ブラウザーテストはEdgeのソフトウェアWebGLを使用しています。
