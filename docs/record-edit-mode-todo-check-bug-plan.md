# バグ修正計画：編集モードでTODOのチェック状態が復元されない

## バグの概要

記録画面（`/record`）を編集モードで開いたとき、既に保存済みのTODOチェック状態が
チェックなし（空）の状態で表示される。

## バグの原因

`GET /api/daily-records/[recordId]/todos` が **HTTP 500 エラー**を返している。

### 根本原因

[app/api/daily-records/[recordId]/todos/route.ts](../app/api/daily-records/%5BrecordId%5D/todos/route.ts) のクエリが以下のようになっている：

```typescript
const { data, error } = await supabase
  .from('daily_todo_records')
  .select(`
    *,
    goal_todos(*),
    other_todos(*)
  `)
  .eq('daily_record_id', recordId);
```

Supabase の自動 JOIN（Embedded resource syntax）は、**外部キー制約（FOREIGN KEY）が定義されているテーブル間でのみ機能する**。

しかし `daily_todo_records.todo_id` は `goal_todos.id` または `other_todos.id` のどちらかを指す「多態的な参照」であり、どちらのテーブルへの外部キー制約も定義されていない（[supabase/migrations/20260125100000_add_todo_tables.sql](../supabase/migrations/20260125100000_add_todo_tables.sql) に外部キー定義がない）。

そのため Supabase が `goal_todos(*), other_todos(*)` を JOIN できず、500エラーになっている。

---

## 使用する主要モジュールとバージョン

| モジュール | バージョン | 用途 |
|------------|-----------|------|
| next | 16.1.1 | API Routes |
| @supabase/ssr | ^0.8.0 | Supabase クライアント |

依存関係の追加なし。

---

## 修正方針

`goal_todos` および `other_todos` の JOIN を削除する。

チェック状態の復元に必要な情報は `todo_id` と `is_achieved` のみであり、
JOIN でテーブルの内容を取得する必要はない。

**変更前:**
```typescript
const { data, error } = await supabase
  .from('daily_todo_records')
  .select(`
    *,
    goal_todos(*),
    other_todos(*)
  `)
  .eq('daily_record_id', recordId);
```

**変更後:**
```typescript
const { data, error } = await supabase
  .from('daily_todo_records')
  .select('*')
  .eq('daily_record_id', recordId);
```

また、レスポンスのマッピング部分も整理する（`goalTodo` と `otherTodo` フィールドは削除）：

**変更前:**
```typescript
const records = (data || []).map((record: any) => ({
  id: record.id,
  todoType: record.todo_type as 'goal' | 'other',
  todoId: record.todo_id,
  isAchieved: record.is_achieved,
  goalTodo: record.goal_todos,    // ← JOINデータ（不要）
  otherTodo: record.other_todos,  // ← JOINデータ（不要）
}));
```

**変更後:**
```typescript
const records = (data || []).map((record: any) => ({
  id: record.id,
  todoType: record.todo_type as 'goal' | 'other',
  todoId: record.todo_id,
  isAchieved: record.is_achieved,
}));
```

---

## 変更が必要なファイル

| ファイル | 変更内容 |
|----------|----------|
| `app/api/daily-records/[recordId]/todos/route.ts` | GETのクエリから `goal_todos(*), other_todos(*)` のJOINを削除。レスポンスのマッピングからも `goalTodo`, `otherTodo` を削除 |

---

## 実装手順

1. `app/api/daily-records/[recordId]/todos/route.ts` の SELECT クエリを修正
2. レスポンスのマッピングを修正
3. ビルド確認
4. 動作確認

---

## テスト方針

1. 記録画面でTODOにチェックを入れて「変更を保存する」
2. ホーム画面に遷移
3. 当日カードをクリックして記録画面を再度開く
4. **保存済みのチェック状態が正しく表示されること**を確認
5. ヘッダーの「今日の記録をつける」ボタンからも同様に確認
