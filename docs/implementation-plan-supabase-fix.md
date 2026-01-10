# Supabase型エラー修正計画

## 調査結果のまとめ

### 1. 環境情報

**パッケージバージョン:**
- `@supabase/ssr`: `^0.8.0`
- `@supabase/supabase-js`: `^2.90.1`
- `next`: `16.1.1`
- `typescript`: `^5`

**TypeScript設定:**
- `strict`: `true`
- `moduleResolution`: `"bundler"`
- `skipLibCheck`: `true`

### 2. 発生している型エラー

**エラー箇所:** [lib/actions.ts:62](../lib/actions.ts#L62)

```
Type error: Argument of type '{ description: string; updated_at: string; }'
is not assignable to parameter of type 'never'.
```

**エラーが発生するコード:**
```typescript
const { data, error } = await supabase
  .from('goals')
  .update({
    description,
    updated_at: new Date().toISOString(),
  })
  .eq('user_id', userId)
  .eq('level', level)
  .select()
  .single();
```

### 3. 根本原因の特定

#### なぜ`lib/db.ts`ではエラーが出ないのか？

[lib/db.ts:124-133](../lib/db.ts#L124-L133)では**全く同じコード**が使われていますが、型エラーは発生していません。

**比較分析:**

| 項目 | lib/db.ts | lib/actions.ts |
|------|-----------|----------------|
| ファイル指定 | なし | `'use server'` ディレクティブ |
| 関数のexport | `export async function` | `export async function` |
| createClient呼び出し | `await createClient()` | `await createClient()` |
| コード内容 | 完全に同一 | 完全に同一 |
| 型エラー | **発生しない** | **発生する** |

#### 核心的な問題

**`'use server'`ディレクティブの存在により、TypeScriptの型推論が異なる動作をしている可能性が高い。**

- Next.js 16の`'use server'`は、関数をServer Actionsとしてマークします
- TypeScriptコンパイラは、Server Actionsファイルを特別に扱う可能性があります
- Supabaseクライアントの型推論が、Server Actionsコンテキストで失敗しています

具体的には:
1. `.from('goals')` → 正しく型推論される
2. `.update({...})` → ここまでは正しい
3. `.eq('user_id', userId)` → 1つ目のフィルタ
4. `.eq('level', level)` → **2つ目のフィルタで型が`never`に退化**
5. `.select()` → エラー発生

### 4. Database型定義の確認

[types/database.ts:46-53](../types/database.ts#L46-L53)を確認したところ、`goals`テーブルの`Update`型は正しく定義されています：

```typescript
Update: {
  id?: string
  user_id?: string
  level?: 'bronze' | 'silver' | 'gold'
  description?: string
  created_at?: string
  updated_at?: string
}
```

型定義自体には問題ありません。

### 5. 他の解決策の検討と却下理由

#### ❌ 解決策1: 型アサーションを使用

```typescript
.update({
  description,
  updated_at: new Date().toISOString(),
} as Database['public']['Tables']['goals']['Update'])
```

**却下理由:** 既に試したが効果がなかった（調査ドキュメントより）

#### ❌ 解決策2: 明示的な型パラメータ

```typescript
const goalsTable = supabase.from('goals');
```

**却下理由:** 根本的な解決にならず、コードが冗長になる

#### ❌ 解決策4: Supabaseライブラリのアップデート/ダウングレード

**却下理由:**
- 現在のバージョンは最新に近い
- `lib/db.ts`では問題なく動作している
- 既知のバグではない

#### ❌ 解決策5: TypeScript設定の調整

**却下理由:**
- `skipLibCheck: true`は既に設定済み
- 既存の設定は適切
- `lib/db.ts`で動作していることから、設定の問題ではない

---

## 採用する解決策

### ✅ 解決策3: lib/db.tsをラップする方式

**理由:**
1. **最も確実**: `lib/db.ts`では型エラーが発生しないことを確認済み
2. **迅速に実装可能**: 既存の動作するコードを再利用
3. **メンテナンス性**: データベースロジックが`lib/db.ts`に集約される
4. **安全性**: 型安全性を保ちつつ、実装を進められる

**実装方針:**
- `lib/actions.ts`をServer Actionsのラッパー層として機能させる
- 実際のデータベース操作は`lib/db.ts`の関数を呼び出す
- Server Actionsとしてのインターフェースは維持

---

## 実装計画

### 手順1: lib/actions.tsを修正

**修正箇所:**
- `updateGoalAction` 関数
- `endGoalHistorySlot` 関数（内部関数）
- 他の型エラーが発生している可能性のある関数

**修正方法:**
```typescript
// Before (エラーが発生)
export async function updateGoalAction(
  level: GoalLevel,
  description: string,
  userId: string = DEFAULT_USER_ID
): Promise<Goal> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .update({ description, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('level', level)
    .select()
    .single();

  // ... エラーハンドリングとマッピング
}

// After (ラッパー方式)
export async function updateGoalAction(
  level: GoalLevel,
  description: string,
  userId: string = DEFAULT_USER_ID
): Promise<Goal> {
  return updateGoal(level, description, userId);
}
```

### 手順2: importを追加

[lib/actions.ts](../lib/actions.ts)の先頭に以下を追加：

```typescript
import {
  getGoals,
  updateGoal,
  getDailyRecordByDate,
  createDailyRecord,
  getCurrentGoalSlot,
  endGoalHistorySlot as dbEndGoalHistorySlot,
  createGoalHistorySlot,
} from '@/lib/db';
```

### 手順3: 不要なコードを削除

以下の型定義は不要になるため削除：
- `type GoalRow = Database['public']['Tables']['goals']['Row'];`
- `type GoalUpdate = Database['public']['Tables']['goals']['Update'];`
- `type DailyRecordRow = ...`
- 他の使われていない型定義

### 手順4: 各関数を修正

#### 4.1 `getGoalsAction`

```typescript
export async function getGoalsAction(userId: string = DEFAULT_USER_ID): Promise<Goal[]> {
  return getGoals(userId);
}
```

#### 4.2 `updateGoalAction`

```typescript
export async function updateGoalAction(
  level: GoalLevel,
  description: string,
  userId: string = DEFAULT_USER_ID
): Promise<Goal> {
  return updateGoal(level, description, userId);
}
```

#### 4.3 `getDailyRecordByDateAction`

```typescript
export async function getDailyRecordByDateAction(
  date: string,
  userId: string = DEFAULT_USER_ID
): Promise<DailyRecord | null> {
  return getDailyRecordByDate(date, userId);
}
```

#### 4.4 `createDailyRecordAction`

```typescript
export async function createDailyRecordAction(
  recordData: Omit<DailyRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string = DEFAULT_USER_ID
): Promise<DailyRecord> {
  return createDailyRecord(recordData, userId);
}
```

#### 4.5 `getCurrentGoalSlotAction`

```typescript
export async function getCurrentGoalSlotAction(
  userId: string = DEFAULT_USER_ID
): Promise<GoalHistorySlot | null> {
  return getCurrentGoalSlot(userId);
}
```

#### 4.6 `endGoalHistorySlot` (内部関数)

```typescript
async function endGoalHistorySlot(slotId: string): Promise<GoalHistorySlot> {
  return dbEndGoalHistorySlot(slotId);
}
```

#### 4.7 `createGoalHistorySlotAction`

```typescript
export async function createGoalHistorySlotAction(
  bronzeGoal: string,
  silverGoal: string,
  goldGoal: string,
  changeReason: GoalChangeReason,
  userId: string = DEFAULT_USER_ID
): Promise<GoalHistorySlot> {
  // 現在進行中のスロットの終了とスロット作成は lib/db.ts で処理される
  return createGoalHistorySlot(bronzeGoal, silverGoal, goldGoal, changeReason, userId);
}
```

**注意:** `createGoalHistorySlotAction`内の手動スロット終了処理は削除します。`createGoalHistorySlot`関数内で既に処理されています。

### 手順5: ビルドして確認

```bash
npm run build
```

すべての型エラーが解消されることを確認します。

---

## 修正後の[lib/actions.ts](../lib/actions.ts)の全体像

```typescript
/**
 * Server Actions
 * Client Componentから呼び出されるデータベース操作
 * lib/db.tsのラッパーとして機能
 */

'use server';

import {
  getGoals,
  updateGoal,
  getDailyRecordByDate,
  createDailyRecord,
  getCurrentGoalSlot,
  endGoalHistorySlot as dbEndGoalHistorySlot,
  createGoalHistorySlot,
} from '@/lib/db';

import type {
  Goal,
  GoalLevel,
  GoalChangeReason,
  DailyRecord,
  GoalHistorySlot,
} from '@/types';

// デバッグ用: ユーザーIDを固定
const DEFAULT_USER_ID = 'test-user-001';

// ==================== Goals ====================

export async function getGoalsAction(userId: string = DEFAULT_USER_ID): Promise<Goal[]> {
  return getGoals(userId);
}

export async function updateGoalAction(
  level: GoalLevel,
  description: string,
  userId: string = DEFAULT_USER_ID
): Promise<Goal> {
  return updateGoal(level, description, userId);
}

// ==================== Daily Records ====================

export async function getDailyRecordByDateAction(
  date: string,
  userId: string = DEFAULT_USER_ID
): Promise<DailyRecord | null> {
  return getDailyRecordByDate(date, userId);
}

export async function createDailyRecordAction(
  recordData: Omit<DailyRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string = DEFAULT_USER_ID
): Promise<DailyRecord> {
  return createDailyRecord(recordData, userId);
}

// ==================== Goal History Slots ====================

/**
 * 現在進行中のスロットを取得
 */
export async function getCurrentGoalSlotAction(
  userId: string = DEFAULT_USER_ID
): Promise<GoalHistorySlot | null> {
  return getCurrentGoalSlot(userId);
}

/**
 * スロットを終了させる（endDateを設定）
 * 内部でのみ使用
 */
async function endGoalHistorySlot(slotId: string): Promise<GoalHistorySlot> {
  return dbEndGoalHistorySlot(slotId);
}

/**
 * 新しい目標履歴スロットを作成
 * 同時に、現在進行中のスロットを終了させる
 */
export async function createGoalHistorySlotAction(
  bronzeGoal: string,
  silverGoal: string,
  goldGoal: string,
  changeReason: GoalChangeReason,
  userId: string = DEFAULT_USER_ID
): Promise<GoalHistorySlot> {
  return createGoalHistorySlot(bronzeGoal, silverGoal, goldGoal, changeReason, userId);
}
```

---

## メリットとデメリット

### メリット

1. **型安全性を確保**
   - `lib/db.ts`で正しく型推論されるため、型エラーが発生しない

2. **明確な責務分離**
   - `lib/db.ts`: データベースアクセス層
   - `lib/actions.ts`: Server Actionsラッパー層（Client Component用インターフェース）

3. **メンテナンス性向上**
   - データベースロジックが一箇所に集約
   - 将来的な変更も`lib/db.ts`のみを修正すれば良い

4. **迅速な実装**
   - 既存のコードを再利用できる
   - 型アサーションやワークアラウンドが不要

5. **デバッグが容易**
   - スタックトレースが明確
   - 問題の切り分けが簡単

### デメリット

1. **若干の冗長性**
   - ラッパー関数が追加される
   - 関数呼び出しが1層増える

2. **パフォーマンスの微小な低下**
   - 実際には無視できるレベル（関数呼び出しのオーバーヘッドのみ）

---

## 今後の方針

### この問題の原因究明について

今回の型エラーは、以下の組み合わせで発生していると推測されます：

1. Next.js 16の`'use server'`ディレクティブ
2. TypeScript 5の型推論
3. Supabase SSR v0.8.0の型システム
4. 複数の`.eq()`チェーンでの型の退化

**将来的に:**
- Supabaseや Next.jsのアップデートで解決される可能性がある
- その際は、ラッパー方式から直接呼び出しに戻すことも検討できる
- しかし、現在の実装（責務分離）は設計としても合理的なため、そのまま維持する選択肢もある

### 同様の問題が発生した場合

他のファイルでも`'use server'`を使用し、Supabaseの型エラーが発生した場合は、同じラッパーアプローチを採用します。

---

## 実装チェックリスト

- [ ] [lib/actions.ts](../lib/actions.ts)をバックアップ
- [ ] 不要な型定義を削除
- [ ] `lib/db`からの関数をimport
- [ ] `getGoalsAction`をラッパー化
- [ ] `updateGoalAction`をラッパー化
- [ ] `getDailyRecordByDateAction`をラッパー化
- [ ] `createDailyRecordAction`をラッパー化
- [ ] `getCurrentGoalSlotAction`をラッパー化
- [ ] 内部関数`endGoalHistorySlot`をラッパー化
- [ ] `createGoalHistorySlotAction`をラッパー化（内部のスロット終了処理を削除）
- [ ] `npm run build`でビルド成功を確認
- [ ] 各画面で動作確認
  - [ ] [app/goals/page.tsx](../app/goals/page.tsx) - 目標更新機能
  - [ ] [app/record/page.tsx](../app/record/page.tsx) - 記録作成機能
  - [ ] 目標変遷機能（今後実装予定）

---

## まとめ

Supabaseの型エラーは、`'use server'`ディレクティブとの組み合わせで発生する複雑な型推論の問題です。最も確実で保守性の高い解決策として、**lib/db.tsをラップする方式**を採用します。

この実装により:
- ✅ 型エラーが完全に解消される
- ✅ コードの責務分離が明確になる
- ✅ 将来的なメンテナンスが容易になる
- ✅ 既存の動作を維持できる

実装後、すべての機能が正常に動作することを確認します。
