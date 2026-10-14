# アセットと制作記録（拡張版）

有料モデル、未確認ライセンスのモデル、写真素材サイトの画像、外部HDRIは使用していません。ゲームの実行時にCDNやモデルサービスへ接続しません。

| 内容 | プロジェクト内の場所 | 制作元・扱い |
| --- | --- | --- |
| マダイ参考の35cm魚GLB | `public/assets/models/madai.glb` | `tools/build_fish.py` をBlender 5.2.2 LTSで実行して新規制作。外部モデルなし |
| Blenderネイティブ制作ファイル | `assets/fish-source/madai.blend` | メッシュ、UV、PBR、骨格、アニメーションを編集可能 |
| 4096×2048 PBRテクスチャ3枚 | `assets/fish-source/madai_*_4k.png` | Blender同梱NumPyで鱗・体色・側線・細かな凹凸を生成。GLBに埋め込み |
| 魚の制作プレビュー | `assets/fish-source/preview.png` | Blender Cyclesで制作したスタジオ確認画像 |
| 刺身画像 | `public/assets/images/sashimi.png` | 組み込み `image_gen` でこのゲームのために新規生成。写真素材のダウンロードや有料素材の購入なし |
| 刺身画像の生成指示 | `assets/sashimi-prompt.md` | 実際に使用したプロンプト、制作方法、保存場所を記録 |
| 厨房・料理人・包丁・水滴・波紋 | `kitchen.js` / `visuals.js` | 本プロジェクトの手続き的メッシュ。元モデルは変更前バックアップに保存 |
| 木目・ステンレス・炎・看板 | `kitchen.js` / `visuals.js` | 本プロジェクトのCanvas生成テクスチャ |
| 効果音 | `game.js` | Web Audioによるノイズ・フィルタ・オシレータ合成 |
| UIフォント | OSのシステムフォント | 外部フォントファイルを配布しない |

魚の制作メタデータは `assets/fish-source/metadata.json`。元メッシュは65,289頂点・128,128三角形。ポリゴン数とテクスチャ解像度を下げず、複数の部品を1つのスキンメッシュに統合しています。GLBは9つのマテリアル・プリミティブ、6ボーン、7アニメーションを持ち、Three.jsではマテリアルごとに9個のSkinnedMeshとして読み込まれます。

GLBは約44.1MBです。LOWでもモデルやテクスチャを低品質な代替へ変更せず、画面の描画解像度と影だけを調整します。

| ソフトウェア | 出典 | ライセンス・改変 |
| --- | --- | --- |
| Three.js 0.180.0 / GLTFLoader / RoundedBoxGeometry / RoomEnvironment | https://github.com/mrdoob/three.js/tree/r180 | MIT、`node_modules/three/LICENSE`。ライブラリコードの改変なし |
| Vite 7.3.7 | https://github.com/vitejs/vite | MIT、`node_modules/vite/LICENSE.md`。改変なし、開発・ビルド用 |
| Playwright Test 1.56.1 | https://github.com/microsoft/playwright | Apache-2.0、`node_modules/@playwright/test/LICENSE`。改変なし、検証用 |
| Blender 5.2.2 LTS | https://www.blender.org/ | PCにインストール済みのBlenderを制作時のみ使用。Blender本体は配布物に含めない |

Three.jsのMITライセンスは `public/THIRD_PARTY_NOTICES.txt` に同梱し、`dist/` にコピーします。開発依存を再配布するときは各パッケージのライセンスを保持してください。

制作スクリプトで参照した公式API資料：

- [glTF export operator](https://docs.blender.org/api/5.0/bpy.ops.export_scene.html)
- [Action slots](https://developer.blender.org/docs/release_notes/4.4/upgrading/slotted_actions/)

今回の成果物は上記APIを実際のBlender 5.2.2で実行して確認しています。アニメーションはNLA_TRACKSとしてGLBに書き出します。
