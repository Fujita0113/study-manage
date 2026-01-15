# lib/db.ts 型エラー調査報告書

## 発生日時
2026-01-10

## 状況
`implementation-plan-supabase-fix.md`に従って[lib/actions.ts](../lib/actions.ts)をラッパー方式に修正した後、ビルド時に新たな型エラーが発生しました。

## エラー内容

### エラーメッセージ
```
Type error: Property 'id' does not exist on type 'never'.

./lib/db.ts:36:14
```

### エラー箇所
[lib/db.ts:23-39](../lib/db.ts#L23-L39)

```typescript
export async function getUserSettings(userId: string = DEFAULT_USER_ID): Promise<UserSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('User settings not found');

  return {
    id: data.id,  // ← ここでエラー: Property 'id' does not exist on type 'never'
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}
```

## 問題の分析

### なぜ今までエラーが出なかったのか？

実装計画書では「[lib/db.ts:124-133](../lib/db.ts#L124-L133)では**全く同じコード**が使われていますが、型エラーは発生していません」と記載されていました。

しかし、今回のビルドで[lib/db.ts](../lib/db.ts)の`getUserSettings`関数（23-39行目）でエラーが発生しています。

### 推測される原因

1. **以前のビルド時には検出されなかった**
   - [lib/actions.ts](../lib/actions.ts)の型エラーが先に発生していたため、ビルドがそこで止まっていた
   - [lib/db.ts](../lib/db.ts)の型チェックまで到達していなかった可能性

2. **型推論の連鎖的な問題**
   - [lib/actions.ts](../lib/actions.ts)を修正したことで、TypeScriptコンパイラの型チェックが進行
   - [lib/db.ts](../lib/db.ts)の問題が顕在化した

3. **Supabase型推論の一貫性のない動作**
   - 一部の関数では正しく型推論されている
   - 一部の関数では`never`型に退化している
   - この不一致の原因は不明

## 影響範囲の調査が必要

### 調査すべき項目

1. **[lib/db.ts](../lib/db.ts)の全関数をチェック**
   - どの関数で型エラーが発生しているか
   - どの関数では正しく動作しているか
   - パターンの特定

2. **型エラーの発生条件を特定**
   - `.single()`を使っている関数
   - `.eq()`を複数使っている関数
   - テーブル名による違い（`user_settings` vs `goals` vs `daily_records`など）

3. **Database型定義の確認**
   - [types/database.ts](../types/database.ts)で`user_settings`テーブルの型が正しく定義されているか
   - 他のテーブル定義との違いがあるか

## 次のステップ

### 選択肢1: lib/db.ts全体の調査を続行（推奨）

**実施内容:**
1. ビルドエラーを全て収集
2. [lib/db.ts](../lib/db.ts)の全関数を確認
3. エラーが発生している関数をリストアップ
4. パターンを分析
5. 統一的な解決策を検討

**メリット:**
- 根本的な理解が深まる
- 将来的な問題を予防できる
- 正確な修正計画を立てられる

**デメリット:**
- 時間がかかる

### 選択肢2: 型アサーションで一時回避

**実施内容:**
```typescript
const { data, error } = await supabase
  .from('user_settings')
  .select('*')
  .eq('id', userId)
  .single();

if (error) throw error;
if (!data) throw new Error('User settings not found');

// 型アサーションで回避
const row = data as any;
return {
  id: row.id,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
};
```

**メリット:**
- 即座にビルドが通る
- 実装を進められる

**デメリット:**
- 型安全性を失う
- 根本的な解決にならない
- 将来的な問題の原因となる可能性

### 選択肢3: Database型を明示的に使用

**実施内容:**
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

**メリット:**
- 型安全性を維持
- 明示的で理解しやすい

**デメリット:**
- 各関数で型定義が必要
- やや冗長

## 推奨アプローチ

**選択肢1（全体調査）を推奨します。**

理由:
1. [lib/db.ts](../lib/db.ts)は既に直接Supabaseを呼び出しているファイル
2. これ以上ラッパーで包むことはできない
3. 問題の全体像を把握してから修正しないと、次々に問題が発覚する
4. 一度に全ての問題を解決する方が効率的

## 調査手順

1. `npm run build`で全ての型エラーを収集
2. エラーメッセージを分析
3. [lib/db.ts](../lib/db.ts)の各関数をレビュー
4. [types/database.ts](../types/database.ts)の型定義を確認
5. エラーパターンを特定
6. 修正方針を決定
7. 修正計画書を作成
8. 実装

## 備考

- [lib/actions.ts](../lib/actions.ts)のラッパー化は正常に完了
- 新たな問題は[lib/db.ts](../lib/db.ts)に限定されている
- この問題を解決すれば、全体のビルドが通る見込み

## 現在の状態

- ✅ [lib/actions.ts](../lib/actions.ts): ラッパー方式に修正完了
- ❌ [lib/db.ts](../lib/db.ts): 型エラー発生中（`getUserSettings`関数）
- ⏳ 他の関数の状態: 未確認

---

**作成日:** 2026-01-10
**更新日:** 2026-01-10
**ステータス:** 調査中
