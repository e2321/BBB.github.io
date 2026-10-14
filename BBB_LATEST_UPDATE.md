# BBB 最新調整

- A/D の水分消費は一律1%、Spaceは2%。回復は毎秒10%。コンボ倍率・CPUの復元済み基本性能は維持。
- ジャンプ開始直前の水分が10%未満なら、実際の着地時に通常BPの代わりに10BP減点し、コンボをリセット。10%ちょうどは通常加点。BP下限0。同じ着地の二重処理なし。
- BBBはHP4。水たまり3つを壁付近の `(-12,-4)`、`(12,4)`、`(5.5,13)` に配置。水面と回復の判定は共通。水中はビタン・Space・包丁を禁止し、A/Dの滑り移動で脱出可能。
- 通常ジャンプの基準高度1.05→1.26（20%増）。基準滞空時間0.5秒と横移動距離は維持。ブーストは調整後高度の1.5倍。
- BP増減を約0.85秒で上へ浮かせるHTML演出。黄色の獲得表示、赤の減点表示、最大6個。
- 50コンボで一度だけ「RAINBOW COMBO!!」と専用音。既存の素材・模様を保った弱い虹色の発光と各魚8点のキラキラ。コンボ終了後1秒で消える。能力と倍率は変更しない。
- 厨房のコックごとに疑問度ゲージ。確認状態に合わせて上昇し、見失うと低下。「今だ！」は実際の油断状態で表示。確認時間0.6→0.51秒、接近速度0.85→1.0。成功＋500／失敗−1000、成功窓0.8秒・解除後0.4秒・20秒クールダウンは維持。
- 短縮チュートリアルはHP5、高度1.05、消費2%／3%、回復8%/秒、コックの旧確認速度を維持。元の長い脱出コースも削除していない。

オンラインのルールは同じ `BattleSimulation` を使うため、ノーマルBBBと一致します。実Colyseus接続は依存ライブラリを取得できなかったため未検証です。起動・公開手順と残る検証は [ONLINE_FRIENDS.md](./ONLINE_FRIENDS.md) を参照してください。

## 検証結果

ゲーム単体104件、サーバーのゲーム・ロビー単体9件成功。Edgeのブラウザー検証13件成功（旧HP・配置の期待値修正後の再実行と、通信を使わないオンライン描画アダプターの検証を含む）。静的配信はルート／サブフォルダーそれぞれチュートリアル・ノーマル・厨房の計6通りが成功。Viteビルド、相対パス検査、既存GLB保護、Git差分の空白検査が成功。Gitリポジトリ `BBB/` に同じソースを同期し、本番ビルドも成功。

未確認：実Colyseus接続、複数ブラウザー間同期、本物の切断／再接続、公開WSS、公開後のGitHub Actions、指定PCでのFPS、高遅延時の操作感。統合テストは `ERR_MODULE_NOT_FOUND: colyseus.js` で開始できなかった。push・外部デプロイは実行していない。

## 変更ファイル

- ルール・AI：`battle-rules.js`、`battle-simulation.js`、`battle-ai.js`、`battle-chefs.js`、`tutorial-stage.js`
- 描画・操作・音：`battle-view.js`、`fish-model.js`、`game.js`、`index.html`、`style.css`、`audio-synthesis.js`、`wet-audio.js`
- オンラインのクライアント：`online-client.js`、`online-view.js`、`.env.example`
- サーバー：`server/package.json`、`server/.env.example`、`server/src/index.js`、`server/src/room.js`、`server/src/session.js`、`server/tests/session.test.js`、`server/tests/transport.integration.mjs`
- テスト：`tests/battle.test.js`、`tests/chef-tactics.test.js`、`tests/kitchen-balance.test.js`、`tests/restored-balance.test.js`、`tests/latest-bbb.test.js`、`tests/chef-tactics.browser.js`、`tests/game.browser.js`、`tests/latest-bbb.browser.js`、`tests/online-adapter.browser.js`
- 設定・文書：`package.json`、`vite.config.js`、`.gitignore`、`.github/workflows/pages.yml`、`README.md`、`docs/SUBMISSION_CHECK.md`、`BBB_LATEST_UPDATE.md`、`ONLINE_FRIENDS.md`

Viteの既存base・ポート設定は維持し、生成済みdistと作業キャッシュのみファイル監視から除外。Windowsで別フォルダーのGLBをビルド中に監視してEBUSYで開発サーバーが終了する問題を防ぐ。
