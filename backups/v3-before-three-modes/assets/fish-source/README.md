# オリジナルのマダイ参考モデル

`madai.blend` は編集可能な制作ソース、`public/assets/models/madai.glb` はゲーム用です。`npm.cmd run model:fish` でBlenderから再生成します。制作済みなのでゲームを遊ぶだけならBlenderは不要です。

180断面×112周方向の胴体を滑らかに補間し、口・口腔・エラ・目・鼻孔・背びれ・胸びれ・腹びれ・尻びれ・尾びれとヒレの筋を造形しています。全長45.5cmは前版35cmの1.3倍。7ボーンはroot / head / spine_front / spine_rear / tail_base / tail_tip / jaw。下顎は独立して開閉します。

TailBeat_A / TailBeat_Dで頭と尾を近づけて強く曲げ、反動で伸ばします。Airborne / FeignDeath / Landing / Captured / Dryを含む計7クリップ。Three.jsは入力に同期して尾打ちをサンプリングし、横倒しの姿勢を維持します。死んだふりでは口と胴体の動きを止めます。

銀色～淡いピンクの体色、鱗の凹凸と粗さを4096×2048の3枚の画像で表現し、GLBに埋め込みます。濡れた光沢はPBR clearcoat。乾燥演出は同じマテリアルの色・粗さ・clearcoatを変えます。

65,299頂点・128,138三角形、GLB約44.4MB。実際の生成値はmetadata.json、Cycles確認画像はpreview.png。当たり判定は半径0.0845mの球で、従来と同じジャンプ・推進速度です。

Blenderの場所を指定する場合：

```powershell
$env:BLENDER_PATH = 'D:\Apps\Blender\blender.exe'
npm.cmd run model:fish
```
