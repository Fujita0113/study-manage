# 提案バナー当日限り表示機能 実装完了計画

## 現状分析

### 実装済みの部分

元の実装計画 ([proposal-banner-date-limit-plan.md](proposal-banner-date-limit-plan.md)) に対して、以下の作業が**既に完了**しています：

#### ✅ 完了した作業

1. **マイグレーションファイルの作成**
   - ファイル: `supabase/migrations/20260113074447_create_suggestion_display_log.sql`
   - `suggestion_display_log` テーブルの定義完了
   - UNIQUE制約とインデックスの設定完了

2. **TypeScript型定義の追加**
   - ファイル: `types/index.ts`
   - `SuggestionType` 型の追加完了
   - `SuggestionDisplayLog` インターフェースの追加完了

3. **データベースアクセス関数の実装**
   - ファイル: `lib/db.ts`
   - `recordSuggestionDisplay()` 関数の実装完了
   - `hasSuggestionBeenDisplayedToday()` 関数の実装完了
   - `getSuggestion()` 関数の修正完了（表示済みチェックを追加）

4. **SuggestionBannerコンポーネントの修正**
   - ファイル: `components/SuggestionBanner.tsx`
   - useEffect による表示記録処理の追加完了
   - APIエンドポイントへの呼び出し処理完了

5. **APIエンドポイントの実装**
   - ファイル: `app/api/suggestions/display/route.ts`
   - POSTメソッドの実装完了
   - バリデーション処理完了

6. **ドキュメント更新**
   - ファイル: `docs/data-model.md` — `suggestion_display_log` テーブルの追加完了
   - ファイル: `docs/requirements.md` — 表示期間と再表示ルールの追加完了

### ❌ 未完了・問題がある部分

1. **Supabase型定義の更新が未完了**
   - ファイル: `lib/supabase/types.ts`
   - `suggestion_display_log` テーブルの型定義が含まれていない
   - これが原因で、`lib/db.ts` の型参照でエラーが発生している可能性が高い

2. **マイグレーションの適用状況が不明**
   - マイグレーションファイルは作成されているが、ローカルDBに適用されているか確認が必要

3. **動作確認が未完了**
   - 実装は完了しているが、実際の動作確認が行われていない

---

## エラーの原因

`lib/db.ts` の以下の部分で型エラーが発生していると推測されます：

```typescript
// Supabaseのsuggestion_display_logテーブルの型
type SuggestionDisplayLogRow = Database['public']['Tables']['suggestion_display_log']['Row'];
type SuggestionDisplayLogInsert = Database['public']['Tables']['suggestion_display_log']['Insert'];
```

**原因**: `lib/supabase/types.ts` の `Database` 型に `suggestion_display_log` テーブルの定義が含まれていないため、上記の型参照がエラーになる。

---

## 修正計画

### 使用する主要モジュールとバージョン

- **Supabase CLI**: ^2.72.4
- **@supabase/supabase-js**: ^2.90.1
- **Next.js**: 16.1.1

**依存関係で注意すべき点**:
- Supabase CLI v2系では `supabase db push` や `supabase gen types typescript` コマンドを使用
- ローカルDBへのマイグレーション適用後に型定義を再生成する必要がある

---

## 実装ステップ

### ステップ1: マイグレーションの適用

ローカルSupabaseデータベースにマイグレーションを適用します。

**コマンド**:
```bash
npx supabase db reset
```

または、既存データを保持したい場合：
```bash
npx supabase migration up
```

**確認事項**:
- マイグレーションが正常に適用されたことを確認
- エラーが発生した場合は、マイグレーションファイルの内容を確認

---

### ステップ2: Supabase型定義の再生成

マイグレーション適用後、TypeScript型定義を再生成します。

**コマンド**:
```bash
npx supabase gen types typescript --local > lib/supabase/types.ts
```

**期待される結果**:
- `lib/supabase/types.ts` に `suggestion_display_log` テーブルの型定義が追加される

**確認方法**:
生成された型定義ファイルに以下のような定義が含まれているか確認：

```typescript
export type Database = {
  public: {
    Tables: {
      // ... 既存のテーブル定義 ...

      suggestion_display_log: {
        Row: {
          id: string
          user_id: string
          suggestion_type: string
          target_level: string | null
          display_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          suggestion_type: string
          target_level?: string | null
          display_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          suggestion_type?: string
          target_level?: string | null
          display_date?: string
          created_at?: string
        }
        Relationships: []
      }

      // ... 他のテーブル定義 ...
    }
  }
}
```

---

### ステップ3: TypeScriptのビルド確認

型定義の再生成後、TypeScriptのエラーが解消されているか確認します。

**コマンド**:
```bash
npm run build
```

**確認事項**:
- ビルドが成功することを確認
- `lib/db.ts` の型エラーが解消されていることを確認

---

### ステップ4: 開発サーバーの起動と動作確認

開発サーバーを起動して、実際の動作を確認します。

**コマンド**:
```bash
npm run dev
```

**テスト項目**:

#### 4.1 提案バナーの初回表示
- [ ] 14日連続達成時に提案バナーが表示されること（Bronze/Silver/Gold各レベル）
- [ ] 7日中4日未達時にレベルダウン提案バナーが表示されること

#### 4.2 表示記録の確認
- [ ] 提案バナーが表示されたときに、`/api/suggestions/display` が呼び出されること（開発者ツールのNetworkタブで確認）
- [ ] APIが正常に応答すること（200 OK）
- [ ] `suggestion_display_log` テーブルに記録が追加されること

**確認方法（Supabase Studio）**:
```sql
SELECT * FROM suggestion_display_log ORDER BY created_at DESC;
```

#### 4.3 同日の再表示抑制
- [ ] 一度表示された提案バナーを×ボタンで閉じる
- [ ] ページをリロードしても、同じ日には再表示されないこと
- [ ] 条件を満たしているにもかかわらず、バナーが表示されないこと

#### 4.4 日付変更後の挙動（手動テスト）
- [ ] 翌日になったら（条件を満たさない場合）提案バナーが非表示になること
- [ ] 再度条件を満たしたら、提案バナーが表示されること

**日付変更のシミュレーション方法**:
1. `suggestion_display_log` テーブルの `display_date` を過去の日付に変更
   ```sql
   UPDATE suggestion_display_log
   SET display_date = '2026-01-12'
   WHERE display_date = '2026-01-13';
   ```
2. ページをリロードして、提案バナーが再表示されることを確認

---

### ステップ5: エラーハンドリングの確認

想定されるエラーケースで正しく動作するか確認します。

#### 5.1 ネットワークエラーのシミュレーション
- [ ] 開発者ツールでネットワークをオフラインにする
- [ ] 提案バナーが表示されても、記録失敗によってユーザー体験に影響しないことを確認
- [ ] コンソールにエラーログが出力されることを確認

#### 5.2 重複記録の処理
- [ ] 同じ提案バナーを複数のタブで同時に表示
- [ ] UNIQUE制約により、1件のみ記録されることを確認
- [ ] APIが正常に応答すること（エラーにならない）

---

## 変更が必要なファイルのリスト

### 既に変更済み（コミット待ち）

- `supabase/migrations/20260113074447_create_suggestion_display_log.sql` — 新規作成済み
- `types/index.ts` — 修正済み
- `lib/db.ts` — 修正済み
- `components/SuggestionBanner.tsx` — 修正済み
- `app/api/suggestions/display/route.ts` — 新規作成済み
- `docs/data-model.md` — 修正済み
- `docs/requirements.md` — 修正済み

### これから変更するファイル

- `lib/supabase/types.ts` — **自動生成により更新**

---

## リスクと対策

### リスク1: マイグレーション適用に失敗する

**想定される原因**:
- ローカルSupabaseが起動していない
- マイグレーションファイルにSQL構文エラーがある
- 既存テーブルとの競合

**対策**:
1. `npx supabase status` でローカルSupabaseの状態を確認
2. 必要に応じて `npx supabase start` で起動
3. マイグレーションファイルの構文を確認
4. エラーメッセージを確認して、ユーザーに報告

### リスク2: 型定義の再生成に失敗する

**想定される原因**:
- マイグレーションが正しく適用されていない
- Supabase CLIのバージョンが古い

**対策**:
1. マイグレーションの適用状況を確認
2. Supabase CLIのバージョンを確認（`npx supabase --version`）
3. 必要に応じてCLIをアップデート

### リスク3: 既存データに影響する

**想定される原因**:
- `npx supabase db reset` コマンドは全データを削除する

**対策**:
1. 開発環境のため、データ消失は許容範囲
2. ユーザーに確認を取る
3. 必要に応じて、`npx supabase migration up` を使用（既存データを保持）

---

## 作業手順（ステップバイステップ）

### 手順1: Supabaseローカル環境の確認

```bash
npx supabase status
```

- ローカルSupabaseが起動していることを確認
- 起動していない場合は `npx supabase start` を実行

### 手順2: マイグレーションの適用

```bash
npx supabase db reset
```

または

```bash
npx supabase migration up
```

### 手順3: 型定義の再生成

```bash
npx supabase gen types typescript --local > lib/supabase/types.ts
```

### 手順4: ビルド確認

```bash
npm run build
```

- エラーが発生しないことを確認

### 手順5: 開発サーバー起動

```bash
npm run dev
```

### 手順6: 動作確認

上記の「ステップ4: 開発サーバーの起動と動作確認」に記載されたテスト項目を実行

### 手順7: コミット

動作確認が完了したら、全ての変更をコミット：

```bash
git add .
git commit -m "feat: 提案バナーを当日限りの表示に変更

- suggestion_display_logテーブルを追加
- 提案バナーの表示履歴を記録
- 同日の重複表示を防止
- 型定義の再生成
- 関連ドキュメントを更新"
```

---

## 想定される影響範囲

### データベース
- 新しいテーブル `suggestion_display_log` の追加
- 既存のテーブルには影響なし

### 型定義
- `lib/supabase/types.ts` の自動生成による更新
- 既存の型定義に影響はないが、ファイル全体が再生成される

### コード
- 既存のコードには影響なし（既に実装済み）

### パフォーマンス
- `getSuggestion()` の実行時に追加のDBクエリが1回発生
- インデックスを適切に設定しているため、影響は最小限

---

## 完了条件

以下の全てが満たされたら、実装完了とします：

1. ✅ マイグレーションが正常に適用されている
2. ✅ `lib/supabase/types.ts` に `suggestion_display_log` の型定義が含まれている
3. ✅ TypeScriptのビルドが成功する（エラーなし）
4. ✅ 開発サーバーが起動し、提案バナーが表示される
5. ✅ 提案バナーの表示が記録される（`suggestion_display_log` テーブル）
6. ✅ 同日の再表示が抑制される
7. ✅ 翌日になったら再度提案バナーが表示される（日付変更のシミュレーション）
8. ✅ 全ての変更がコミットされている

---

## まとめ

元の実装計画のほとんどの作業は完了していますが、**Supabase型定義の再生成**が未完了のため、TypeScriptの型エラーが発生している状態です。

この修正計画では、以下の作業のみを実施します：

1. マイグレーションの適用確認
2. Supabase型定義の再生成
3. ビルド確認
4. 動作確認

これにより、実装が完全に完了し、提案バナーの当日限り表示機能が正常に動作するようになります。
