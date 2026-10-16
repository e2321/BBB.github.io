# Renderの接続要求による復帰とレインボー消費調整

## 接続の流れ

対象は既存の `bbb-friends-server`。本番の接続先は `wss://bbb-friends-server.onrender.com`。

1. クイックマッチ・友達ルーム作成・2桁コード参加の前に、`https://bbb-friends-server.onrender.com/health` へGETする。
2. 「オンラインサーバーを起動しています…」「初回接続には少し時間がかかる場合があります」とローディング表示を出す。
3. HTTP正常応答と `{ok:true}` を確認してからSDK読み込み・既存のColyseus接続へ進む。起動済みなら固定の待機時間は入れない。
4. 起動確認のみ最大3回、1回30秒、再試行間隔2秒。最長約94秒で終了する。HTTP 403等の設定エラーでは無駄な再試行をしない。
5. 失敗時の「再試行」は直前の操作を実行し直す。クイックマッチから友達ルームへ切り替わることはない。
6. キャンセル時は起動確認・待機を中止し、古い応答を無効化する。遅れてルーム接続が成立した場合も退出させる。

起動確認のHTTPリクエストはキャッシュしない。同一クライアント内の同時操作は起動確認を共有する。ルーム作成・予約POSTは自動再送しない。複数人の定員・ルーム選択は従来のサーバー側管理を維持する。

ローディングはHTML/CSSのみ。ゲーム描画ループは追加しない。「動きを減らす」設定では回転を止めても説明文とキャンセルを表示する。PC・スマホで同じ接続処理を利用する。

## Render側の確認事項

リポジトリ設定 `render.yaml` はWebサービス・Node・`plan: free`・`healthCheckPath: /health`。
`server/src/index.js` にはHTTP 200で `{ok:true,version:1}` を返す `/health` が既に存在する。GitHub PagesのOrigin `https://e2321.github.io` はHTTPとWebSocketの両方で許可される。ワイルドカード許可は追加していない。

[Render公式仕様](https://render.com/docs/free)では、無料Webサービスは15分の無通信後に休止し、次のHTTPアクセスまたはWebSocket接続で自動復帰する（通常約1分）。したがって、この既存Webサービス構成は接続要求による復帰に対応する。サービスの新規作成・Render API・APIキー・定期pingは必要ない。

実際のDashboardの稼働状態・契約プラン・デプロイ成功状態は、この環境では確認できていない。手動停止、利用枠超過、デプロイ失敗等の場合、クライアントからのリクエストだけで解決できない場合がある。エラー表示後、公開者がRender Dashboardの状態とログを確認する。休止復帰を使う目的だけならプラン変更は不要。常時稼働が必要な場合はWebサービスの有料インスタンスを検討する。

## 公開設定と反映

- GitHubリポジトリのActions変数 `VITE_ONLINE_SERVER_URL`：`wss://bbb-friends-server.onrender.com`
- Renderの `ALLOWED_ORIGINS`：`https://e2321.github.io`
- Renderの既存起動コマンド：`npm --prefix server start`
- ローカル開発の `npm run dev:all` と本番WSSの分離は維持する。

接続処理の改良はPagesの再公開で反映される。今回同時に変更した水分消費はサーバーが読み込む共通ルールでもあるため、**Renderも同じコミットへ再デプロイする必要がある**。`render.yaml` の既存 `autoDeployTrigger: off` は変更していない。Render Dashboardで対象のデプロイが完了したことを確認し、クライアントとサーバーのルールのずれを避ける。

今回Push・公開・プラン変更は実施していない。

## レインボー中の水分消費

`battle-rules.js` の `RAINBOW_WATER_COST_MULTIPLIER` を **0.5 → 0.6** に変更した。通常のビタン消費は1ポイントのままなので、レインボー時は1回 **0.5 → 0.6ポイント（20%増）**。通常時より40%少ない消費になる。

通常・厨房・オンラインの魚・イカ・CPUに同じ共通ルールを適用する。奇襲でレインボーになった場合も同じ。コンボ終了時は通常消費へ戻る。BP50、速度倍率、水たまり回復、チュートリアルのルールには変更を加えていない。

## 変更ファイル

- `online-client.js`：起動待ち文言、元の操作を保つ再試行、失敗案内、キャッシュしないHTTP確認。
- `index.html`、`home.css`：ローディング表示と説明。
- `battle-rules.js`：レインボー消費倍率0.6。
- `tests/quick-client.test.js`、`tests/online-wakeup.test.js`：待機後の自動進行、操作別再試行、キャンセル、起動済み時の即時進行の回帰テスト。
- `tests/bbb-revision.test.js`、`tests/integrated-balance.test.js`、`tests/surprise-rainbow.test.js`、`tests/speed-cooldown.test.js`：新しい消費量とソロ・オンライン・CPUの整合性。
- 本書、`docs/SERVER_START_AND_BP_NOTICES.md`：公開時の注意点を更新。

## 未確認

公開 `/health` はこの環境の取得ツールからアクセスできず、本番の復帰・実際のマッチングは未確認。Renderを意図的に停止する操作もしていない。PC/スマホ実機・複数ブラウザでの表示と同時接続も未確認。


## 自動検証結果

- フロント：278件すべて成功。
- サーバー：29件すべて成功。
- Vite本番ビルド・Pages相対パス検査：成功。既存の大きなチャンクに関する警告あり。
- 起動済みサーバーなら再試行待機なし、起動確認後のみ接続へ進行、キャンセル、3種の操作別再試行、同時クリックでの起動確認共有を自動テストで確認した。
- 新しいレインボー消費量0.6と、コンボ終了後の1.0への復帰、CPU・キャラクター・ステージ・サーバー共通適用を確認した。
- ブラウザ実機・本番通信は前記のとおり未確認。
