# ユーザー作成サムネイル
PNG画像を キャラクター・武器は `<カテゴリ>-<ID>.png`、エフェクトは `<ID>.png` としてこのフォルダに置いてください。画像なしでも代替アイコンで動作します。画像生成は行いません。
例: character-starfish.png / character-octopus.png / weapon-fork.png / weapon-ladle.png / weapon-spatula.png / splash-rainbow.png / trail-prism.png。
初期装備も同じ規則です。全IDは effect-registry.js / character-registry.js / weapon-registry.js を参照してください。

## ガチャ種類バナー
現在配置済み：海のなかまたち ocean.png／深海 deepsea.png／甲殻類 crustacean.jpg／おもしろ海洋生物 funny.jpg。
開発用フォルダの画像を内容を変えず取り込み、実ファイル形式と拡張子を一致させました。
元ファイルは ocean.webp と deepsea.webp（中身PNG）、crustocean.webp.jpg、funny.webp.jpg です。元ファイルは保持しています。
読み込み先は gacha-config.js の banner で変更できます。WebPへ差し替える場合は画像自体をWebP形式で保存して設定も更新してください。
未配置・読み込み失敗時はガチャ名入りの背景バナーを表示し、失敗URLはコンソールへ出力します。
GitHub Pagesでは BASE_URL を通してサブパス付きで解決。画像を差し替えてビルド・公開したらページを再読み込みしてください。
