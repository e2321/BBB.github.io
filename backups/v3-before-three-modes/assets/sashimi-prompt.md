# 刺身画像の制作記録

- 用途：包丁に当たったゲームオーバーの「刺身になりました」演出。
- 方式：組み込み `image_gen` ツール（`imagegen` スキルの標準モード）。外部の写真素材は使用しない。
- 保存先：`public/assets/images/sashimi.png`。生成元からコピーしてゲーム内アセットとして保存。
- 解像度：1536×1024 PNG。透過なし。
- 確認：画像を目視で確認し、盛り付け、料理写真らしい質感、血や過度な描写がないことを確認。

実際の最終プロンプト：

```text
Use case: photorealistic-natural. Asset type: locally saved game-over food photograph for a Japanese browser game. Create a premium professional culinary photograph, landscape 3:2 composition. A beautiful elegant matte ivory ceramic platter centered in the frame, containing delicately arranged fresh sea-bream (madai) sashimi slices: pearlescent translucent pale-pink white fish flesh with natural fine fibers, subtle silver-pink skin edging on several slices. Two graceful overlapping fans of sashimi, shredded white daikon, deep-green shiso leaves, a small mound of fresh wasabi, a lemon wedge, a tiny soy-sauce dish slightly behind. Warm dark wooden Japanese restaurant table, soft window light, crisp appetizing food detail, gentle shallow depth of field. All of the platter must fit in the image with margins. Realistic high-end food magazine photography, polished, delicious, natural colors. No text, no logos, no watermark, no whole fish, no person, no raw animal organs, no blood, no violence or grotesque elements. This is a reusable game asset showing prepared food only. Save a high resolution image suitable for display centered on a game-over screen.
```
