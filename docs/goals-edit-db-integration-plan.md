# 目標編集画面のDB連携実装計画

## 作業の目的と概要

`/goals?edit=xxx` 画面で目標を編集した際に、実際にDBに反映されるようにする実装を行います。現在はモックデータを使用していますが、Supabaseのデータベースに実際に保存・更新されるように変更します。

## 使用する主要モジュールとバージョン

### 依存関係 (package.jsonから確認済み)

```json
{
  "@supabase/ssr": "^0.8.0",
  "@supabase/supabase-js": "^2.90.1",
  "next": "16.1.1",
  "react": "19.2.3"
}
```

### 依存関係で注意すべき点

- **Next.js 16.1.1**: Server Componentsとsearchparamsの非同期化に対応済み
- **Supabase SSR**: サーバーサイドでのクライアント作成に`createClient()`を使用
- **React 19.2.3**: 最新版、特に互換性の問題はなし

## 現状分析

### 既存の実装状況

1. **ホーム画面 ([app/page.tsx](../app/page.tsx))**
   - `getDailyRecords()` → Supabase統合済み✅
   - `getSuggestion()` → モックデータ使用（Supabaseから取得した記録を使用して提案判定）

2. **記録画面 ([app/record/page.tsx](../app/record/page.tsx))**
   - API経由で`/api/daily-records`にPOST → Supabase統合済み✅

3. **目標編集画面 ([app/goals/page.tsx](../app/goals/page.tsx), [app/goals/GoalsClient.tsx](../app/goals/GoalsClient.tsx))**
   - `getGoals()` → モックデータ❌
   - API経由で`/api/goals`にPUT → モックデータで動作中❌

### 未実装の箇所

- [lib/db.ts](../lib/db.ts)の以下の関数がモックデータを返している:
  - `getGoals()` (68行目)
  - `getGoalByLevel()` (72行目)
  - `updateGoal()` (79行目)
  - `createGoalHistorySlot()` (294行目)
  - `endGoalHistorySlot()` (330行目)

## 実装手順

### Step 1: Supabaseテーブル確認・作成

**変更ファイル**: なし（Supabase管理画面またはマイグレーションファイル）

[docs/data-model.md](./data-model.md)に基づいて、以下のテーブルが存在するか確認:

```sql
-- Goalsテーブル
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('bronze', 'silver', 'gold')),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, level)
);

-- Goal History Slotsテーブル（新規作成の可能性あり）
CREATE TABLE IF NOT EXISTS goal_history_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bronze_goal TEXT NOT NULL,
  silver_goal TEXT NOT NULL,
  gold_goal TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  change_reason TEXT NOT NULL CHECK (change_reason IN ('bronze_14days', 'silver_14days', 'gold_14days', '7days_4fails', 'initial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_atの自動更新トリガー
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_history_slots_updated_at
BEFORE UPDATE ON goal_history_slots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 2: Supabase型定義の生成・更新

**変更ファイル**: [lib/supabase/types.ts](../lib/supabase/types.ts)

Supabase CLIを使って型定義を再生成:

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > lib/supabase/types.ts
```

生成された型に以下が含まれているか確認:
- `goals` テーブル
- `goal_history_slots` テーブル

### Step 3: lib/db.tsのGoal関連関数をSupabase統合

**変更ファイル**: [lib/db.ts](../lib/db.ts)

#### 3-1. 型定義の追加

```typescript
// Supabaseのgoalsテーブルの型
type GoalRow = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];

// Supabaseのgoal_history_slotsテーブルの型
type GoalHistorySlotRow = Database['public']['Tables']['goal_history_slots']['Row'];
type GoalHistorySlotInsert = Database['public']['Tables']['goal_history_slots']['Insert'];
type GoalHistorySlotUpdate = Database['public']['Tables']['goal_history_slots']['Update'];
```

#### 3-2. 型変換ヘルパー関数の追加

```typescript
/**
 * Supabaseのsnake_case形式をTypeScriptのcamelCase形式に変換
 */
function toGoal(dbGoal: GoalRow): Goal {
  return {
    id: dbGoal.id,
    userId: dbGoal.user_id,
    level: dbGoal.level as GoalLevel,
    description: dbGoal.description,
    createdAt: new Date(dbGoal.created_at),
    updatedAt: new Date(dbGoal.updated_at),
  };
}

function toGoalHistorySlot(dbSlot: GoalHistorySlotRow): GoalHistorySlot {
  return {
    id: dbSlot.id,
    userId: dbSlot.user_id,
    bronzeGoal: dbSlot.bronze_goal,
    silverGoal: dbSlot.silver_goal,
    goldGoal: dbSlot.gold_goal,
    startDate: dbSlot.start_date,
    endDate: dbSlot.end_date || undefined,
    changeReason: dbSlot.change_reason as GoalChangeReason,
    createdAt: new Date(dbSlot.created_at),
    updatedAt: new Date(dbSlot.updated_at),
  };
}
```

#### 3-3. getGoals()の実装 (68行目)

```typescript
export async function getGoals(userId: string = MOCK_USER_ID): Promise<Goal[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('level', { ascending: true }); // bronze, silver, gold の順

  if (error) {
    console.error('Failed to fetch goals:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    return [];
  }

  return (data || []).map(toGoal);
}
```

#### 3-4. getGoalByLevel()の実装 (72行目)

```typescript
export async function getGoalByLevel(
  level: GoalLevel,
  userId: string = MOCK_USER_ID
): Promise<Goal | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('level', level)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch goal by level:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    console.error('Level:', level);
    return null;
  }

  return data ? toGoal(data) : null;
}
```

#### 3-5. updateGoal()の実装 (79行目)

```typescript
export async function updateGoal(
  level: GoalLevel,
  description: string,
  userId: string = MOCK_USER_ID
): Promise<Goal> {
  const supabase = await createClient();

  const updateData: GoalUpdate = {
    description,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('user_id', userId)
    .eq('level', level)
    .select()
    .single();

  if (error) {
    console.error('Failed to update goal:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    console.error('Level:', level);
    console.error('Description:', description);
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  return toGoal(data);
}
```

#### 3-6. createGoalHistorySlot()の実装 (294行目)

```typescript
export async function createGoalHistorySlot(
  bronzeGoal: string,
  silverGoal: string,
  goldGoal: string,
  changeReason: GoalChangeReason,
  userId: string = MOCK_USER_ID
): Promise<GoalHistorySlot> {
  const supabase = await createClient();

  // 1. 現在進行中のスロットを終了させる
  const currentSlot = await getCurrentGoalSlot(userId);
  if (currentSlot) {
    await endGoalHistorySlot(currentSlot.id);
  }

  // 2. 新しいスロットを作成
  const today = new Date().toISOString().split('T')[0];

  const insertData: GoalHistorySlotInsert = {
    user_id: userId,
    bronze_goal: bronzeGoal,
    silver_goal: silverGoal,
    gold_goal: goldGoal,
    start_date: today,
    end_date: null,
    change_reason: changeReason,
  };

  const { data, error } = await supabase
    .from('goal_history_slots')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Failed to create goal history slot:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Insert data:', insertData);
    throw new Error(`Failed to create goal history slot: ${error.message}`);
  }

  return toGoalHistorySlot(data);
}
```

#### 3-7. endGoalHistorySlot()の実装 (330行目)

```typescript
export async function endGoalHistorySlot(
  slotId: string
): Promise<GoalHistorySlot> {
  const supabase = await createClient();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const endDate = yesterday.toISOString().split('T')[0];

  const updateData: GoalHistorySlotUpdate = {
    end_date: endDate,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('goal_history_slots')
    .update(updateData)
    .eq('id', slotId)
    .select()
    .single();

  if (error) {
    console.error('Failed to end goal history slot:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Slot ID:', slotId);
    throw new Error(`Failed to end goal history slot: ${error.message}`);
  }

  return toGoalHistorySlot(data);
}
```

#### 3-8. getGoalHistorySlots()の実装 (272行目)

```typescript
export async function getGoalHistorySlots(
  userId: string = MOCK_USER_ID
): Promise<GoalHistorySlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goal_history_slots')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false }); // 新しい順

  if (error) {
    console.error('Failed to fetch goal history slots:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    return [];
  }

  return (data || []).map(toGoalHistorySlot);
}
```

### Step 4: モックデータのインポート削除

**変更ファイル**: [lib/db.ts](../lib/db.ts)

以下のモックデータのインポートを削除（使用していないものを削除）:

```typescript
// 削除対象
import { mockGoals, mockGoalHistorySlots } from './mockData';
```

**注意**: `mockUserSettings`, `mockDailyRecords`, `mockStreak`は他の未実装関数で使用しているため、まだ削除しない。

### Step 5: 初期データ投入用のヘルパー関数追加（オプション）

**変更ファイル**: [lib/db.ts](../lib/db.ts)

新規ユーザー向けに初期目標を作成する関数を追加:

```typescript
/**
 * 初期目標を作成する（初回ユーザー登録時のみ使用）
 */
export async function createInitialGoals(
  userId: string,
  bronzeDesc: string = '30分だけプログラミングする',
  silverDesc: string = '1つの機能を完成させる',
  goldDesc: string = 'リファクタリングまで完了させる'
): Promise<Goal[]> {
  const supabase = await createClient();

  const goalsToCreate: GoalInsert[] = [
    { user_id: userId, level: 'bronze', description: bronzeDesc },
    { user_id: userId, level: 'silver', description: silverDesc },
    { user_id: userId, level: 'gold', description: goldDesc },
  ];

  const { data, error } = await supabase
    .from('goals')
    .insert(goalsToCreate)
    .select();

  if (error) {
    console.error('Failed to create initial goals:', error);
    throw new Error(`Failed to create initial goals: ${error.message}`);
  }

  // 初回の目標履歴スロットも作成
  await createGoalHistorySlot(bronzeDesc, silverDesc, goldDesc, 'initial', userId);

  return (data || []).map(toGoal);
}
```

### Step 6: 動作確認とテスト

**テスト手順**:

1. **Supabaseテーブルの確認**
   ```bash
   npx supabase db pull
   ```

2. **型定義の再生成**
   ```bash
   npx supabase gen types typescript --project-id <PROJECT_ID> > lib/supabase/types.ts
   ```

3. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

4. **手動テスト**:
   - `/goals?edit=bronze`にアクセス
   - Bronze目標を編集して「更新する」ボタンをクリック
   - Supabase管理画面で`goals`テーブルを確認
   - `goal_history_slots`テーブルにレコードが作成されているか確認

5. **エッジケーステスト**:
   - 初回ユーザー（目標が存在しない場合）の動作確認
   - 空文字列を入力した場合のバリデーション確認
   - 500文字を超える文字列を入力した場合の動作確認

## 想定される影響範囲

### 直接影響を受けるファイル

1. [lib/db.ts](../lib/db.ts) - Goal関連関数の実装変更
2. [lib/supabase/types.ts](../lib/supabase/types.ts) - 型定義の再生成

### 間接的に影響を受けるファイル

1. [app/goals/page.tsx](../app/goals/page.tsx) - `getGoals()`の呼び出し（動作は変わらない）
2. [app/goals/GoalsClient.tsx](../app/goals/GoalsClient.tsx) - APIからのレスポンス（動作は変わらない）
3. [app/api/goals/route.ts](../app/api/goals/route.ts) - `updateGoal()`と`createGoalHistorySlot()`の呼び出し（動作は変わらない）

## テスト方針

### 単体テスト（将来的に実装）

- `toGoal()`の型変換が正しいか
- `toGoalHistorySlot()`の型変換が正しいか
- `createGoalHistorySlot()`で既存スロットが正しく終了するか

### 統合テスト（手動実施）

- 目標編集→保存→再読み込みで反映されているか
- 提案バナー経由での編集権限が正しく機能するか
- 目標履歴スロットが正しく作成されるか

## リスクと対策

### リスク1: Supabaseテーブルが存在しない

**対策**: Step 1でテーブル作成SQLを実行し、存在を確認する

### リスク2: 型定義が古い

**対策**: Step 2でSupabase CLIを使って型定義を再生成する

### リスク3: 初回ユーザーが目標を持っていない

**対策**: Step 5の`createInitialGoals()`関数を実装し、初回アクセス時に呼び出すロジックを追加する

### リスク4: 目標履歴スロットの作成に失敗

**対策**: トランザクション処理を検討（Supabaseではトランザクションが限定的なため、エラーハンドリングで対応）

## 補足事項

- 本実装では、目標の編集と履歴スロットの作成を同時に行いますが、トランザクション処理は使用しません（Supabaseの制約）
- エラーが発生した場合は、コンソールログに詳細を出力し、ユーザーにはエラーメッセージを表示します
- 初回ユーザー向けの目標作成ロジックは、今回のスコープ外ですが、後で追加する必要があります

## 実装後の確認事項

- [ ] `goals`テーブルにレコードが正しく保存されるか
- [ ] `goal_history_slots`テーブルにレコードが正しく保存されるか
- [ ] 既存スロットの`end_date`が正しく更新されるか
- [ ] 目標編集画面で編集した内容が、再読み込み後も反映されているか
- [ ] エラー発生時に適切なエラーメッセージが表示されるか
