# GitHub Pagesで公開・提出する手順

このプロジェクトのソースをそのままGitHubへ置き、Viteで生成した`dist/`をGitHub Pagesへ公開します。プロローグとBBBは同じ`index.html`から開始します。Windows実行ファイルは作成しません。

実施済みのローカル確認結果は [docs/SUBMISSION_CHECK.md](docs/SUBMISSION_CHECK.md) に記録しています。

## 1. 公開前にローカルで確認

Node.js 22.12以上を用意し、プロジェクトのフォルダーで実行します。

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run prepare:submission
npm.cmd run test:pages
npm.cmd run preview
```

すでに依存パッケージが導入済みなら、最初の`npm.cmd ci`は省略できます。`preview`の表示URLを開き、モデル読み込み後、BBBのSTART、プロローグを選択してSTART、操作・音を確認してください。`test:pages`はEdgeを使ってルートとサブフォルダーの4通りの起動を自動検証します。通常のプレビューはHTTPです。実際のGitHub上のHTTPS確認は公開後に行います。

`vite.config.js`の`base: './'`により、リポジトリ名を変更しても生成物のJS・CSS・モデル・画像を相対URLで読み込めます。公開ページは末尾`/`付きURL、または`index.html`で開きます。

## 2. GitHubへ同じ開発プロジェクトをアップロード

1. GitHub Desktopへサインインし、この既存フォルダーをローカルリポジトリとして追加・作成します。具体的な操作は下の説明を参照してください。
2. ソースをコミットし、「Publish repository」でGitHubへ公開します。無料アカウントでは「Keep this code private」のチェックを外してPublicにします。GitHubのWeb画面で先に同名の空リポジトリを作る必要はありません。既存のGitHubリポジトリを使う場合は、そのリモートへGitでPushしてください。
3. フォルダーを丸ごと扱い、`.github/workflows/pages.yml`などドットで始まるファイルも含めます。少なくとも、ルートのHTML・CSS・JS、`package.json`、`package-lock.json`、`vite.config.js`、`public/`、`assets/`、`tools/`、`tests/`、`backups/`、`.github/`を含めてください。CIの資産保護テストはバックアップ内の元GLBや制作データも検査します。`backups/`はローカルにも残っています。
4. `.gitignore`で`node_modules/`、`dist/`、テスト画像・ログを除外しています。これらをアップロードする必要はありません。ソース・制作資産は削除していません。

**魚のモデルは約44MBのため、GitHubのブラウザー画面によるファイルアップロードでは25MiBの上限を超えます。GitHub DesktopまたはGitを使ってください。** 現在のモデルは通常のGitの100MiB上限以内です。Git LFSへの変更は今回不要で、モデル生成のためにBlenderを実行する必要もありません。

既存フォルダーにGitリポジトリがない場合は、GitHub Desktopの「File → New repository」でNameには既存フォルダー名、Local pathにはその親フォルダーを指定し、生成先がこの既存フォルダーになることを確認して作成します（新しい空のゲームフォルダーを作らないでください）。その後、変更をコミットし、「Publish repository」で公開します。すでにリポジトリがある場合は「File → Add local repository」を使います。

## 3. Pagesを設定し、所有者が公開を実行

1. GitHubの対象リポジトリを開き、**Settings → Pages → Build and deployment → Source → GitHub Actions**を選択します。
2. **Actions → Publish game to GitHub Pages → Run workflow**を開き、最新のソースがあるブランチ（通常`main`）を選んで実行します。
3. `build`と`deploy`が緑色になったことを確認します。`build`は`npm ci`、ルール・資産のテスト、ビルド、静的成果物の検査を実行します。
4. Pages設定画面またはワークフローの`github-pages`環境に表示されたURLを開きます。
5. HTTPS設定を確認します。標準の`github.io` URLはHTTPSで配信されます。設定に`Enforce HTTPS`がある場合は有効にします。

通常の提出URL例：`https://ユーザー名.github.io/リポジトリ名/`。これは例です。実際に表示されたURLを提出してください。公開を手動実行する設定なので、ソースをPushしただけではこのワークフローは公開しません。今回、GitHubへのPushやPages設定変更は行っていません。

## 4. 公開後の提出確認

- HTTPSの公開URLを新しいブラウザーウィンドウで開く。
- `index.html`、JS・CSS・魚・料理人・画像が404にならず、STARTが有効になる。
- BBBでSpace・A/D・左クリック・V、プロローグでA/Dを操作し、両モードを開始できる。
- STARTを押した後に音が鳴る。ブラウザーやOS側のミュートも確認する。
- ページを再読み込みしても起動し、開発用サーバーを止めても公開URLで遊べる。
- このURLを提出する。閲覧者はNode.js・Blender・Windows実行ファイルを必要としない。

モデルを維持しているため、公開版は約59MB（約56MiB）あります。初回は読み込み完了まで待ちます。回線速度・GPU性能により読み込み時間やFPSは異なります。キーボードとマウスがあるPCブラウザーでの提出確認を推奨します。

## 5. 公開後も同じソースで更新

通常どおり`npm.cmd run dev`で開発し、テスト後にソースをコミット・Pushします。続けてActionsの同じワークフローを手動実行すると、同じ公開URLが更新されます。`dist/`を直接編集せず、ソースを直してビルドしてください。

自動公開を選びたい場合だけ、`.github/workflows/pages.yml`のコメントになっている`push`と`branches: [main]`を有効化します。使用ブランチが`main`以外ならその名前に変更してください。これ以降、そのブランチへのPushは公開を伴います。

## 公開されるファイル

```text
dist/
  index.html
  favicon.svg
  .nojekyll
  THIRD_PARTY_NOTICES.txt
  assets/
    index-<hash>.js
    index-<hash>.css
    画像ファイル...
    models/madai.glb
    models/chef.glb
    images/...
```

ワークフローはこの`dist/`一式だけをPagesへ配信します。GitHubには開発ソースを保持し、公開サイトにはNode.js・テスト・Blender制作ファイル・バックアップを置きません。`index.html`だけ、あるいはソースのルートを直接Pagesへ配信する設定にはしないでください。npm形式のThree.js参照をViteでバンドルする必要があるためです。

ほかの静的ホスティングへ提出する場合も、同じ`dist/`の中身をその公開ルートへ配置します。別ゲームを作る必要はありません。

## 確認範囲

ローカルでは静的成果物・ルートURL・Pages相当のサブフォルダーURL・両モードの起動・操作・WebGL・通信エラーを検証します。Three.jsとaddonsは同じ配信元のビルド済みJSへ含まれ、モデルのテクスチャはGLBに内包されます。実行用HTML/JS/CSSにローカルPCの絶対パスやlocalhostへのアクセスはありません。制作ツールのBlender検出パスとテストのローカルURLは開発用であり、公開成果物には入りません。

**GitHub上でのActions実行、実際の公開HTTPS URL、閲覧者の回線・GPU・音の聴感は未確認です。** 公開操作はリポジトリ所有者が行い、上の提出確認を実施してください。

公式資料：
- [Viteの静的公開とGitHub Pages](https://vite.dev/guide/static-deploy.html)
- [Viteの相対base](https://vite.dev/guide/build#relative-base)
- [GitHub Pagesの公開元設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub Pagesのカスタムワークフロー](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub PagesとHTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [GitHubのファイルサイズ制限](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)

- [GitHub Desktopで既存のプロジェクトを公開する](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop)
