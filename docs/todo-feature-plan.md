# 目標TODOリスト機能 実装計画

## 概要

目標（Bronze/Silver/Gold）を単一テキストから複数のTODOリスト形式に変更し、「その他」TODOカテゴリを追加する機能の実装計画。

## 使用する主要モジュールとバージョン

| モジュール | バージョン | 用途 |
|-----------|-----------|------|
| next | 16.1.1 | App Router, API Routes |
| react | 19.2.3 | UIコンポーネント |
| @supabase/supabase-js | ^2.90.1 | データベースアクセス |
| @supabase/ssr | ^0.8.0 | Server Component用Supabaseクライアント |
| tailwindcss | ^4 | スタイリング |
| lucide-react | ^0.562.0 | アイコン |

## 依存関係で注意すべき点

- Next.js 16のApp RouterではServer ComponentとClient Componentの境界を明確にする必要がある
- `lib/db.ts`はServer Component専用（`next/headers`使用）
- Client ComponentからはAPI Routes経由でデータアクセス

---

## フェーズ1: データベース変更

### 1.1 新規テーブル作成

**ファイル**: `supabase/migrations/YYYYMMDDHHMMSS_add_todo_tables.sql`

```sql
-- Goal Todos テーブル
CREATE TABLE goal_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goal_todos_goal_id ON goal_todos(goal_id);

-- Other Todos テーブル
CREATE TABLE other_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  last_achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_other_todos_user_id ON other_todos(user_id);
CREATE INDEX idx_other_todos_user_archived ON other_todos(user_id, is_archived);

-- Daily Todo Records テーブル
CREATE TABLE daily_todo_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_record_id UUID NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
  todo_type TEXT NOT NULL CHECK (todo_type IN ('goal', 'other')),
  todo_id UUID NOT NULL,
  is_achieved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(daily_record_id, todo_type, todo_id)
);

CREATE INDEX idx_daily_todo_records_daily_record_id ON daily_todo_records(daily_record_id);

-- updated_atトリガー
CREATE TRIGGER update_goal_todos_updated_at
  BEFORE UPDATE ON goal_todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_other_todos_updated_at
  BEFORE UPDATE ON other_todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 既存テーブル変更

**ファイル**: `supabase/migrations/YYYYMMDDHHMMSS_modify_existing_tables.sql`

```sql
-- goals.descriptionをNULL許可に変更
ALTER TABLE goals ALTER COLUMN description DROP NOT NULL;
```

### 1.3 RLSポリシー追加

**ファイル**: `supabase/migrations/YYYYMMDDHHMMSS_add_rls_policies.sql`

```sql
-- goal_todos
ALTER TABLE goal_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goal todos" ON goal_todos
  FOR SELECT USING (
    goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own goal todos" ON goal_todos
  FOR INSERT WITH CHECK (
    goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own goal todos" ON goal_todos
  FOR UPDATE USING (
    goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own goal todos" ON goal_todos
  FOR DELETE USING (
    goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
  );

-- other_todos
ALTER TABLE other_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own other todos" ON other_todos
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own other todos" ON other_todos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own other todos" ON other_todos
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own other todos" ON other_todos
  FOR DELETE USING (user_id = auth.uid());

-- daily_todo_records
ALTER TABLE daily_todo_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily todo records" ON daily_todo_records
  FOR SELECT USING (
    daily_record_id IN (SELECT id FROM daily_records WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own daily todo records" ON daily_todo_records
  FOR INSERT WITH CHECK (
    daily_record_id IN (SELECT id FROM daily_records WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own daily todo records" ON daily_todo_records
  FOR UPDATE USING (
    daily_record_id IN (SELECT id FROM daily_records WHERE user_id = auth.uid())
  );
```

---

## フェーズ2: 型定義とDB関数

### 2.1 型定義更新

**ファイル**: `types/index.ts`

追加する型:
```typescript
interface GoalTodo {
  id: string;
  goalId: string;
  content: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface OtherTodo {
  id: string;
  userId: string;
  content: string;
  isArchived: boolean;
  lastAchievedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface DailyTodoRecord {
  id: string;
  dailyRecordId: string;
  todoType: 'goal' | 'other';
  todoId: string;
  isAchieved: boolean;
  createdAt: Date;
}
```

### 2.2 Supabase型定義更新

**ファイル**: `lib/supabase/types.ts`

`npx supabase gen types typescript`で再生成

### 2.3 DB関数追加

**ファイル**: `lib/db.ts`

追加する関数:
- `getGoalTodos(goalId: string): Promise<GoalTodo[]>`
- `getGoalTodosByUserId(userId: string): Promise<Record<GoalLevel, GoalTodo[]>>`
- `createGoalTodos(goalId: string, todos: string[]): Promise<GoalTodo[]>`
- `updateGoalTodos(goalId: string, todos: {id?: string, content: string}[]): Promise<GoalTodo[]>`
- `getOtherTodos(userId: string, includeArchived?: boolean): Promise<OtherTodo[]>`
- `createOtherTodo(userId: string, content: string): Promise<OtherTodo>`
- `archiveOtherTodo(todoId: string): Promise<OtherTodo>`
- `unarchiveOtherTodo(todoId: string): Promise<OtherTodo>`
- `getDailyTodoRecords(dailyRecordId: string): Promise<DailyTodoRecord[]>`
- `saveDailyTodoRecords(dailyRecordId: string, records: {todoType, todoId, isAchieved}[]): Promise<void>`

---

## フェーズ3: API Routes

### 3.1 Goal Todos API

**ファイル**: `app/api/goals/[goalId]/todos/route.ts`
- GET: 指定goalのTODO一覧取得
- POST: TODO追加
- PUT: TODO一括更新

**ファイル**: `app/api/goals/todos/route.ts`
- GET: ユーザーの全目標のTODO一覧取得（level別にグループ化）

### 3.2 Other Todos API

**ファイル**: `app/api/other-todos/route.ts`
- GET: その他TODO一覧取得（アーカイブ除く）
- POST: その他TODO追加

**ファイル**: `app/api/other-todos/[todoId]/route.ts`
- PATCH: アーカイブ/復活

**ファイル**: `app/api/other-todos/search/route.ts`
- GET: オートコンプリート用検索（アーカイブ含む）

### 3.3 Daily Todo Records API

**ファイル**: `app/api/daily-records/[recordId]/todos/route.ts`
- GET: 日次TODO達成記録取得
- POST: 日次TODO達成記録保存

---

## フェーズ4: UIコンポーネント

### 4.1 共通コンポーネント

**ファイル**: `components/todo/TodoCheckbox.tsx`
- 個別TODOのチェックボックス

**ファイル**: `components/todo/TodoLevelSection.tsx`
- レベル見出し＋配下TODO一覧

**ファイル**: `components/todo/OtherTodoSection.tsx`
- その他TODOセクション（追加用テキストボックス含む）

**ファイル**: `components/todo/TodoAutocomplete.tsx`
- オートコンプリート付きテキスト入力

**ファイル**: `components/todo/TodoList.tsx`
- TODO編集用リスト（追加/削除ボタン付き）

### 4.2 画面コンポーネント修正

**ファイル**: `app/onboarding/page.tsx`
- 各レベルをTODOリスト入力に変更
- 「+ TODOを追加」ボタン追加

**ファイル**: `app/record/RecordPageClient.tsx`
- ラジオボタン → TODOチェックリストに変更
- その他TODOセクション追加
- 達成レベル自動判定ロジック追加

**ファイル**: `app/goals/GoalsClient.tsx`
- TODOリスト編集UIに変更

**ファイル**: `app/day/[date]/page.tsx`
- 達成TODO一覧表示に変更

**ファイル**: `app/page.tsx` (ホーム)
- カードの学習内容サマリー → 達成TODO一覧に変更

---

## フェーズ5: データ移行

### 5.1 移行スクリプト

**ファイル**: `supabase/migrations/YYYYMMDDHHMMSS_migrate_existing_data.sql`

```sql
-- 1. 既存goals.descriptionをgoal_todosに移行
INSERT INTO goal_todos (goal_id, content, sort_order)
SELECT id, description, 0
FROM goals
WHERE description IS NOT NULL AND description != '';

-- 2. 既存daily_records.do_textをother_todosとdaily_todo_recordsに移行
-- （複雑なため、アプリケーション側でバッチ処理として実装する可能性あり）
```

**ファイル**: `scripts/migrate-do-text.ts`
- `do_text`を行ごとに分割して`other_todos`に登録
- 対応する`daily_todo_records`を作成

---

## 実装手順

### ステップ1: データベース準備
1. マイグレーションファイル作成
2. `npx supabase db push`でテーブル作成
3. 型定義再生成

### ステップ2: バックエンド実装
1. 型定義追加（types/index.ts）
2. DB関数追加（lib/db.ts）
3. API Routes作成

### ステップ3: UIコンポーネント作成
1. 共通コンポーネント作成
2. 初期目標設定画面（onboarding）修正
3. 記録画面（record）修正

### ステップ4: 既存画面修正
1. 目標編集画面修正
2. 日詳細画面修正
3. ホーム画面のカード表示修正

### ステップ5: データ移行
1. goals.description → goal_todos移行
2. daily_records.do_text → other_todos + daily_todo_records移行
3. 動作確認

### ステップ6: テスト・調整
1. 各画面の動作確認
2. エッジケース対応
3. パフォーマンス確認

---

## 変更が必要なファイル一覧

### 新規作成
- `supabase/migrations/YYYYMMDDHHMMSS_add_todo_tables.sql`
- `supabase/migrations/YYYYMMDDHHMMSS_modify_existing_tables.sql`
- `supabase/migrations/YYYYMMDDHHMMSS_add_rls_policies.sql`
- `supabase/migrations/YYYYMMDDHHMMSS_migrate_existing_data.sql`
- `app/api/goals/[goalId]/todos/route.ts`
- `app/api/goals/todos/route.ts`
- `app/api/other-todos/route.ts`
- `app/api/other-todos/[todoId]/route.ts`
- `app/api/other-todos/search/route.ts`
- `app/api/daily-records/[recordId]/todos/route.ts`
- `components/todo/TodoCheckbox.tsx`
- `components/todo/TodoLevelSection.tsx`
- `components/todo/OtherTodoSection.tsx`
- `components/todo/TodoAutocomplete.tsx`
- `components/todo/TodoList.tsx`
- `scripts/migrate-do-text.ts`

### 修正
- `types/index.ts`
- `lib/supabase/types.ts`（再生成）
- `lib/db.ts`
- `app/onboarding/page.tsx`
- `app/record/RecordPageClient.tsx`
- `app/goals/GoalsClient.tsx`
- `app/day/[date]/page.tsx`
- `app/page.tsx`
- `app/api/goals/initial/route.ts`
- `app/api/daily-records/route.ts`

---

## 想定される影響範囲

- 目標の登録・編集フロー
- 日報登録フロー
- ホーム画面のカード表示
- 日詳細画面の表示
- ストリーク計算ロジック（変更なし、achievement_levelベースのまま）
- 提案バナーロジック（変更なし）

---

## テスト方針

1. **単体テスト対象**
   - DB関数（getGoalTodos, createOtherTodo等）
   - 達成レベル自動判定ロジック

2. **統合テスト対象**
   - 初期目標設定フロー
   - 日報登録フロー
   - その他TODO追加/アーカイブフロー

3. **手動テスト対象**
   - UI/UXの確認
   - レスポンシブ対応
   - オートコンプリートの挙動

---

## 注意事項

- Server ComponentとClient Componentの境界を守る
- API Routes経由でのデータアクセスを徹底
- 既存のachievement_level判定ロジックは維持（後方互換性）
- データ移行は段階的に実施し、ロールバック可能な状態を保つ
