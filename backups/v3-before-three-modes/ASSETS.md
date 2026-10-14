# オリジナルアセットの制作記録（第3回改良）

Sketchfab、Fabなどの完成済みモデルは使用していません。魚と料理人はBlender Python、厨房・設備・炎はThree.jsの手続き的メッシュで制作しました。実行時にCDN、素材サイト、外部HDRIへ接続しません。

| 内容 | 場所 | 制作方法 |
| --- | --- | --- |
| 45.5cmの魚GLB | `public/assets/models/madai.glb` | `tools/build_fish.py`、Blender 5.2.2 LTS |
| 魚の編集用ソース | `assets/fish-source/madai.blend` | 独自の断面補間メッシュ、UV、7ボーン、7クリップ |
| 魚のPBRテクスチャ | `assets/fish-source/madai_*_4k.png` | NumPyで体色・鱗・側線・法線・粗さを生成、4096×2048 |
| 関節付き料理人GLB | `public/assets/models/chef.glb` | `tools/build_chef.py`、17ボーン、8クリップ |
| 料理人の編集用ソース | `assets/chef-source/chef.blend` | 独自の顔・衣服・指・帽子・靴・包丁のメッシュ |
| 布地法線 | `assets/chef-source/fabric_normal.png` | NumPyで織物の細かな凹凸を生成、1024×1024 |
| 制作確認画像・情報 | 両sourceフォルダの `preview.png`, `metadata.json` | Blender Cyclesと実生成メタデータ |
| 厨房、食器、炎、設備 | `kitchen.js`, `visuals.js` | メッシュ・Lathe・Tube・Canvasテクスチャをコード生成 |
| 焼き魚写真 | `assets/images/grilled_fish.png.jpg` | ユーザー提供JPEG。内容・拡張子を変更せず使用 |
| 刺身画像 | `assets/images/sashimi.png` | 前回image_genで本プロジェクト用に制作した画像を再利用 |
| 刺身の生成指示 | `assets/sashimi-prompt.md` | 前回制作のプロンプト記録 |
| 効果音 | `game.js` | Web Audio合成 |

魚は65,299頂点・128,138三角形、GLB44,380,732bytes。料理人は36,547頂点・72,276三角形、GLB2,713,356bytes。ポリゴン・PBR解像度は描画設定にかかわらず維持します。

料理画像は `image-assets.js` のビルド時ファイル検出と実行時読み込み確認を経て表示します。任意の刺身画像がなくてもゲームは起動できます。実際の焼き魚ファイルはPNGではなくJPEGです。

Three.jsはMIT、ViteはMIT、PlaywrightはApache-2.0です。インストール済み各パッケージにライセンスを同梱。`public/THIRD_PARTY_NOTICES.txt` は配布先にもコピーします。Blender本体はゲームに同梱しません。外部フォントは使用せず、OSのフォントを使用します。
