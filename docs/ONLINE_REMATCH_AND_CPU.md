# ロビー維持・再戦とCPU補充設定

## 原因調査
旧サーバーには90秒終了によるルーム破棄はなかったが、Session.phaseがMATCHに残り、再戦できなかった。タイトルへ戻るクライアント操作は退出になっていた。

## 実装
LOBBY / MATCH / RESULT / REMATCHをサーバーで管理。結果で接続とコードを保持し、人間全員の再戦希望が揃うと同じ部屋で3秒カウントダウンを開始する。人数が変わった場合は準備を解除し、ホスト退出では生存するメンバーへ権限を引き継ぐ。全員の正式な退出時に通常の破棄処理を行い、短い切断には既存20秒の再接続猶予を維持する。

ラウンド番号を入力へ付け、前の試合の入力・描画履歴を次へ持ち越さない。共通のstart/resetを利用してBP・順位・HP・水分・コンボ・キル数・位置・アイテムとCPU/NPC・試合タイマーを初期化する。名前・色・接続・入力シーケンスは維持する。

ロビーのCPU補充は初期ON。ホストだけ変更可能。ONでは空き枠をCPU、OFFでは募集中として表示する。1〜4人で開始可能。OFFの空き枠はinactive/spectatorとしてAI、物理、当たり判定、アイテム取得、ランキング、魚の描画・アニメーションから除外する。内部の4枠は既存IDと通信形式の互換性のため保持する。ノーマルのみオンライン対応。オフラインとチュートリアルのルールは変更しない。

## 主な変更ファイル
- server/src/session.js, server/src/room.js:状態、投票、補充設定、終了通知、接続維持
- online-client.js, online-view.js:ロビーと結果UI、ラウンド切り替えと履歴初期化
- index.html, game.js:再戦ボタン、設定、同じ描画インスタンスでのロビー復帰
- battle-rules.js, battle-simulation.js, battle-view.js:空き枠の除外（既存モードには影響しない）
- server/package.json、server/tests/rematch*.mjs、server/tests/rematch.test.js、server/tests/session.test.js:実接続と自動テスト
- tests/online-rematch.browser.js、tests/online-rematch-live.browser.js:UIと独立ブラウザー検証

## 確認
単体テストと既存のオフライン・チュートリアル回帰テストを実行。2・4 Colyseusクライアントで3連戦、CPU ON/OFF、名前・カラー、結果一致、ホスト退出、ロビー再接続を確認。2つの独立ブラウザーコンテキストで再戦と設定切替・ホスト退出後の継続を確認。ブラウザー/接続テストはテスト専用IPCで試合終了のサーバー時刻を早送りし、ルールテストでは5580ステップの3秒＋90秒を検証する。テスト用IPCは公開サーバーから利用できない。

本番WSS、別PC間、4ブラウザー同時接続は未確認。GitHub Pages・Render双方の更新が必要。Pushと外部デプロイは未実施。
