# パフォーマンス改善 実装計画

## 目的
アプリ全体が重い問題を、優先度の高い原因から順に修正する。

## 使用モジュール・バージョン
- next: 16.1.1
- react: 19.2.3
- @supabase/supabase-js: ^2.90.1
- @supabase/ssr: ^0.8.0

依存関係で特に注意すべき点はなし（既存モジュールの範囲内で修正可能）。

## 修正対象と手順

### 修正1: useStudyTimer の最適化
**ファイル**: `lib/hooks/useStudyTimer.ts`, `app/record/RecordPageClient.tsx`

**問題**:
- setIntervalが毎秒 `setSeconds()` を呼び、コンポーネント全体が毎秒再レンダリングされる
- 毎秒 `localStorage.setItem` が実行される
- 過去日の記録を見ているときもタイマーが動作する

**修正内容**:
1. `useStudyTimer` に `enabled` パラメータを追加し、不要時はタイマーを停止
2. localStorage書き込みを30秒間隔に間引く
3. 表示用の秒数更新は `useRef` + `requestAnimationFrame` で管理し、再レンダリングを抑制
   → ただしタイマー表示が1秒ごとに更新される必要があるため、`setSeconds` は維持するが、localStorage書き込みのみ間引く
4. RecordPageClient で `isYesterdayRecord` の場合は `enabled: false` を渡す

### 修正2: getGoalTodosByUserId の N+1 クエリ解消
**ファイル**: `lib/db.ts`

**問題**:
- `getGoals()` で全ゴール取得 → ループで各ゴールごとに `goal_todos` を個別クエリ（N+1）

**修正内容**:
1. goals と goal_todos を1回のクエリで結合取得
2. Supabaseの `select('*, goal_todos(*)')` を使用してJOIN

### 修正3: AppStateProvider の削除
**ファイル**: `app/layout.tsx`, `lib/store.tsx`

**問題**:
- `useAppState` はどこからも使用されていない
- `'use client'` の Provider がルートレイアウトをラップし、全ページを不必要にClient化

**修正内容**:
1. `app/layout.tsx` から `AppStateProvider` のラップを削除
2. `lib/store.tsx` は残すが、layout.tsx での使用を除去

### 修正4: ホームページの並列クエリ最適化
**ファイル**: `app/page.tsx`

**問題**:
- `getSuggestion` と `calculateStreakFromRecords` が個別に `getDailyRecords` を呼び、同じデータを3回取得

**修正内容**:
1. `records` を `getSuggestion` と `calculateStreakFromRecords` に `preFetchedRecords` として渡す（既にパラメータが存在する）

### 修正5: RecordPageClient のウォーターフォール解消
**ファイル**: `app/record/RecordPageClient.tsx`

**問題**:
- 既存レコードがある場合、最初の並列fetch完了後に `todos` を直列で追加取得

**修正内容**:
1. 既存レコードの存在確認と同時にtodosも取得する
2. recordIdが判明した時点で追加fetchが必要な場合、他の処理と並列化

## 影響範囲
- 全ページ（AppStateProvider削除による）
- ホーム画面（クエリ最適化）
- 記録画面（タイマー最適化、fetch最適化）
- `/api/goals/todos`（N+1解消）

## テスト方針
- `npm run build` でビルドエラーがないことを確認
- 記録画面でタイマーが正常に動作すること
- 過去日の記録画面でタイマーが動作しないこと
- ホーム画面が正常に表示されること
- 目標TODO一覧が正常に表示されること
