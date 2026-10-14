# Blender製マダイ参考モデル

`madai.blend` が編集可能な制作ファイル、`public/assets/models/madai.glb` がゲームで使用するアセットです。外部の魚モデルは使用していません。

## 再生成

```powershell
npm.cmd run model:build
```

Windowsでは `C:/Program Files/Blender Foundation/` からBlenderを検出します。別の場所にインストールされている場合：

```powershell
$env:BLENDER_PATH = 'D:\Apps\Blender\blender.exe'
npm.cmd run model:build
```

直接実行する場合：

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python tools/build_fish.py
```

BlenderがないPCで再生成する場合は、[Blender公式ダウンロード](https://www.blender.org/download/)からBlenderをインストールし、上記の `BLENDER_PATH` を設定してください。ゲームを遊ぶだけならBlenderは不要です。GLBとテクスチャは制作済みで同梱しています。

## メッシュと骨格

180断面×112周方向のUV付き胴体を、解剖学的な高さ・厚みの分布から滑らかな補間で制作しています。口、エラ、左右の目、鼻孔、背びれ、胸びれ、腹びれ、尻びれ、二叉尾びれとヒレの筋を別造形し、滑らかなウェイトで統合しています。

Blenderの魚はY軸に沿い、頭が+Y方向。glTFのY-up変換により、Three.jsでは頭が-Z方向になります。モデルの長さは約0.35m。ゲーム側でZ軸に90度回し、基本姿勢を横倒しにしています。当たり判定は従来の半径0.065mの球のままです。

ボーンは `root`, `head`, `spine_front`, `spine_rear`, `tail_base`, `tail_tip` の6本。2本の隣接ボーンのスムーズな重み補間で頭から尾まで連続して曲がります。GLBに `JOINTS_0` と `WEIGHTS_0` を保持しています。

## アニメーション

| GLB内の名前 | 用途 |
| --- | --- |
| TailBeat_A / TailBeat_D | 左右の尾打ちから全身を曲げる |
| Airborne | 空中でのしなり |
| FeignDeath | 脱力して横たわる |
| Landing | 着地後の小さな反動 |
| Captured | 捕まった直後に弱くもがく |
| Dry | 乾燥して力を失った曲がり |

Three.jsのAnimationMixerで再生します。モデルの濡れた皮膚はclearcoat、低いmetalness、鱗の法線と粗さマップを使用します。乾燥演出では同じモデルの色・roughness・clearcoatを変化させます。

## 制作物

- `madai.blend`：メッシュ・骨格・アニメーション・埋め込みテクスチャ。
- `madai_basecolor_4k.png`：銀色の体色、背腹の変化、鱗、側線、細かな色むら。
- `madai_normal_4k.png`：鱗と皮膚の細かな凹凸。
- `madai_roughness_4k.png`：表面の粗さの変化。
- `preview.png`：Blender Cyclesの制作プレビュー。
- `metadata.json`：実際の生成時の頂点・三角形数と書き出し情報。

GLBにはテクスチャを埋め込みます。配布用の `dist/` にBlenderソース一式を入れる必要はありません。
