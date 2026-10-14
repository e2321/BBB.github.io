# 捌かれるな！！

ブラウザーで遊べるThree.js製のWebゲームです。**プロローグ（脱出モード）**と**BBB（ビタンビタンバトル）**を同じアプリに収録しています。

**提出・公開手順は [PUBLISHING.md](PUBLISHING.md)。** 既存の公開URLは https://e2321.github.io/BBB.github.io/ です。今回の追加変更のpush・デプロイは行っていません。GitHub Actionsによる公開は、所有者が手動で開始する構成です。

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
| プロローグ（脱出） | 第1区間は左→右→左のジグザグ。A/Dで移動と2段ジャンプ。停止して死んだふりし、料理人を奇襲して厨房から脱出。チェックポイント・既存アニメーション・6段階のクリア称号を維持。 |
| BBB | ノーマル／厨房を開始前に選択。あなた＋BOT3匹の90秒戦。A/D交互入力で前進、Spaceでその場ジャンプ、左クリックで包丁、マウスで照準、VでFPS/TPS、Escで一時停止。 |

BBBは着地時に基本10 BP、1.5秒以内の連続着地でコンボが続き、5/10/20/30コンボで×1.5/2.0/2.5/3.0。A/Dの水分消費は次の着地コンボ1〜2：2%、3〜4：3%、5〜6：4%、7〜9：5%、10以上：6%。Spaceはコンボと無関係に3%。3か所の水たまりでは毎秒5%回復し、BPは獲得しません。HP5、死亡後5秒で何度でも復活。刺身は5秒間存在し、負傷した魚が食べるとHP＋2。BP最多で勝利し、同点1位は同時優勝です。厨房では既存モデルを再利用したコック2体が巡回し、停止して死んだふり→接近・確認→「今だ！」→A/DまたはSpaceで解除＆ビタンで500 BP（コンボ倍率なし、コック別20秒制限）。ノーマルにはコックや死んだふりボーナスはありません。コンロはCOMING SOONです。オンライン通信はありません。

両BBBステージにジャンプブーストを3個ずつ配置。ジャンプ高度1.5倍・8秒間、横移動速度は増やさず、15秒後に再出現します。水分0%の移動能力は25%。BOTは加速80%、通常BP約80〜85%、攻撃頻度75%に調整しています。

脱出の通常水分消費は毎秒1.95ポイント。特殊イベント・回復・スコア計算は既存のものを使います。

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
