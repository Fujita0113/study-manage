# Supabase型エラー修正計画

## 問題の概要

現在、プロジェクトのビルド時に以下の型エラーが発生しています：

```
Error: Turbopack build failed with 1 errors:
./lib/supabase/server.ts:2:1
Ecmascript file had an error

You're importing a component that needs "next/headers".
That only works in a Server Component which is not supported in the pages/ directory.
```

### エラーの原因

1. **Client ComponentからServer Component専用のコードをインポート**
   - [app/goals/page.tsx](app/goals/page.tsx) は`'use client'`ディレクティブを使用しているClient Component
   - このページが [lib/db.ts](lib/db.ts) をインポート
   - [lib/db.ts](lib/db.ts) が [lib/supabase/server.ts](lib/supabase/server.ts) をインポート
   - [lib/supabase/server.ts](lib/supabase/server.ts) は`next/headers`を使用しており、Server Component専用

2. **混在するレンダリング環境**
   - [app/page.tsx](app/page.tsx): Server Component（非同期関数）
   - [app/goals/page.tsx](app/goals/page.tsx): Client Component（`'use client'`）
   - 両方が同じ [lib/db.ts](lib/db.ts) をインポートしているが、[lib/db.ts](lib/db.ts) はServer Component専用の実装になっている

### 影響範囲

#### Server Componentのページ（問題なし）
- [app/page.tsx](app/page.tsx): `async`関数、Server Component
- その他の確認が必要なページ:
  - [app/calendar/page.tsx](app/calendar/page.tsx)
  - [app/day/[date]/page.tsx](app/day/%5Bdate%5D/page.tsx)
  - [app/history/page.tsx](app/history/page.tsx)
  - [app/record/page.tsx](app/record/page.tsx)
  - [app/settings/page.tsx](app/settings/page.tsx)

#### Client Componentのページ（エラー発生）
- [app/goals/page.tsx](app/goals/page.tsx): `'use client'`を使用し、[lib/db.ts](lib/db.ts)をインポート

## 解決方針

### アプローチA: Server Actionsパターン（推奨）

Next.js App Routerの推奨パターンに従い、データベースアクセスをServer Actionsに分離します。

**メリット:**
- Next.jsのベストプラクティスに準拠
- セキュリティが向上（データベースアクセスがサーバー側に限定）
- 型安全性が保たれる
- 将来的な拡張性が高い

**デメリット:**
- 実装の変更量が多い
- Client Component側のロジックを一部変更する必要がある

### アプローチB: [lib/db.ts](lib/db.ts)を分割

Server Component用とClient Component用にデータベースアクセス層を分割します。

**メリット:**
- 既存のコード構造を大きく変更しなくて済む
- 段階的な移行が可能

**デメリット:**
- コードの重複が発生する可能性
- メンテナンスコストが増加
- アンチパターンになる可能性

## 推奨実装計画（アプローチA: Server Actions）

### 1. Server Actionsファイルの作成

新しいファイル `lib/actions.ts` を作成し、データベース操作をServer Actionsとして実装します。

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import type { Goal, GoalLevel, GoalChangeReason } from '@/types';

export async function getGoalsAction(userId: string = DEFAULT_USER_ID) {
  // getGoals の実装をここに移動
}

export async function updateGoalAction(
  level: GoalLevel,
  description: string,
  userId: string = DEFAULT_USER_ID
) {
  // updateGoal の実装をここに移動
}

export async function createGoalHistorySlotAction(
  bronzeGoal: string,
  silverGoal: string,
  goldGoal: string,
  changeReason: GoalChangeReason,
  userId: string = DEFAULT_USER_ID
) {
  // createGoalHistorySlot の実装をここに移動
}

// 他に必要なactionも追加
```

### 2. [lib/db.ts](lib/db.ts) の整理

[lib/db.ts](lib/db.ts) はServer Component専用として保持し、必要に応じて内部で [lib/actions.ts](lib/actions.ts) を呼び出すか、Server Component専用の関数として残します。

### 3. [app/goals/page.tsx](app/goals/page.tsx) の修正

Client Componentを修正して、Server Actionsを使用するように変更します。

```typescript
'use client';

import { getGoalsAction, updateGoalAction, createGoalHistorySlotAction } from '@/lib/actions';

// useEffect内
const fetchedGoals = await getGoalsAction();

// 保存処理
await updateGoalAction('bronze', bronzeDesc.trim());
await updateGoalAction('silver', silverDesc.trim());
await updateGoalAction('gold', goldDesc.trim());

await createGoalHistorySlotAction(
  bronzeDesc.trim(),
  silverDesc.trim(),
  goldDesc.trim(),
  changeReason
);
```

### 4. その他のページの確認と修正

以下のページについて、Client ComponentかServer Componentかを確認し、必要に応じて修正します：

- [ ] [app/calendar/page.tsx](app/calendar/page.tsx)
- [ ] [app/day/[date]/page.tsx](app/day/%5Bdate%5D/page.tsx)
- [ ] [app/history/page.tsx](app/history/page.tsx)
- [ ] [app/record/page.tsx](app/record/page.tsx)
- [ ] [app/settings/page.tsx](app/settings/page.tsx)

**確認ポイント:**
- `'use client'`ディレクティブの有無
- `useState`, `useEffect`などのReact Hooksの使用有無
- [lib/db.ts](lib/db.ts)を直接インポートしている場合、Server ActionsまたはServer Component経由に変更

## 実装手順

### Phase 1: Server Actionsの作成
1. [lib/actions.ts](lib/actions.ts) ファイルを作成
2. Client Componentから呼び出される可能性のある関数をServer Actionとして実装
   - `getGoals`
   - `updateGoal`
   - `createGoalHistorySlot`
   - その他、Client Componentで使用される関数

### Phase 2: goals/page.tsxの修正
1. [app/goals/page.tsx](app/goals/page.tsx) を修正
2. [lib/db.ts](lib/db.ts) のインポートを [lib/actions.ts](lib/actions.ts) に変更
3. 関数呼び出しをServer Actionの呼び出しに変更
4. ビルドエラーが解消されることを確認

### Phase 3: 他のページの確認と修正
1. 各ページファイルを確認
2. Client Componentで [lib/db.ts](lib/db.ts) を使用している場合、Server Actionsに移行
3. Server Componentの場合、そのまま [lib/db.ts](lib/db.ts) を使用可能

### Phase 4: テストとビルド確認
1. すべてのページで動作確認
2. `npm run build` でビルドエラーがないことを確認
3. 開発サーバーで動作確認

## 注意事項

### Server Actionsの制約
- Server Actionsは非同期関数である必要がある
- クライアント側から呼び出し可能
- シリアライズ可能な値のみを返す必要がある（Date, Function, Symbolなどは不可）
- `'use server'`ディレクティブが必須

### 型安全性の維持
- Server Actionsの引数と戻り値の型を明示的に定義
- `zod`などのバリデーションライブラリの使用を検討

### エラーハンドリング
- Server Actions内でのエラーハンドリングを適切に実装
- クライアント側でのエラー表示も実装

## 代替案（アプローチB）の簡易説明

もしServer Actionsパターンが複雑すぎる場合、以下の簡易的な対応も可能です：

1. [lib/db-client.ts](lib/db-client.ts) を作成（Client Component用）
2. [lib/supabase/client.ts](lib/supabase/client.ts) を使用
3. Client Componentからは [lib/db-client.ts](lib/db-client.ts) をインポート
4. Server Componentからは [lib/db.ts](lib/db.ts) をインポート

ただし、この方法はセキュリティ上の懸念があるため、推奨しません。

## 次のステップ

1. このドキュメントをレビューしていただき、アプローチAで進めることを確認
2. Phase 1から順次実装を開始
3. 各Phaseの完了後、動作確認とレビューを実施

## 参考リンク

- [Next.js Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase with Next.js App Router](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
