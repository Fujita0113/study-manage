# streaksテーブル削除実装計画

## 作業の目的と概要

`streaks`テーブルは設計段階で定義されたものの、実際の実装では使用されていません。現在のストリーク表示機能は`daily_records`テーブルから直接計算されており、`streaks`テーブルは不要な状態です。

この計画では、`streaks`テーブルとその関連コードを完全に削除し、コードベースをシンプルに保ちます。

## 使用する主要モジュールとバージョン

```json
{
  "@supabase/ssr": "^0.8.0",
  "@supabase/supabase-js": "^2.90.1",
  "supabase": "^2.72.4"
}
```

## 依存関係で注意すべき点

- Supabase CLI (`supabase`) でマイグレーションファイルを作成・適用
- `@supabase/supabase-js` のバージョンは2系を使用
- Next.js 16.1.1環境でのServer Component対応

## 影響範囲の調査結果

### 1. データベース層

#### Supabase Migrationsファイル
- ✅ `supabase/migrations/20260112145145_remote_schema.sql` (244-253行目)
  - `streaks`テーブルの定義が含まれている

#### Prismaスキーマ（使用されていない可能性が高い）
- ✅ `prisma/schema.prisma` (104-116行目)
  - `Streak`モデルの定義
  - `UserSettings`との1対1リレーション定義

### 2. 型定義ファイル

#### TypeScript型定義
- ✅ `types/index.ts` (36-44行目)
  - `Streak`インターフェースの定義

#### Supabase自動生成型
- ✅ `lib/supabase/types.ts` (136-162行目)
  - `streaks`テーブルの型定義（Row, Insert, Update）

### 3. データアクセス層

#### データベース関数
- ✅ `lib/db.ts` (314-325行目)
  - `getStreak()`: モックデータを返すのみ
  - `updateStreak()`: モックデータを返すのみ

#### モックデータ
- ✅ `lib/mockData.ts` (216-224行目)
  - `mockStreak`の定義
- ✅ `lib/mockData.ts` (1-10行目)
  - `Streak`型のインポート

### 4. アプリケーション層

#### Store/State管理
- ✅ `lib/store.tsx` (6行目)
  - `Streak`型のインポート
- ✅ `lib/store.tsx` (7行目)
  - `mockStreak`のインポート
- ✅ `lib/store.tsx` (18-20行目)
  - `getStreakDays()`関数内で`mockStreak.currentStreak`を使用

### 5. ドキュメント

#### データモデルドキュメント
- ✅ `docs/data-model.md` (177-212行目)
  - Streakエンティティの説明
- ✅ `docs/data-model.md` (217-222行目、291-295行目)
  - ERD図とリレーションシップの記述

#### 要件定義書
- ✅ `docs/requirements.md` (11行目)
  - ヘッダーストリーク表示の説明（機能自体は残すが、実装方法の記述を更新）

### 6. スクリプト

#### テストスクリプト
- ✅ `scripts/test-mock-data.ts` (92行目)
  - `streaks`テーブルへのアクセス（テスト用）
- ✅ `scripts/check-streak-data.ts` (44行目)
  - `streaks`テーブルへのアクセス（確認用）

### 7. 計画ドキュメント（参考資料）

- ⚠️ `docs/header-streak-supabase-integration-plan.md`
  - streaksテーブル統合計画（未実装のまま）
- ⚠️ `docs/header-streak-sync-fix-plan.md`
  - streaks同期修正計画（未実装のまま）

## 変更が必要なファイル一覧

### Phase 1: データベース層の削除

1. **Supabase Migration作成**
   - `supabase/migrations/[timestamp]_drop_streaks_table.sql` (新規作成)
   - `DROP TABLE IF EXISTS streaks;` を実行

### Phase 2: 型定義の削除

2. **`types/index.ts`**
   - `Streak`インターフェースの削除 (36-44行目)

3. **`lib/supabase/types.ts`**
   - `streaks`テーブルの型定義を削除 (136-162行目)
   - **注意**: このファイルは`supabase gen types`で自動生成される可能性があるため、マイグレーション適用後に再生成すること

### Phase 3: データアクセス層の削除

4. **`lib/db.ts`**
   - `getStreak()`関数の削除 (316-318行目)
   - `updateStreak()`関数の削除 (320-325行目)
   - `Streak`型のインポート削除 (17行目)

5. **`lib/mockData.ts`**
   - `Streak`型のインポート削除 (5行目)
   - `mockStreak`定義の削除 (216-224行目)

### Phase 4: アプリケーション層の修正

6. **`lib/store.tsx`**
   - **重要**: この修正が最も影響が大きい
   - `Streak`型のインポート削除 (6行目)
   - `mockStreak`のインポート削除 (7行目)
   - `getStreakDays()`関数の実装を変更
     - `mockStreak.currentStreak`を返す代わりに、`daily_records`から計算する実装に変更
     - または、親コンポーネントから`streakDays`をpropsで受け取る設計に変更
   - **実装方針の確認が必要**: ストリーク計算を以下のどちらで行うか
     - Option A: Server Componentで計算して、Client Componentにpropsで渡す（推奨）
     - Option B: Client Componentで`daily_records`をfetchして計算する

### Phase 5: ドキュメントの更新

7. **`docs/data-model.md`**
   - Streakエンティティのセクションを削除 (177-212行目)
   - ERD図から`Streak`を削除 (217-222行目、291-295行目)
   - `User → Streak`リレーションシップの説明を削除 (291-295行目)
   - SQL例から`streaks`テーブル定義を削除 (375-383行目)
   - トリガー定義から`update_streaks_updated_at`を削除 (397行目)

8. **`docs/requirements.md`**
   - ヘッダーストリーク表示の実装方法の記述を更新
   - 「`streaks`テーブルで管理」→「`daily_records`から計算」に変更

### Phase 6: スクリプトの削除または修正

9. **`scripts/test-mock-data.ts`**
   - `streaks`テーブルへのアクセスを削除 (92行目)

10. **`scripts/check-streak-data.ts`**
    - `streaks`テーブルへのアクセスを削除 (44行目)
    - または、ファイル全体を削除する（ストリーク確認専用スクリプトの場合）

### Phase 7: 古い計画ドキュメントの削除（オプション）

11. **`docs/header-streak-supabase-integration-plan.md`**
    - 削除（未実装の計画なので不要）

12. **`docs/header-streak-sync-fix-plan.md`**
    - 削除（未実装の計画なので不要）

### Phase 8: Prismaスキーマの削除（Prismaを使用している場合）

13. **`prisma/schema.prisma`**
    - `Streak`モデルの削除 (104-116行目)
    - `UserSettings`モデルから`streak Streak?`リレーションを削除 (25行目)
    - **注意**: 現在Prismaは使用されていない可能性が高い（Supabaseのみ使用）
    - 使用されていない場合は、この変更はオプション

## 実装手順（ステップバイステップ）

### Step 1: 現状確認とバックアップ
1. `npx supabase db pull` で現在のスキーマを確認
2. 現在のストリーク表示がどこで実装されているか最終確認
   - `lib/store.tsx`の`getStreakDays()`の動作確認
   - `components/layout/Header.tsx`でのストリーク表示確認

### Step 2: ストリーク計算ロジックの実装（最重要）

**重要**: データベースから`streaks`テーブルを削除する前に、ストリーク計算の代替実装を完成させる必要があります。

#### Option A: Server Componentでストリークを計算（推奨）

1. **`lib/db.ts`に新しい関数を追加**
   ```typescript
   /**
    * daily_recordsからストリークを計算
    */
   export async function calculateStreakFromRecords(
     userId: string = MOCK_USER_ID
   ): Promise<number> {
     const records = await getDailyRecords(userId);

     // Bronze以上の連続日数をカウント
     let streak = 0;
     const today = new Date().toISOString().split('T')[0];

     for (let i = 0; i < records.length; i++) {
       const record = records[i];
       const expectedDate = new Date();
       expectedDate.setDate(expectedDate.getDate() - i);
       const expectedDateStr = expectedDate.toISOString().split('T')[0];

       // 日付が連続していない場合は終了
       if (record.date !== expectedDateStr) break;

       // Bronze以上なら連続
       if (['bronze', 'silver', 'gold'].includes(record.achievementLevel)) {
         streak++;
       } else {
         // noneが出たら連続終了
         break;
       }
     }

     return streak;
   }
   ```

2. **`app/layout.tsx`または各ページでストリークを計算**
   ```typescript
   // Server Componentで計算
   const streakDays = await calculateStreakFromRecords(userId);

   // Client Componentにpropsで渡す
   <Header pageTitle="ホーム" streakDays={streakDays} />
   ```

3. **`lib/store.tsx`の修正**
   - `getStreakDays()`関数を削除
   - または、propsで受け取った値を返すだけの関数に変更

4. **`components/layout/Header.tsx`の修正**
   - `useAppState().getStreakDays()`の代わりに、propsで`streakDays`を受け取る
   ```typescript
   interface HeaderProps {
     pageTitle: string;
     streakDays: number; // 追加
   }

   export function Header({ pageTitle, streakDays }: HeaderProps) {
     return (
       <div className="...">
         {/* ... */}
         <span className="text-sm font-medium text-orange-700">{streakDays} days</span>
         {/* ... */}
       </div>
     );
   }
   ```

### Step 3: 型定義の削除

1. **`types/index.ts`から`Streak`インターフェースを削除**
   ```typescript
   // 36-44行目を削除
   ```

### Step 4: データアクセス層の削除

1. **`lib/db.ts`の修正**
   - `Streak`型のインポートを削除 (17行目)
   - `getStreak()`関数を削除 (316-318行目)
   - `updateStreak()`関数を削除 (320-325行目)

2. **`lib/mockData.ts`の修正**
   - `Streak`型のインポートを削除 (5行目)
   - `mockStreak`の定義を削除 (216-224行目)

### Step 5: アプリケーション層の修正

1. **`lib/store.tsx`の修正**
   - `Streak`型のインポートを削除 (6行目)
   - `mockStreak`のインポートを削除 (7行目)
   - `getStreakDays()`関数を削除または変更 (18-20行目)

### Step 6: Supabase Migrationの作成と適用

1. **新しいマイグレーションファイルを作成**
   ```bash
   npx supabase migration new drop_streaks_table
   ```

2. **マイグレーションファイルに以下を記述**
   ```sql
   -- streaksテーブルを削除
   DROP TABLE IF EXISTS public.streaks;

   -- 関連するトリガーも削除（存在する場合）
   DROP TRIGGER IF EXISTS update_streaks_updated_at ON public.streaks;
   ```

3. **マイグレーションを適用**
   ```bash
   npx supabase db push
   ```

4. **Supabase型定義を再生成**
   ```bash
   npx supabase gen types typescript --local > lib/supabase/types.ts
   ```

### Step 7: ドキュメントの更新

1. **`docs/data-model.md`の更新**
   - Streakエンティティのセクションを削除
   - ERD図から`Streak`を削除
   - リレーションシップの説明から`User → Streak`を削除
   - SQL例から`streaks`テーブル定義を削除

2. **`docs/requirements.md`の更新**
   - ヘッダーストリーク表示の実装方法を更新
   - 「`daily_records`から計算される」ことを明記

### Step 8: スクリプトの修正

1. **`scripts/test-mock-data.ts`の修正**
   - `streaks`テーブルへのアクセスを削除

2. **`scripts/check-streak-data.ts`の修正**
   - `streaks`テーブルへのアクセスを削除
   - または、ファイル全体を削除

### Step 9: 古い計画ドキュメントの削除

1. **以下のファイルを削除**
   - `docs/header-streak-supabase-integration-plan.md`
   - `docs/header-streak-sync-fix-plan.md`

### Step 10: 動作確認

1. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

2. **ヘッダーのストリーク表示を確認**
   - ホーム画面でストリークが正しく表示されるか
   - `daily_records`の内容に応じて計算されているか

3. **型エラーがないことを確認**
   ```bash
   npm run build
   ```

## 想定される影響範囲

### データベース
- ✅ `streaks`テーブルが削除される
- ⚠️ 既存のストリークデータは失われる（現在未使用なので問題なし）

### アプリケーション
- ✅ ヘッダーのストリーク表示機能は維持される
- ✅ ストリーク計算が`daily_records`から行われるように変更される
- ⚠️ `lib/store.tsx`の大幅な変更が必要
- ⚠️ Server Component / Client Componentの境界に注意

### パフォーマンス
- ⚠️ ストリーク計算が毎回行われるため、若干のパフォーマンス低下の可能性
  - 対策: Server Componentでの計算はキャッシュされるため、問題になりにくい
  - 将来的に問題になる場合は、React Cacheなどを検討

## テスト方針

### 手動テスト

1. **ストリーク表示の確認**
   - Bronze以上を連続で達成した場合、正しい日数が表示されるか
   - 記録がない日がある場合、ストリークがリセットされるか
   - 今日の記録がない場合、昨日までのストリークが表示されるか

2. **エッジケース**
   - 記録が1件もない場合（0 daysと表示されるか）
   - 記録がすべて`none`の場合（0 daysと表示されるか）
   - 記録が1件だけの場合（1 dayと表示されるか）

### ビルドテスト

1. **型エラーがないことを確認**
   ```bash
   npm run build
   ```

2. **未使用インポートの警告がないことを確認**
   - `Streak`型がどこかで参照されていないか

## リスクと対策

### リスク1: ストリーク計算ロジックの実装ミス
- **対策**: Step 2でストリーク計算の代替実装を先に完成させ、動作確認してからテーブル削除を行う

### リスク2: Server Component / Client Componentの境界エラー
- **対策**: `lib/db.ts`をClient Componentで直接使用しないよう注意
- **対策**: `calculateStreakFromRecords()`はServer Componentでのみ使用

### リスク3: Supabase型定義の自動上書き
- **対策**: マイグレーション適用後、必ず`npx supabase gen types`で型定義を再生成

### リスク4: 既存の未完了PRや計画との衝突
- **対策**: 古い計画ドキュメント（`docs/header-streak-*-plan.md`）を削除し、混乱を防ぐ

## ロールバック計画

万が一問題が発生した場合:

1. **Supabase Migrationのロールバック**
   ```sql
   -- streaksテーブルを再作成
   CREATE TABLE IF NOT EXISTS public.streaks (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
     current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
     longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
     last_recorded_date DATE,
     updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
   );

   CREATE TRIGGER update_streaks_updated_at
   BEFORE UPDATE ON public.streaks
   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
   ```

2. **Gitでコードを元に戻す**
   ```bash
   git revert [commit-hash]
   ```

## 完了条件

- ✅ `streaks`テーブルがSupabaseから削除されている
- ✅ `Streak`型定義がすべてのファイルから削除されている
- ✅ `getStreak()`、`updateStreak()`関数が削除されている
- ✅ `mockStreak`が削除されている
- ✅ `lib/store.tsx`が正しく動作している
- ✅ ヘッダーのストリーク表示が正しく機能している
- ✅ ドキュメントが更新されている
- ✅ 古い計画ドキュメントが削除されている
- ✅ ビルドエラーがない
- ✅ 型エラーがない

## 補足事項

### Prismaについて
現在、プロジェクトは主にSupabaseを使用しており、Prismaは実際には使用されていない可能性が高いです。`prisma/schema.prisma`に`Streak`モデルが定義されていますが、実際のコードでPrisma Clientが使用されている形跡はありません。

- **推奨**: Prismaを使用していないことを確認し、`prisma/schema.prisma`も更新する
- **または**: Prismaディレクトリ全体を削除する（使用していない場合）

### Supabase型定義の自動生成について
`lib/supabase/types.ts`は`npx supabase gen types`で自動生成されるファイルです。マイグレーション適用後、必ずこのコマンドを実行して型定義を最新の状態に保ってください。

### 将来的なストリーク機能の拡張
将来的にストリーク情報をキャッシュしたい場合は、以下のアプローチを検討できます:

1. **Redis/Vercel KVでキャッシュ**: ストリーク計算結果をキャッシュ
2. **React Cacheを使用**: Server Componentでのキャッシュ機能を活用
3. **再度`streaks`テーブルを作成**: その場合は、正しく実装する

ただし、現時点では`daily_records`から計算する方式で十分なパフォーマンスが得られると考えられます。
