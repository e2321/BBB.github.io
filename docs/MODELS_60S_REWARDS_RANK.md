# 新モデル・60秒対戦・BPコイン・ランク改修（2026-10-17）

## 実装した仕様

### モデル

- イカは導入済みの `assets/models/squid.glb` と共有ロード・既存しなりアニメーションを再利用。
- 開発用コピーにあった `starfish.glb`（121,692 bytes）を正本の `public/assets/models/` に配置。既存ID `starfish` のURLだけ変更し、所持・装備・排出率を維持。未所持の解放はしない。
- 実GLBはBodyを持つ平たいXZ形状。全体Box3を取得し、中心を表示Group内で補正、最大XZ幅を従来の表示用ローカル長0.455へ正規化。ゲーム座標・判定は変更しない。
- 対戦は元の平たい姿勢、ホーム／装備はカメラの高さを上げて表面を見せる。カメラの全体フィットと専用canvas枠を維持。プレビューの尺度を物理へ流用しない。
- GLTFLoaderの取得Promiseを共有し、インスタンスのMaterialのみ複製。共有Geometryを誤破棄しない。新ヒトデの取得失敗時は旧 `assets/characters/starfish.glb` に切り替え、それも失敗した場合は既存の魚代替を使用。
- 対戦に登場するCPU／他プレイヤーの希少モデルは、見る側の所持有無にかかわらず表示用に取得可能。所持データを追加する処理はない。CPUの抽選ルールやAIは変更しない。

### 試合時間

ソロ、クイック、友達ルームは共有 `BATTLE.duration=60`。HUD・説明・残り10秒警告を更新。終了境界で得点・攻撃・ダメージを処理せず、結果を一度確定。その後の入力も拒否する。オンラインは従来どおりサーバーの状態・時刻で確定する。

開始前3秒（クイックは既存5秒）の演出、クイックの最大60秒待機、再戦、CPU設定、コック人数、ライフは維持。チュートリアルは専用の無制限進行を維持。プレイヤーが選べる試合時間設定は元々ない。

### コイン

共通式は `floor((累計獲得BP / 10) × 開始ランク倍率)`。最終BPではなく既存の `record.earnedBP` を利用し、減点・BP奪取で最終BPが減っても既に獲得したBPを減らさない。各得点イベントの既存記録を利用し、獲得BPを別ループで二重加算しない。

倍率はブロンズ1、シルバー1.2、ゴールド1.5、プラチナ1.8、ダイヤ2.2、マスター3。BP500なら順に50、60、75、90、110、150コイン。最後だけ切り捨て。設定によるRP補正をコインに重ねない。

旧完走20・勝利10コインとランク別固定完走報酬は廃止。実績解除の既存コインは別枠として維持。結果画面の獲得コインは試合のBP報酬を表示し、実績コインを二重加算しない。

ソロはRankStoreの既存結果保存・配布再試行を利用。オンラインはSessionが実際の獲得記録から報酬を確定し、認証済み接続へ結果レポートと内訳を送信。クライアントの予測結果からは試合コインを付けない。結果IDによる既存のclaim台帳で重複付与を防ぎ、同じサーバーレポートの再受信でも再加算しない。オンラインではRPは変更しない。チュートリアルと開発者TEST試合は通常の報酬対象外。

**既存構成の限界**：RPとコイン残高は端末内保存で、認証済みアカウント台帳ではない。オンラインの倍率用ランクはロビーで端末のランクを申告し、サーバーが有効な6種に制限したうえで開始時に固定する。獲得BP・試合終了・報酬計算はサーバー確定だが、オフラインRPそのものの改ざん耐性や端末間残高同期は実装していない。秘密情報をフロントへ追加していない。

### ランク

境界RPは0 / 40 / 160 / 360 / 680 / 1160。基本順位RPは+40 / +20 / 0 / -5。通常設定で1勝→シルバー、さらに3勝→ゴールド、さらに5勝→プラチナ。既存の簡単設定のRP補正、少人数の順位正規化、有効活動判定、途中退出-20を維持。設定補正により簡単設定での必要勝数は増える。

ブロンズ・シルバーは降格せず、シルバーは40RPを下限とする。ゴールド以上は降格可能。昇格後の次の3試合は昇格先の境界RPで減少を止める。未反映のマイナスRPを貯めないため、保護終了後に借金分が一括で引かれることはない。最高ランクを維持。

ホームにRP・次までのRP・コイン倍率、結果に最終順位／最終BP・累計獲得BP・基本コイン・開始倍率・コイン・RP差分・現在ランク・次までのRPを表示。昇格時はエンブレム・光・既存効果音・新倍率を表示し、演出のスキップボタンを用意。既存の低画質と動き抑制設定を維持。

## セーブ移行

同じ `bbb.soloRank.v1` 保存キーを使い、内容のversionを3へ更新する。旧version1/2は、旧境界0/100/250/450/700/1000をもとに現在のランク帯を求め、その帯の進捗比率を新境界へ写す。マスターは超過RPを維持。例：旧270RPはゴールドのまま新180RP、旧1000RPはマスターの新1160RP。最高ランク、戦績、過去の報酬・付与ID、所持、装備、コイン、実績、称号、操作設定は消さない。version3以降へ再移行しない。

## 検証結果

- 全フロントテスト383件、サーバー単体テスト55件に成功（最終再実行結果は完了報告参照）。
- 新テスト：実ヒトデGLB解析、Pages用URL、未所持のまま、表示補正・共有Geometry・個別Material・解放、6種倍率の計算と端数処理、指定勝数の昇格、段階移行の維持と一度だけの移行、60秒の終了と終了後の攻撃・得点禁止、最終BPが減った場合、再受信・再読込の重複防止。
- サーバー新テスト：友達／クイックの双方で開始ランクを固定、不正BP入力を拒否、開始後の倍率変更を拒否、サーバー得点イベントによる500BPから75コインを確定、60秒の共通結果と二重確定なし。
- ViteビルドとPages配布検査を実行。squid/starfishとも原本と同じバイナリで、外部テクスチャ参照のないGLBを配布する。
- 実Colyseusの複数クライアント統合テストは試みたが、サーバー起動ログの後にローカルHTTPのヘルスチェックへ到達できず `server starts` 検査で停止した。以後の統合テストは未実行。通信確認済みとは扱わない。
- PC／スマホ実画面、モデルの質感・昇格演出の実表示、複数PCのオンライン、公開Pages／Renderは未確認。

### 残る確認事項

既存の200コンボ実績条件は変更していない。従来の90秒用到達手順は60秒以内に収まらないため、その長時間の機構テストは無制限のテスト専用ステージへ分離した。実績の60秒での到達性再調整は未実施。ゲーム性能を勝手に変えて対応していない。

## 公開時に必要な作業

クライアントとサーバーを同時期に更新する必要がある。`GAME_PROTOCOL=kitchen-60-bp-rewards-v2` に更新し、旧90秒サーバーとの混在を接続前に拒否する。GitHubへのpush、Pages公開、Render再デプロイは今回実行していない。実行前にユーザー確認が必要。Renderのサービス作成・プラン・環境変数・CORS設定を変更する必要はない（既存設定を維持）。

## 変更ファイル

- `README.md`
- `battle-rules.js`
- `battle-simulation.js`
- `battle-view.js`
- `character-registry.js`
- `collection-model.js`
- `gacha-store.js`
- `game-protocol.js`
- `game.js`
- `home-ui.js`
- `home.css`
- `index.html`
- `item-preview.js`
- `match-records.js`
- `online-client.js`
- `progression.js`
- `ranked-ui.js`
- `ranked.js`
- `seafood-menu.js`
- `server/src/admin.js`
- `server/src/room.js`
- `server/src/session.js`
- `server/tests/friend-rooms.test.js`
- `server/tests/rank-admin.test.js`
- `server/tests/rematch-server.fixture.mjs`
- `server/tests/session.test.js`
- `tests/battle.test.js`
- `tests/chef-tactics.test.js`
- `tests/collection.test.js`
- `tests/cosmetics-balance.test.js`
- `tests/kitchen-balance.test.js`
- `tests/latest-bbb.test.js`
- `tests/solo-ranked.test.js`
- `tests/unified-home.test.js`
- `tools/check-pages.mjs`
- `coin-rewards.js`
- `starfish-model.js`
- `public/assets/models/starfish.glb`
- `tests/sixty-rewards.test.js`
- `tests/starfish-glb.test.js`
- `server/tests/sixty-rewards.test.js`
- `docs/MODELS_60S_REWARDS_RANK.md`
