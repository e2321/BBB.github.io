# クイックマッチとナイフ自動射出

オンラインメニューの「クイックマッチ」を押すと参加を開始する。PC/スマホは同じ入口を使い、ルームコードは不要。待機人数と開始までの秒数を表示し、キャンセルで退出できる。結果では「もう一度クイックマッチ」で前の接続を閉じて新規検索、「ホームに戻る」で退出する。

## サーバーの仕組み

- POST /quick-match が既存のColyseusルームへ座席を予約し、SDKのconsumeSeatReservationで接続する。新しい通信ライブラリは導入していない。
- quickフラグ付き・待機中・未ロック・4枠未満だけを候補にする。既存の人間参加者が多い部屋を優先。友達ルームは対象外。通常のコード検索からquickルームにも入れない。
- 同じNodeプロセス内で「検索→必要なら作成→席予約」を直列化。予約済みの席も定員に含める。接続が完了していない予約を人間の参加人数として数えない。
- 接続済みの人間が2人以上になってから5秒待ち、既存の3秒カウントダウンに移行。その後90秒の試合を開始。人間不足や切断で待機時間をリセットする。
- クイックはCPU補充ON、最大ライフ3で固定。人間2/3/4人にCPU2/1/0匹を生成する。CPUで開始人数条件を満たすことはない。
- 開始後はルームをロックし、再マッチング対象から外す。既存の安全な再接続処理は利用できる。友達ルームの再戦は変更していない。
- 接続要求の連打制限・部屋数上限・45秒のHTTP応答待ち・25秒のSDK待ちを設ける。失敗時に自動で部屋を作り続けない。キャンセル後に完了した古い接続は退出し、新しい部屋へ上書きしない。
- 現在のRender単一Nodeプロセス構成向け。複数インスタンスへ拡張する場合は共有キュー/分散ロックとColyseusの共有Presence/Driverが必要。

## ナイフ間隔

自動射出：0.42秒 → 1.00秒。手動：0.42秒を維持。CPUの基準：0.60秒と既存AI頻度を維持。共通定数AUTO_KNIFE_INTERVALをbattle-rules.jsで管理する。ON/OFFを切り替えても、確定済みの待ち時間は短縮されない。射程・弾速・ダメージは変更していない。

## 変更ファイル

- クイック接続/UI：online-client.js、index.html
- マッチング/自動開始：server/src/quick-match.js（新規）、server/src/index.js、server/src/room.js、server/src/session.js
- 射出：battle-rules.js、battle-simulation.js、battle-view.js、online-view.js、mobile-controls.js、game.js
- テスト：tests/auto-fire.test.js、tests/quick-client.test.js、server/tests/quick-match.test.js、server/tests/quick-match.integration.mjs（新規）
- 記録：docs/QUICK_MATCH.md、docs/MOBILE_SUPPORT.md

## 動作確認

フロント自動テスト248件、サーバー25件が成功。競合時の定員予約、プライベート/対戦中の除外、2/3/4人開始、1人時の開始防止、退出/切断時の開始取消、結果からの再検索、古い接続のキャンセル処理、1秒の射出制限とモード切替による回避防止を検証。Vite本番ビルドとPages参照検査を実施。

実HTTP/Colyseus SDKの統合試験は、この実行環境が127.0.0.1への接続をEACCESで拒否したため、実通信の検証に到達しなかった。実ブラウザ、PCとスマホの混在接続、別PCの対戦、Render本番通信は未確認。実通信が完成確認済みとは扱わない。

通常のWindows端末での実通信試験（2586番ポートを使用し、自分で開始したサーバーだけを終了する）：

```powershell
cd C:\Users\shota\game-project\BBB
node server/tests/quick-match.integration.mjs
```

## 公開

Push・公開・外部デプロイは未実施。環境変数、WSS接続先、CORSの許可Origin、Vite、GitHub Actionsは維持。新しい環境変数は不要。

本番はRenderサーバーを先に更新して新API/入力を受け付けられるようにし、その後GitHub Pagesを更新する。両方の反映後に、2台でクイック待機・キャンセル・対戦・再検索と、既存の友達ルームの再戦を確認する。
