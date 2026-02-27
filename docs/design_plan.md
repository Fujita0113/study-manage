# Notion Style UI Redesign Plan

## 概要
「Pepper Dev Journal」のフロントエンドデザインを、21歳の情報系エンジニア学生プログラマー向けに、Notion風のクリーンでテックフレンドリーなUIにリニューアルします。

## 対象
- `app/globals.css`
- `app/layout.tsx`
- `components/layout/AppLayout.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/Header.tsx`
- `app/page.tsx`

## デザイン指針 (Notion風)
1. **カラーパレット**
   - 背景色: 純白（`bg-white`）をコンテンツエリアに採用。サイドバー等はライトグレー（`#F7F7F5`相当の `bg-gray-50` などを調整）。
   - テキスト色: Notion標準に近いダークグレー（`text-[#37352F]`または `text-slate-800`）。
   - ホバー色: さりげないグレーのホバー（`hover:bg-gray-100` 等）。
2. **ボックス・シャドウ**
   - 強いドロップシャドウ（`shadow-lg` 等）を排除。
   - 薄い1pxのボーダー（`border-gray-200` 等）によるフラットなカードデザインへと変更。
3. **タイポグラフィとバッジ**
   - Geist / Geist_Mono を活用し、Tech感のあるクリーンな見栄えを維持。
   - 達成度バッジ等はミニマルで洗練されたスタイルに変更。

## 手順
1. `globals.css` とレイアウト系コンポーネント（Sidebar, Header, AppLayout）のスタイル調整。
2. ホーム画面（`page.tsx`）のデイリーレポートカードを「Gallery View / Board View」のようなフラットな見た目に改修。
3. Playwright E2Eテストによる動作確認（裏側のロジックに影響が出ていないかを担保）。
4. 正常動作確認後、変更をPush。
