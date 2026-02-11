# バグ修正計画：編集モードでTODO保存時にduplicate keyエラーが発生する

## バグの概要

既存の日報を編集画面で開き、TODOのチェック状態を変更して保存しようとすると、
以下のエラーが発生して保存に失敗する。

```
Failed to save daily todo records: {
  code: '23505',
  details: null,
  hint: null,
  message: 'duplicate key value violates unique constraint "daily_todo_records_unique"'
}
```

---

## バグの根本原因

### `daily_todo_records` テーブルにDELETE用RLSポリシーが存在しない

[supabase/migrations/20260125100002_add_rls_policies.sql](../supabase/migrations/20260125100002_add_rls_policies.sql) を確認すると、
`daily_todo_records` テーブルのRLSポリシーは以下の通り：

| 操作 | ポリシー |
|------|----------|
| SELECT | あり（daily_records経由でuser_id照合） |
| INSERT | あり（daily_records経由でuser_id照合） |
| UPDATE | あり（daily_records経由でuser_id照合） |
| **DELETE** | **なし** |

RLSが有効（`ENABLE ROW LEVEL SECURITY`）で、かつDELETEポリシーが存在しない場合、
Supabaseの `.delete()` はエラーを返さずに**0件削除（サイレントに成功扱い）**となる。

### 発生メカニズム

[lib/db.ts](../lib/db.ts) の `saveDailyTodoRecords` 関数（L1228〜L1266）は
「既存レコードを全DELETE → 新規INSERT」という方式で動作する：

```typescript
// 1. 既存レコードをDELETE（← RLSにより0件削除される）
const { error: deleteError } = await supabase
  .from('daily_todo_records')
  .delete()
  .eq('daily_record_id', dailyRecordId);

// deleteError は null（削除成功に見える）

// 2. 新規INSERT（← 既存レコードが残っているためunique制約違反）
const { error: insertError } = await supabase
  .from('daily_todo_records')
  .insert(recordsToInsert);
// → 23505: duplicate key value violates unique constraint
```

RLSポリシーが欠如しているため、DELETE文はエラーなく完了するが実際には何も削除されない。
その状態でINSERTを実行するため、unique制約 `daily_todo_records_unique (daily_record_id, todo_type, todo_id)` に違反する。

---

## 使用する主要モジュールとバージョン

| モジュール | バージョン | 用途 |
|------------|-----------|------|
| next | 16.1.1 | ビルド確認 |
| @supabase/ssr | ^0.8.0 | Supabase クライアント |
| npx supabase CLI | （インストール済み） | migration push |

依存関係の追加なし。

---

## 修正方針

`daily_todo_records` テーブルにDELETEポリシーを追加する新しいmigrationファイルを作成し、
`npx supabase db push` でDBに反映する。

### 追加するRLSポリシー

```sql
CREATE POLICY "Users can delete own daily todo records" ON "public"."daily_todo_records"
    FOR DELETE USING (
        "daily_record_id" IN (SELECT "id" FROM "public"."daily_records" WHERE "user_id" = auth.uid())
    );
```

既存の他ポリシー（goal_todos / other_todos）と同じパターンで、
`daily_records.user_id` を経由してユーザー所有の記録のみ削除可能とする。

---

## 変更が必要なファイル

| ファイル | 変更内容 |
|----------|----------|
| `supabase/migrations/20260211100000_add_delete_policy_daily_todo_records.sql` | 新規作成：DELETEポリシー追加のmigration |

コードファイルへの変更は不要。

---

## 実装手順

1. `supabase/migrations/20260211100000_add_delete_policy_daily_todo_records.sql` を新規作成
2. DELETEポリシーのSQLを記述
3. `npx supabase db push` を実行してDBに反映
4. ビルド確認（`npm run build`）
5. 動作確認

---

## 想定される影響範囲

- `daily_todo_records` テーブルのDELETE操作のみ影響
- 他テーブルおよびSELECT/INSERT/UPDATE操作への影響なし
- セキュリティ面：自分のdaily_recordに紐づくtodo_recordsのみ削除可能となる（適切な制約）

---

## テスト方針

1. 記録画面でTODOにチェックを入れて「変更を保存する」（新規作成）
2. ホーム画面に遷移
3. 当日カードをクリックして記録画面を再度開く（編集モード）
4. いくつかのTODOのチェック状態を変更する
5. 「変更を保存する」をクリック
6. **エラーが発生せずホーム画面に遷移すること**を確認
7. 再度編集画面を開き、**変更後のチェック状態が正しく表示されること**を確認
