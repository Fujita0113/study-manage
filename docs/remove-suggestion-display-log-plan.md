# suggestion_display_log テーブル削除 実装計画

## 目的
`suggestion_display_log` テーブルとそれに関連するロジックを完全に削除し、提案バナーの表示制御をシンプルにする。

## 変更理由
- 現状：一度提案バナーが表示されると、その日は二度と表示されない
- 望ましい動作：14日目（または14の倍数日目）であれば、何度ページをリロードしても提案バナーが表示される
- `suggestion_display_log` テーブルの存在意義が薄く、ユーザー体験を阻害している

## 使用する主要モジュール
- **Next.js**: 16.1.1
- **@supabase/supabase-js**: ^2.90.1
- **React**: 19.2.3
- **supabase CLI**: ^2.72.4

## 依存関係で注意すべき点
- Supabase マイグレーションファイルは削除するが、既に適用済みの場合はロールバック用マイグレーションを作成する必要がある
- `npx supabase db push` でマイグレーションを適用する（プロジェクトルートから実行）

## 変更が必要なファイル

### 1. データベース
- `supabase/migrations/20260113074447_create_suggestion_display_log.sql` - 削除
- `supabase/migrations/[新規]_drop_suggestion_display_log.sql` - 新規作成（ロールバック用）

### 2. 型定義
- `lib/supabase/types.ts` - `suggestion_display_log` テーブルの型定義を削除
- `types/index.ts` - `SuggestionDisplayLog` インターフェースを削除

### 3. データベース関数
- `lib/db.ts`:
  - `SuggestionDisplayLog` 型のimportを削除
  - `toSuggestionDisplayLog()` 関数を削除（100-111行目）
  - `recordSuggestionDisplay()` 関数を削除（351-377行目）
  - `hasSuggestionBeenDisplayedToday()` 関数を削除（382-410行目）
  - `getSuggestion()` 関数から表示済みチェックを削除（459, 473, 487, 502行目）

### 4. APIエンドポイント
- `app/api/suggestions/display/route.ts` - ファイルごと削除

### 5. クライアントコンポーネント
- `components/SuggestionBanner.tsx`:
  - `useEffect` 内の表示記録ロジックを削除（16-36行目）
  - `hasRecorded` ステートを削除（14行目）

### 6. テストスクリプト（あれば）
- `scripts/test-get-suggestion.ts` - 影響範囲を確認

## 実装手順

### Step 1: データベースのロールバックマイグレーション作成
1. `supabase/migrations/[新規]_drop_suggestion_display_log.sql` を作成
2. テーブル削除のSQLを記述

### Step 2: 型定義の削除
1. `types/index.ts` から `SuggestionDisplayLog` インターフェースを削除
2. `lib/supabase/types.ts` を確認し、必要に応じて更新

### Step 3: データベース関数の削除
1. `lib/db.ts` から以下を削除：
   - `SuggestionDisplayLog` 型のimport
   - `SuggestionDisplayLogRow`, `SuggestionDisplayLogInsert` 型定義
   - `toSuggestionDisplayLog()` 関数
   - `recordSuggestionDisplay()` 関数
   - `hasSuggestionBeenDisplayedToday()` 関数

### Step 4: `getSuggestion()` 関数の簡素化
1. 各レベルアップ提案から `hasSuggestionBeenDisplayedToday()` の呼び出しを削除
2. レベルダウン提案から `hasSuggestionBeenDisplayedToday()` の呼び出しを削除

### Step 5: APIエンドポイントの削除
1. `app/api/suggestions/display/route.ts` を削除
2. ディレクトリ `app/api/suggestions/` が空になった場合は削除

### Step 6: クライアントコンポーネントの簡素化
1. `components/SuggestionBanner.tsx` から表示記録ロジックを削除
2. 不要なステートとuseEffectを削除

### Step 7: マイグレーションの適用
1. **`npx supabase db push`** でマイグレーションを適用（プロジェクトルートから実行）

### Step 8: 動作確認
1. ローカル開発サーバーを起動（`npm run dev`）
2. 14日連続達成のシナリオで提案バナーが表示されるか確認
3. ページリロード後も提案バナーが再表示されるか確認

## 想定される影響範囲
- 提案バナーの表示ロジックがシンプルになる
- 14日目（または14の倍数日目）は何度でも提案バナーが表示される
- データベースのテーブルが1つ減る
- APIエンドポイントが1つ減る

## テスト方針
1. 14日連続達成時に提案バナーが表示されることを確認
2. ページリロード後も提案バナーが再表示されることを確認
3. ×ボタンで閉じた後、リロードすれば再表示されることを確認
4. 15日目（14の倍数でない日）は提案バナーが表示されないことを確認

## ロールバック方法
もし問題が発生した場合：
1. Gitで変更を元に戻す
2. 削除したマイグレーションファイルを復元
3. `npx supabase db push` で再適用
