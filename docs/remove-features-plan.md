# 機能削除 実装計画

## 目的
目標変遷画面・履歴画面・ルーティン画面・記録画面タイマーを削除する。

## 使用モジュール
- 既存依存のみ。recharts は履歴画面削除後に不要になる可能性があるが、他で使われていなければ package.json から削除する。

## 削除対象ファイル

### 1. 目標変遷画面 + 履歴画面（/history ルート）
- `app/history/` ディレクトリ全体
- `components/progress-race/` ディレクトリ全体
- `app/api/history/` ディレクトリ全体
- `lib/animation/` ディレクトリ全体

### 2. ルーティン画面（/routine ルート）
- `app/routine/` ディレクトリ全体
- `components/todo/RoutineTodoSection.tsx`
- `app/api/timeline-todos/route.ts`
- `lib/actions/timeline.ts`

### 3. タイマー記録
- `lib/hooks/useStudyTimer.ts`
- `e2e/timer.spec.ts`

## 修正対象ファイル

### 4. サイドバー（Sidebar.tsx）
- `/routine`（ルーティン）と `/history`（目標変遷）のナビ項目を削除
- RoutineIcon, HistoryIcon のインポートが不要になれば削除

### 5. 記録画面（RecordPageClient.tsx）
- useStudyTimer インポート・使用を削除
- routineTodos 関連の state・ロジック・API呼び出しを削除
- マイルーティンセクション（JSX）を削除
- タイマー表示セクション（JSX）を削除
- studySeconds の保存処理を削除
- RoutineTodoSection インポートを削除
- TimelineTodo 型インポートを削除

### 6. コンポーネントindex（components/todo/index.ts）
- RoutineTodoSection エクスポートを削除

### 7. アイコン（components/icons.tsx）
- RoutineIcon, HistoryIcon が他で使われていなければ削除

### 8. 日詳細画面（app/day/[date]/page.tsx）
- ルーティンTODO表示部分を削除

### 9. recharts パッケージ
- 履歴画面以外で使用がなければ package.json から削除

## 実装手順

1. ディレクトリ・ファイルの削除（削除対象）
2. Sidebar.tsx の修正
3. RecordPageClient.tsx の修正
4. components/todo/index.ts の修正
5. icons.tsx の修正
6. day/[date]/page.tsx の修正
7. recharts が不要なら `npm uninstall recharts`
8. ビルド確認（`npm run build`）

## テスト方針
- `npm run build` が成功することを確認
- 削除した画面へのルーティングが存在しないことを確認
