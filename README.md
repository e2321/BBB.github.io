# 捌かれるな！！

ブラウザーで遊べるThree.js製のWebゲームです。**プロローグ（短いチュートリアル）**と**BBB（ビタンビタンバトル）**を同じアプリに収録しています。BBBはノーマルと厨房の2ステージです。

オンライン友達対戦を外部公開するための設定は `render.yaml`、公開者向けの具体的な手順は [server/DEPLOYMENT.md](server/DEPLOYMENT.md) にあります。友達側は公開ゲームURLとルームコードだけで参加する構成です。外部サーバーの公開・別PCからの動作確認は未完了です。

**提出・公開手順は [PUBLISHING.md](PUBLISHING.md)。** 既存の公開URLは https://e2321.github.io/BBB.github.io/ です。今回の追加変更のpush・デプロイは行っていません。GitHub Actionsはmainへのpushで自動公開し、手動実行も可能です。

## 開発と提出用ビルド

Node.js 22.12以上を使用してください。Windows PowerShellでは`npm.cmd`を使用します。

```powershell
npm.cmd ci
npm.cmd run dev
```

表示されたローカルURL（通常`http://127.0.0.1:5173/`）で開発できます。

```powershell
npm.cmd run prepare:submission
npm.cmd run preview
```

`dist/`に公開用ファイル一式を生成し、相対URL・モデル・依存ライブラリを検査します。プレビューURLは通常`http://127.0.0.1:4173/`です。HTMLのダブルクリック（`file://`）ではなく、HTTP/HTTPSで開きます。閲覧者にはNode.jsやBlenderのインストールは不要です。

## 収録モード

| モード | 内容・操作 |
| --- | --- |
| プロローグ（チュートリアル） | A/Dで4回ビタン→Spaceジャンプと大きな的への包丁命中→死んだふりと短いジグザグ逃走。いつでもスキップでき、クリア後はBBBへ進めます。初見1〜2分を目標にしています。 |
| BBB | ノーマル／厨房を開始前に選択。あなた＋BOT3匹の90秒戦。A/D交互入力で前進、Spaceでその場ジャンプ、左クリックで包丁、マウスで照準、VでFPS/TPS、Escで一時停止。 |

BBBは3秒のカウントダウン後、90秒のBP対戦を開始します。カウント中はA/Dでその場ビタンの演出のみ可能です。着地時に基本10 BP、1.5秒以内の連続着地でコンボが続き、5/10/20/30コンボで×1.5/2.0/2.5/3.0。A/Dの水分消費は一律1%、Spaceは2%。3か所の水たまりでは毎秒10%回復し、BPは獲得しません。HP4、死亡後4秒で何度でも復活。刺身は5秒間存在し、負傷した魚が食べるとHP＋2。BP最多で勝利し、同点1位は同時優勝です。

厨房のコック2体は巡回・追跡・予備動作付きの近距離攻撃を行います。停止して死んだふり→接近・確認→「今だ！」の0.8秒間→A/Dで解除して0.4秒以内のビタンに成功すると500 BP（倍率なし、コック別20秒制限）。確認された後のA/Dによる試みでタイミング・距離を外すと−1000 BP、下限0。Spaceは減点されない逃走ジャンプです。単なる解除・未確認の通常ビタンでは減点しません。ノーマルにはコックや死んだふりはありません。コンロの選択肢・未使用定義は削除しました。オンライン友達対戦のサーバー・UIを追加し、ローカルの実Colyseus通信を検証しました。公開WSS・別PC間の動作は未確認です。起動・公開手順は [ONLINE_FRIENDS.md](ONLINE_FRIENDS.md)。

両BBBステージにジャンプブーストを3個ずつ配置。ジャンプ高度1.5倍・8秒間、横移動速度は増やさず、15秒後に再出現します。水分30%の移動能力は90%、0%は60%。CPUは旧設定から加速・通常BPを90%、包丁頻度を85%へ控えめに調整しています。首位プレイヤーへの攻撃傾向と厨房でのコック対処は維持しています。オンラインでは水しぶき・着地の波紋パーティクルを生成せず、回復ハート演出は維持します。

短いチュートリアルは共通処理を再利用し、今回のBBB専用調整とは分けて従来の水分・HP・高度を維持します。説明を読む待ち時間を模した自動テストでは約46秒、即操作する自動プレイでは約24秒でクリアしました。初見の人による実測は未確認です。旧脱出のステージ・操作・スコア・称号処理は再利用用に残し、回帰テストで維持を確認しています。詳細は [チュートリアル変更記録](docs/SHORT_TUTORIAL_UPDATE.md) を参照してください。

## 検証

```powershell
npm.cmd test
npm.cmd run prepare:submission
npm.cmd run test:pages
```

`test:pages`は生成済み`dist/`を専用の静的HTTPサーバーで配信し、ルートURLとGitHub Pages相当のサブフォルダーURLで、プロローグ・BBBノーマル・BBB厨房の6通りのモデル読み込み・開始・操作・WebGL・通信エラーを確認します。WindowsではMicrosoft Edgeを使います。ほかのOSではPlaywright Chromiumが必要です（`npx playwright install chromium`）。公開のためにブラウザーテストをGitHub Actionsで動かす必要はありません。

詳細な開発用検証は、開発サーバー起動中に`npm.cmd run test:browser`で実行できます。

## 構成

- `index.html`、`game.js`、`style.css`：同じゲームの入口・共通画面。
- `simulation.js`、`stage.js`、`records.js`：脱出のルール・ステージ・記録・称号。
- `battle-*.js`：BBBのルール・入力・BOT・描画。
- `public/assets/models/`：既存の魚・料理人GLB。ビルド時にそのままコピー。
- `assets/`：元画像・Blender制作データ。開発用資産を保持。
- `tools/`、`tests/`、`backups/`：制作・検証・保全。削除していません。
- `.github/workflows/pages.yml`：同じソースからビルドし、`dist/`だけをPagesへ公開。
- `dist/`：再生成できる公開成果物。開発用ソースとは別ゲームではありません。

依存パッケージはロックファイルで固定し、Three.js・addonsを公開用JSへまとめます。CDNやPC内の絶対パスへのアクセスは不要です。録音音源への差し替え方法は`wet-audio.js`の`replaceSample`を参照してください。

素材・ライセンスは [ASSETS.md](ASSETS.md)、以前の詳しい実装記録は [docs/DEVELOPMENT_HISTORY.md](docs/DEVELOPMENT_HISTORY.md) を参照してください。

最新の水分・50コンボ・疑問度調整は [BBB_LATEST_UPDATE.md](BBB_LATEST_UPDATE.md) を参照してください。

BBBの床・頭上順位・水しぶき・BP奪取5%・ハート回復アイテムの変更は [docs/BBB_VISUAL_HEARTS.md](docs/BBB_VISUAL_HEARTS.md) に記載しています。
