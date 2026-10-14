# 厨房・バランス調整の実装記録

既存ゲームへ差分を統合しました。修正前のソースは `backups/before-kitchen-balance/` に保存しています。

## 主な変更

- 第1区間：既存障害物を左右交互の仕切りとして再配置。前後間隔1.15m、通行幅1.9m。描画と当たり判定を一致させ、直進経路を遮断。開始・ゴール・進行・第2区間以降は維持。
- BBB選択：ノーマルと厨房をプレイ可能にし、コンロはCOMING SOONで無効化。厨房は軽量設備、既存モデルのコック2体、共通の対戦ルールを使用。
- 厨房限定死んだふり：地上で停止すると既存姿勢へ移行し、A/DかSpaceで解除。発見→接近→確認→油断→解除→短時間内のビタンで500BP。倍率なし、コックごと20秒待機、同じ死んだふりで二重取得不可。ヒント・驚き・専用音を追加。
- 水分消費：A/Dは次の有効コンボに応じて2/3/4/5/6%。Spaceは3%。コンボ倍率・毎秒5%回復は維持。
- ブースト：各ステージ3個。跳躍高度のみ1.5倍、8秒間、15秒で再出現。再取得は時間のみ更新。リング表示・残時間UI・取得音を追加。
- 移動能力：水分0/15/30/50/70%以上で25/45/65/85/100%、滑らかに補間。加速・旋回にも適用。安全な既存ジャンプ減衰曲線は維持。
- CPU：加速80%、通常BP約82.5%、攻撃頻度75%。反応・旋回・命中精度・回復判断を調整。首位のプレイヤーを少し狙い、迂回と停滞時の経路再計算を維持。

## 変更ファイル

- コース：`stage.js`、`kitchen.js`
- BBB：新規 `battle-stages.js`、`battle-chefs.js`、変更 `battle-rules.js`、`battle-simulation.js`、`battle-ai.js`、`battle-view.js`
- UI・音：`game.js`、`index.html`、`style.css`、`audio-synthesis.js`
- 検証：`tests/battle.test.js`、`tests/simulation.test.js`、`tests/route-controller.js`、`tests/game.browser.js`、`tests/pages-smoke.mjs`、新規 `tests/kitchen-balance.test.js`、`tests/kitchen.browser.js`
- 説明：`README.md`、`PUBLISHING.md`、`docs/SUBMISSION_CHECK.md`、本書

## 動作確認

直進失敗・ジグザグ通過、全区間クリア（CP5/5）、第2区間以降のデータ不変、ステージ選択、厨房限定死んだふり、500BP・不正条件拒否・20秒待機・CPU取得、水分消費全段階、ブースト取得・更新・失効・再出現、天井判定、低水分時の移動、CPUの90秒進行を自動検証しました。

既存Space着地BP・コンボ・HP・包丁・刺身回復・復活・順位表示も回帰テストを実施。モデルとアニメーションは再利用し、オンライン通信は追加していません。

件数・公開用ビルド・未確認事項は [SUBMISSION_CHECK.md](SUBMISSION_CHECK.md) を参照してください。CPUと初心者向け難易度の実プレイ評価は残っています。
