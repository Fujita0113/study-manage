# lib/db.ts 型エラー修正計画書

## 作成日
2026-01-10

## 問題の概要

[lib/db.ts:36](../lib/db.ts#L36)の`getUserSettings`関数で型エラーが発生しています。

```
Type error: Property 'id' does not exist on type 'never'.
```

## 調査結果

### エラー発生箇所

**エラーが発生している関数:**
- `getUserSettings` ([lib/db.ts:23-40](../lib/db.ts#L23-L40))

**エラーが発生していない同様のパターンの関数:**
- `updateUserSettings` (61行目) - 同じテーブル、同じパターン
- `updateGoal` (139行目) - `.single()`と`data.id`にアクセス
- `getStreak` (305行目) - `.single()`と`data.id`にアクセス
- その他多数の関数

### 原因分析

1. **型定義は正しい**
   - [types/database.ts](../types/database.ts)で`user_settings.Row`は正しく定義されている
   - `id: string`, `created_at: string`, `updated_at: string`

2. **Supabaseクライアントも正しく型付けされている**
   - [lib/supabase/server.ts](../lib/supabase/server.ts)で`createServerClient<Database>`で型を指定

3. **TypeScriptコンパイラの型推論の問題**
   - 同じパターンのコードが他の場所では正常に動作
   - `getUserSettings`関数でのみ型推論が失敗し、`data`が`never`型に退化
   - これはTypeScriptの既知の問題で、特定の条件下で型推論が失敗することがある

## 修正方針

### 採用する方法: Database型を明示的に使用

**理由:**
1. 型安全性を維持できる
2. 明示的で理解しやすい
3. 将来的な保守性が高い
4. 他の関数でも同じパターンを適用できる

### 実装方法

```typescript
import type { Database } from '@/types/database';

type UserSettingsRow = Database['public']['Tables']['user_settings']['Row'];

export async function getUserSettings(userId: string = DEFAULT_USER_ID): Promise<UserSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('User settings not found');

  const row = data as UserSettingsRow;
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
```

## 修正手順

1. [lib/db.ts](../lib/db.ts)の冒頭にDatabase型のimportを追加（既に存在する場合はスキップ）
2. `UserSettingsRow`型エイリアスを定義
3. `getUserSettings`関数内で`data`を`UserSettingsRow`型にキャスト
4. ビルドして型エラーが解消されることを確認

## 影響範囲

- **修正対象**: [lib/db.ts:23-40](../lib/db.ts#L23-L40)の`getUserSettings`関数のみ
- **影響するファイル**: なし（内部実装の変更のみ）
- **動作への影響**: なし（型アサーションのみの変更）

## 検証方法

1. `npm run build`を実行
2. 型エラーが解消されることを確認
3. アプリケーションが正常に起動することを確認
4. ユーザー設定の取得が正常に動作することを確認

## 将来の対応

### 他の関数で同じ問題が発生した場合

同じパターンで修正できます：

1. 該当するテーブルのRow型を型エイリアスとして定義
2. `data`を明示的にキャスト

### 根本的な解決

Supabase型生成ツール（`supabase gen types typescript`）を使用して、型定義を最新の状態に保つことで、型推論の問題を最小限に抑えることができます。

## 備考

- この問題は[lib/actions.ts](../lib/actions.ts)のラッパー化とは無関係
- TypeScriptコンパイラのバージョンアップで改善される可能性がある
- 他の関数では同じパターンでエラーが発生していないため、予防的な修正は不要

---

**ステータス:** 修正準備完了
**次のアクション:** [lib/db.ts](../lib/db.ts)の修正実装
