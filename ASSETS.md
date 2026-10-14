# 第4回改良：既存アセットの再利用と音源生成

今回は既存の魚・コックGLBを使用し、新しいGLBのダウンロード・Blenderモデリングを行っていません。完成済みの外部モデル、写真素材サイト、外部HDRIも追加していません。

- `public/assets/models/madai.glb`：前回Blender Pythonで独自制作した魚をそのまま再利用。7ボーン、7アニメーション、4096×2048 PBR3枚。元の全長45.5cm、対戦では描画スケールを調整して1.5m。
- `public/assets/models/chef.glb`：前回制作した17ボーン・8クリップのコック。元GLBは変更せず、読み込み後のメッシュを `model-optimization.js` で72,276→44,886三角形へ簡略化。UV・骨格ウェイト・材質を保持。
- 厨房は既存のThree.jsメッシュ・Canvasテクスチャを使用。対戦アリーナ、水場、皿、刺身、王冠はThree.jsの基本形状・Canvasで制作しました。
- `assets/images/grilled_fish.png.jpg` はユーザー提供JPEGを維持。`assets/images/sashimi.png` は前回image_genで本ゲーム向けに制作した画像を維持し、存在・読み込みを確認して表示します。

今回追加した効果音は `audio-synthesis.js` のオリジナル生成波形です。減衰する低音の打撃、帯域を整えた乱数音、水音の共鳴・水滴・短い和音を組み合わせています。録音素材の使用、外部音源の取得はありません。通常・軽い・強い・高速・乾燥・水場と、戦闘・UIの音に複数のバリエーションがあります。

`wet-audio.js` が波形をAudioBufferへ事前に格納し、単一AudioContextで再利用します。WAV/MP3へ置換する場合は `replaceSample` にプロジェクト内の適切な権利を持つ音源URLを指定できます。今回のゲーム実行は外部音源・モデルサイトに接続しません。

Three.js 0.180.0はMIT、Vite 7.3.7はMIT、Playwright 1.56.1はApache-2.0。ライセンスは既存の各パッケージに同梱しています。`public/THIRD_PARTY_NOTICES.txt` は配布先へコピーします。OSのシステムフォントを使用します。
