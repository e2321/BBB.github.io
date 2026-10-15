# 全画面点滅の調査と修正

## コードから特定できた空白フレームの経路

従来のgame.jsは、renderer.render(scene,camera)を実行した後に、1.5秒ごとのFPS判定からresize()を呼んでいた。resize()はrenderer.setPixelRatio()とrenderer.setSize()を呼ぶ。使用中のThree.jsではsetPixelRatio()も内部でsetSize()を呼び、どちらもcanvas.width/heightを再設定する。描画バッファのサイズ再設定で描画済みの内容が消えるため、次の描画まで空白になり得る。全モードに共通する経路だった。

これはコードと描画バッファの契約を再現したテストで確認した事実。報告された点滅の唯一の原因であること、実ブラウザーで点滅が止まったことまでは確認できていない。

## 修正

- render-runtime.jsのDrawingBufferSizeでサイズ変更を予約し、次のフレームの描画前にまとめて適用。変更後に必ず同じフレーム内で描画する。描画後のFPS判定は予約だけを行い、canvasに触れない。
- 同じサイズ・実ピクセル数ならサイズ属性を書き直さない。setDrawingBufferSize()を一度使い、二重のサイズ設定をなくした。CSSによる画面表示寸法は維持。
- 元のコードではアプリのRAFチェーンは1つで、多重起動する箇所は見つからなかった。SingleFrameLoopに集約して、重複startでもフレーム予約が増えないようにした。
- WebGLコンテキスト喪失時にはループを停止し、復旧後に1回だけ再開する。rendererやゲームcanvasの作り直しは行わない。
- キャラクター画像は本体rendererから分離。DOMに追加しない192×192の専用canvasと専用rendererを1つだけ生成・再利用。独立したRAFループは設けず、必要時だけ画像を生成する。魚/イカ×画質3段階の結果はキャッシュする。
- 同値のbody.dataset.stateの再設定をやめ、F2表示の更新を250ms間隔にした。ゲーム状態やUI表示条件は維持。

変更ファイル：game.js、render-runtime.js、seafood-menu.js、battle-view.js、tests/render-runtime.test.js、tests/seafood-menu.test.js、tests/render-stability.browser.js。

魚とイカの選択、モデル画質、CPUの動作・ルール、チュートリアルの構成、オンライン通信・再戦処理は変更していない。プレビューも最終状態では有効。

## 比較結果と確認範囲

- コード調査：本体RAFチェーンは修正前1つ。修正後の制御テストでも、開始操作100回と停止・復旧後に予約数の最大は1。
- 描画バッファの代替テスト：旧順序では描画直後のリサイズで内容が消え、新順序ではFPS更新後も描画内容が保持される。
- 同じサイズの要求120回：初期設定後の余分なサイズ書き込み0回。
- プレビュー制御テスト：画質を標準→軽量→高画質→標準→軽量と変えてもrenderer生成1回、画像の新規描画3回。停止・再開後はキャッシュを使用。プレビュー用RAFは0。
- DOMのゲームcanvasはコード上1つのまま。ブラウザー実測のcanvas数、コンテキスト喪失回数、WebGLエラー数の修正前後比較は未確認。
- 自動テスト145件＋サーバーテスト20件成功。既存のゲーム・ロビー・再戦テストも成功。
- Vite本番ビルドとPages出力チェック成功。既存の環境のrealpath権限問題を避けるため、ビルド時だけresolve.preserveSymlinks=trueを指定。リポジトリのVite/Pages/Render設定は変更していない。既存のチャンクサイズ警告あり。
- Edgeは起動直後に終了し、ブラウザーテスト本体まで進めなかった。ホーム、魚/イカのソロ、チュートリアル、オンライン、再戦中の目視確認、FPS計測、WebGLコンソール確認は未確認。

## ブラウザーでの確認方法

開発サーバー起動後、`npm run test:browser -- render-stability.browser.js`で、プレビューの一時停止→標準画質→復元、魚/イカ、画質切替、複数回の画面遷移、ループ数・canvas数・WebGLエラーを確認できる。オンラインの複数人接続・再戦の目視は別途必要。

開発画面のwindow.__game.renderDiagnostics()は、稼働ループ数、保留フレーム数、描画数、サイズ更新数、DOM canvas数、WebGL中断・復旧数、プレビューrenderer生成数を返す。window.__game.setPreviewsEnabled(false/true)で切り分けでき、選択と画質機能は維持する。公開ビルドでもF2表示で本体ループ・ゲームcanvas・サイズ更新・WebGL中断/復旧を確認できる。

Push・デプロイは実施していない。今回の描画変更はフロント側のみで、サーバーの変更はない。
