# アセットとライセンス

第三者の画像、3Dモデル、HDRI、音声、フォントファイルはダウンロード・組み込みしていません。外部CDNやモデルサービスへの実行時アクセスもありません。

| 内容 | 出典 | ライセンス・扱い | 改変 |
| --- | --- | --- | --- |
| 魚、料理人、厨房、包丁、水滴、波紋 | このプロジェクトの `visuals.js` | 本実装で制作した手続き的モデル | 断面メッシュと頂点変形、関節アニメーション |
| 鱗、木目、ステンレスの擦り傷 | `visuals.js` のCanvas生成コード | 本実装で制作したテクスチャ | シード付き描画、PBRの色・凹凸マップとして使用 |
| 効果音 | `game.js` のWeb Audioコード | 本実装で制作した合成音 | ノイズとフィルタ、オシレータによる生成 |
| UIの文字 | OSのシステムフォント | 外部フォントファイルの再配布なし | なし |
| Three.js 0.180.0 / RoundedBoxGeometry / RoomEnvironment | https://github.com/mrdoob/three.js/tree/r180 | MIT。`node_modules/three/LICENSE` を確認 | ライブラリコードの改変なし。PMREMで環境マップを生成 |
| Vite 7.3.7 | https://github.com/vitejs/vite | MIT。`node_modules/vite/LICENSE.md` を確認 | 改変なし。開発・ビルド用途 |
| Playwright Test 1.56.1 | https://github.com/microsoft/playwright | Apache-2.0。`node_modules/@playwright/test/LICENSE` を確認 | 改変なし。テスト用途 |

Three.jsのMITライセンス全文は `public/THIRD_PARTY_NOTICES.txt` に同梱され、ビルド時に `dist/` にコピーされます。開発依存を再配布する場合は、各パッケージに同梱のライセンスも保持してください。
