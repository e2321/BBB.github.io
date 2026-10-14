# オリジナルの料理人モデル

`chef.blend` が編集可能なソース、`public/assets/models/chef.glb` がゲーム用です。`npm.cmd run model:chef` でBlender Python APIから再生成します。完成済み外部モデルは使用していません。

頭部は鼻・頬・顎・眉の形状を持つカスタムメッシュ。目・耳・口、プリーツ付き帽子、肩から腰へ絞った調理服、縫い目・ボタン、布のエプロン、袖・ズボン、指と靴を造形。刀身・柄・鋲のある包丁を右手の骨へウェイト設定しています。

root / pelvis / chest / neck / headと左右の腕・前腕・手・太もも・すね・足の計17ボーン。Idle / Walk / Windup / Throw / Inspect / Stunned / Capture / IntroChopの8クリップをNLAとしてGLBへ書き出します。

織物法線画像は1024×1024。材質は肌、綿、キャンバス、革、金属を分けています。36,547頂点・72,276三角形。正確な生成値はmetadata.jsonを参照してください。ゲームは骨格をインスタンスごとに複製し、各料理人のAI状態からアニメーションを選択します。
