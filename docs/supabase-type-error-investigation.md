# Supabase型エラー調査ドキュメント

## 現在の状況

### 完了した作業

1. ✅ [lib/actions.ts](../lib/actions.ts) を作成し、Server Actionsとして実装
2. ✅ [app/goals/page.tsx](../app/goals/page.tsx) を修正し、Server Actionsを使用するように変更
3. ✅ [app/record/page.tsx](../app/record/page.tsx) を修正し、Server Actionsを使用するように変更
4. ✅ [components/history/TimelineContainer.tsx](../components/history/TimelineContainer.tsx) のJSX型エラーを修正

### 現在発生している型エラー

ビルド時に以下のエラーが発生しています：

```
./lib/actions.ts:63:13
Type error: Argument of type '{ description: string; updated_at: string; }'
is not assignable to parameter of type 'never'.
```

エラー箇所：
- ファイル: [lib/actions.ts:63](../lib/actions.ts#L63)
- 関数: `updateGoalAction`

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

## 問題の推測

### 根本原因: Supabaseクライアントの型推論の問題

Supabaseの型システムは、以下の流れで型を推論します：

1. `createClient()` が `Database` 型を持つSupabaseクライアントを返す
2. `.from('goals')` でテーブルを選択
3. `.update()` で更新データを渡す際、Supabaseは内部で型を推論
4. **問題**: `.eq()` チェーンの後に型推論が失敗し、`never`型になっている

### なぜ `never` 型になるのか

考えられる原因：

1. **Database型定義の問題**
   - [types/database.ts](../types/database.ts) の定義が不完全
   - Update型が正しく定義されていない可能性

2. **Supabase SSRライブラリのバージョン問題**
   - `@supabase/ssr` のバージョンが古い、または新しすぎて型定義に問題がある
   - Next.js 15/16との互換性の問題

3. **型推論の連鎖の問題**
   - `.from()` → `.update()` → `.eq()` → `.eq()` という連鎖の中で型が失われている
   - 特に複数の `.eq()` を使用すると型推論が壊れる可能性

## 調査すべきポイント

### 1. package.jsonの確認

**調査内容:**
- `@supabase/ssr` のバージョンを確認
- `@supabase/supabase-js` のバージョンを確認
- Next.jsのバージョンとの互換性を確認

**コマンド:**
```bash
npm list @supabase/ssr
npm list @supabase/supabase-js
```

**確認ファイル:**
- [package.json](../package.json)

### 2. Database型定義の確認

**調査内容:**
- [types/database.ts](../types/database.ts) の `Update` 型が正しく定義されているか
- 特に `goals` テーブルの `Update` 型を確認

**確認ポイント:**
```typescript
export interface Database {
  public: {
    Tables: {
      goals: {
        Row: { ... }
        Insert: { ... }
        Update: { ... }  // ← ここが正しく定義されているか
      }
    }
  }
}
```

### 3. 既存のdb.tsの実装との比較

**調査内容:**
- [lib/db.ts](../lib/db.ts) の `updateGoal` 関数の実装を確認
- なぜ [lib/db.ts](../lib/db.ts) ではエラーが出ないのかを調査

**比較すべき箇所:**
```typescript
// lib/db.ts の updateGoal
export async function updateGoal(
  level: GoalLevel,
  description: string,
  userId: string = DEFAULT_USER_ID
): Promise<Goal> {
  const supabase = await createClient();

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

  // ... 後続処理
}
```

**質問:**
- [lib/db.ts](../lib/db.ts) と [lib/actions.ts](../lib/actions.ts) で同じコードなのに、なぜエラーの有無が異なるのか？
- ファイルの場所や `'use server'` ディレクティブが型推論に影響しているのか？

### 4. TypeScript設定の確認

**調査内容:**
- [tsconfig.json](../tsconfig.json) の設定を確認
- `strict` モードやその他の型チェックオプションを確認

**確認ファイル:**
- [tsconfig.json](../tsconfig.json)

### 5. Supabase型生成の確認

**調査内容:**
- [types/database.ts](../types/database.ts) がSupabaseから正しく生成されているか
- 型定義が古くなっていないか

**再生成コマンド (もし設定されている場合):**
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

## 試すべき解決策

### 解決策1: 型アサーションを使用 (一時的な回避策)

**実装方法:**
```typescript
const { data, error } = await supabase
  .from('goals')
  .update({
    description,
    updated_at: new Date().toISOString(),
  } as Database['public']['Tables']['goals']['Update'])
  .eq('user_id', userId)
  .eq('level', level)
  .select()
  .single();
```

**状況:**
- 現在実装済みだが、エラーが解消されていない

### 解決策2: 明示的な型パラメータを使用

**実装方法:**
```typescript
const supabase = await createClient();
const goalsTable = supabase.from('goals');

const { data, error } = await goalsTable
  .update({
    description,
    updated_at: new Date().toISOString(),
  })
  .eq('user_id', userId)
  .eq('level', level)
  .select()
  .single();
```

### 解決策3: lib/db.tsの実装をそのまま使用

**理由:**
- [lib/db.ts](../lib/db.ts) では同じコードでエラーが出ていない
- Server Actions内で型推論の問題が発生している可能性

**実装方法:**
```typescript
// lib/actions.ts
'use server';

import {
  getGoals as dbGetGoals,
  updateGoal as dbUpdateGoal,
  createGoalHistorySlot as dbCreateGoalHistorySlot,
  // ... 他の関数
} from '@/lib/db';

export async function getGoalsAction(userId?: string) {
  return dbGetGoals(userId);
}

export async function updateGoalAction(
  level: GoalLevel,
  description: string,
  userId?: string
) {
  return dbUpdateGoal(level, description, userId);
}

// ... 他のラッパー関数
```

**メリット:**
- 既存の動作するコードを再利用
- Server Actionsは単なるラッパーとして機能
- 型エラーを回避できる

**デメリット:**
- やや冗長になる
- 二重のラッパー構造になる

### 解決策4: Supabaseライブラリのアップデート/ダウングレード

**調査内容:**
- 現在のバージョンを確認
- 既知の型推論の問題がないか確認
- 安定版へのダウングレードまたは最新版へのアップデートを検討

**コマンド:**
```bash
# 現在のバージョン確認
npm list @supabase/ssr @supabase/supabase-js

# 最新版へのアップデート
npm update @supabase/ssr @supabase/supabase-js

# または特定バージョンへのダウングレード
npm install @supabase/ssr@0.x.x @supabase/supabase-js@2.x.x
```

### 解決策5: TypeScript 5.x の設定調整

**調査内容:**
- `tsconfig.json` の `moduleResolution` オプション
- `verbatimModuleSyntax` オプションの影響

**試すべき設定:**
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": false,
    "skipLibCheck": true
  }
}
```

## 推奨アクション

### 優先度: 高

1. **[lib/db.ts](../lib/db.ts) の動作確認**
   - まず [lib/db.ts](../lib/db.ts) でビルドが通ることを確認
   - 同じコードなのに動作が異なる理由を特定

2. **解決策3の実装 (ラッパーアプローチ)**
   - 最も確実で迅速な解決方法
   - [lib/db.ts](../lib/db.ts) をラップするだけで済む

### 優先度: 中

3. **Supabaseライブラリのバージョン確認とアップデート**
   - 型推論の問題が既知のバグである可能性

4. **Database型定義の再生成**
   - 型定義が古くなっている可能性

### 優先度: 低

5. **TypeScript設定の調整**
   - 最終手段として検討

## 次のステップ

1. まず [lib/db.ts](../lib/db.ts) でビルドが通るか確認
   ```bash
   # lib/actions.ts を一時的にコメントアウトまたはリネーム
   mv lib/actions.ts lib/actions.ts.backup
   npm run build
   ```

2. もし [lib/db.ts](../lib/db.ts) でビルドが通る場合、**解決策3 (ラッパーアプローチ)** を採用

3. もし [lib/db.ts](../lib/db.ts) でもエラーが出る場合、Supabaseライブラリやデータベース型定義の問題を調査

## 参考情報

### 関連ファイル

- [lib/actions.ts](../lib/actions.ts) - 現在エラーが発生しているファイル
- [lib/db.ts](../lib/db.ts) - 既存の動作するデータベースアクセス層
- [lib/supabase/server.ts](../lib/supabase/server.ts) - Supabaseクライアント生成
- [types/database.ts](../types/database.ts) - Database型定義
- [types/index.ts](../types/index.ts) - アプリケーション型定義
- [app/goals/page.tsx](../app/goals/page.tsx) - Server Actionsを使用するClient Component
- [app/record/page.tsx](../app/record/page.tsx) - Server Actionsを使用するClient Component

### 既知の問題

- [implementation-plan-supabase-type-fix.md](implementation-plan-supabase-type-fix.md) - 当初の修正計画
- 元のエラー: `next/headers` をClient Componentからインポートしていた → **解決済み**
- 新しいエラー: Supabaseの `.update()` で型推論が `never` になる → **調査中**

## まとめ

現在の問題は、Server Actions内でSupabaseの型推論が失敗していることです。最も確実な解決策は、既存の [lib/db.ts](../lib/db.ts) をラップする形でServer Actionsを実装することです。これにより、型エラーを回避しつつ、Server Actionsのメリットを享受できます。
