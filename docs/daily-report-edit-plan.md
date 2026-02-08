# 日報編集機能 実装計画

## 目的と概要

当日中（23:59:59まで）に記録した日報を編集できる機能を追加する。

- ヘッダー/サイドバーの「記録」ボタンから記録画面へ遷移した際、当日の日報が既に存在する場合は編集モードで開く
- 編集可能期間は記録日の当日中（23:59:59まで）
- 日付が変わると編集不可（読み取り専用）になる
- 全ての内容（TODOチェック状態、自由記述）を編集可能
- リカバリーモードの起動状態は編集不可（新規作成時のみ設定可能）

## 使用する主要モジュールとバージョン

| モジュール | バージョン | 用途 |
|-----------|-----------|------|
| `next` | 16.1.1 | App Router、Server Component/Client Component |
| `react` | 19.2.3 | UI構築 |
| `@supabase/supabase-js` | ^2.90.1 | データベース操作 |
| `@supabase/ssr` | ^0.8.0 | Server Component用Supabaseクライアント |
| `date-fns` | ^4.1.0 | 日付操作（当日判定、23:59:59比較） |

### 依存関係で注意すべき点

- **Server ComponentとClient Componentの境界**:
  - `lib/db.ts`はServer Component専用（`@supabase/ssr`を使用）
  - Client Componentでデータ取得する場合は、必ずAPI Routes経由でアクセスすること
  - 記録画面はClient Component（`useState`、`useEffect`を使用）なので、API Routes経由でデータ取得する

- **date-fnsの使用**:
  - 当日判定、編集期限（23:59:59）の判定に使用
  - `isSameDay`、`isAfter`、`endOfDay`などの関数を使用

## 変更が必要なファイルのリスト

### 1. データベース関連（Server Side）
- `lib/db.ts` - 日報取得関数の追加（既存の日報を取得する関数）
- 既存のテーブル構造は変更不要（`daily_records`テーブルをそのまま使用）

### 2. API Routes（Server Side）
- `app/api/daily-records/[date]/route.ts`（新規作成） - 特定の日付の日報取得API

### 3. 記録画面（Client Component）
- `app/record/page.tsx` - 記録画面のメインコンポーネント
  - 既存の日報を取得して表示する機能を追加
  - 新規作成モードと編集モードの切り替え
  - 編集期限の判定と読み取り専用表示

### 4. UI Components（必要に応じて）
- 既存のUIコンポーネントを再利用（変更なし）

## 各ファイルでの具体的な変更内容

### 1. `lib/db.ts`

**追加する関数**:

```typescript
/**
 * 特定の日付の日報を取得
 * @param userId - ユーザーID
 * @param recordDate - 記録日（YYYY-MM-DD形式）
 * @returns 日報データ（存在しない場合はnull）
 */
export async function getDailyRecordByDate(userId: string, recordDate: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .eq('record_date', recordDate)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // レコードが存在しない場合
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * 特定の日付の達成TODO一覧を取得
 * @param userId - ユーザーID
 * @param recordDate - 記録日（YYYY-MM-DD形式）
 * @returns 達成TODO一覧
 */
export async function getCompletedTodosByDate(userId: string, recordDate: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('completed_todos')
    .select(`
      *,
      goal_todos(*),
      other_todos(*)
    `)
    .eq('user_id', userId)
    .eq('record_date', recordDate);

  if (error) throw error;

  return data || [];
}
```

### 2. `app/api/daily-records/[date]/route.ts`（新規作成）

**目的**: 特定の日付の日報を取得するAPI

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDailyRecordByDate, getCompletedTodosByDate } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date: recordDate } = await params;

    // 日報データを取得
    const dailyRecord = await getDailyRecordByDate(user.id, recordDate);

    if (!dailyRecord) {
      return NextResponse.json({ record: null, todos: [] });
    }

    // 達成TODO一覧を取得
    const completedTodos = await getCompletedTodosByDate(user.id, recordDate);

    return NextResponse.json({
      record: dailyRecord,
      todos: completedTodos,
    });
  } catch (error) {
    console.error('Error fetching daily record:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### 3. `app/record/page.tsx`

**主要な変更点**:

1. **既存の日報を取得する処理を追加**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { format, isAfter, endOfDay } from 'date-fns';

export default function RecordPage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingRecord, setExistingRecord] = useState(null);
  const [isEditable, setIsEditable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExistingRecord = async () => {
      try {
        setIsLoading(true);
        const today = format(new Date(), 'yyyy-MM-dd');
        const response = await fetch(`/api/daily-records/${today}`);
        const data = await response.json();

        if (data.record) {
          setIsEditMode(true);
          setExistingRecord(data);

          // 編集可能期限を判定
          const recordDate = new Date(data.record.record_date);
          const now = new Date();
          const deadline = endOfDay(recordDate);

          // 記録日の当日中（23:59:59まで）であれば編集可能
          setIsEditable(!isAfter(now, deadline));
        }
      } catch (error) {
        console.error('Error fetching existing record:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingRecord();
  }, []);

  // ... 既存のコード ...
}
```

2. **新規作成モードと編集モードの切り替え**

- ボタンのラベルを切り替える:
  - 新規作成モード: 「記録を確定してロックする」
  - 編集モード: 「変更を保存する」

```typescript
<button
  type="submit"
  disabled={!isFormValid || !isEditable}
>
  {isEditMode ? '変更を保存する' : '記録を確定してロックする'}
</button>
```

3. **編集期限が過ぎた場合の読み取り専用表示**

```typescript
{!isEditable && (
  <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
    <p className="text-yellow-800">この日報は編集期限が過ぎています</p>
  </div>
)}

{/* 全てのフィールドにdisabled属性を追加 */}
<input
  type="checkbox"
  disabled={!isEditable}
  // ...
/>
```

4. **既存データの読み込み**

- 編集モードの場合、`existingRecord`から以下を読み込む:
  - TODOチェック状態（`completedTodos`から復元）
  - 自由記述（`journal`フィールド）
  - 達成レベル（`goal_type`フィールド）

```typescript
useEffect(() => {
  if (existingRecord && isEditMode) {
    // TODOチェック状態を復元
    const completedTodoIds = existingRecord.todos.map(t => t.goal_todo_id || t.other_todo_id);
    setCheckedTodos(completedTodoIds);

    // 自由記述を復元
    setJournal(existingRecord.record.journal || '');

    // リカバリーモード状態を復元（表示のみ、変更不可）
    setIsRecoveryMode(existingRecord.record.is_recovery_mode || false);
  }
}, [existingRecord, isEditMode]);
```

## 実装手順（ステップバイステップ）

### Step 1: データベース関数の追加

1. `lib/db.ts`に`getDailyRecordByDate`と`getCompletedTodosByDate`を追加

### Step 2: API Routesの作成

1. `app/api/daily-records/[date]/route.ts`を作成
2. 特定の日付の日報を取得するGETエンドポイントを実装

### Step 3: 記録画面の修正

1. `app/record/page.tsx`を修正
   - 既存の日報を取得する処理を追加
   - 新規作成モード/編集モードの切り替え
   - 編集期限の判定
   - 読み取り専用表示の実装
   - ボタンラベルの切り替え
   - 既存データの読み込み処理

### Step 4: ビルド確認

1. `npm run build`を実行してビルドエラーがないか確認

### Step 5: テストと動作確認

1. 新規作成モードの動作確認
2. 編集モードの動作確認
3. 編集期限（23:59:59）の判定確認
4. 翌日以降の読み取り専用表示確認

## 想定される影響範囲

### 直接的な影響

- **記録画面（`app/record/page.tsx`）**: 大幅な変更
  - 既存の日報を取得して表示する機能を追加
  - 新規作成モードと編集モードの切り替え
  - 編集期限の判定

### 間接的な影響

- **ホーム画面（ダッシュボード）**: 影響なし
  - 「編集」ボタンは表示しない（要件通り）
  - 既存の表示ロジックは変更不要

- **カレンダー画面**: 影響なし
  - 日詳細画面は読み取り専用のまま

- **リカバリーモード**: 注意が必要
  - リカバリーモードの起動状態は編集不可
  - 新規作成時のみリカバリーモードを起動可能
  - 編集モードではリカバリーモードのON/OFFを変更できない

## テスト方針

### 1. 新規作成モードのテスト

- [ ] ヘッダー/サイドバーの「記録」ボタンから遷移
- [ ] 当日の日報が未作成の場合、新規作成モードで開く
- [ ] 全てのTODOチェックが空の状態
- [ ] 自由記述が空の状態
- [ ] ボタンは「記録を確定してロックする」と表示

### 2. 編集モードのテスト

- [ ] ヘッダー/サイドバーの「記録」ボタンから遷移
- [ ] 当日の日報が既に存在する場合、編集モードで開く
- [ ] 既存のTODOチェック状態が正しく読み込まれる
- [ ] 既存の自由記述が正しく読み込まれる
- [ ] ボタンは「変更を保存する」と表示

### 3. 編集期限のテスト

- [ ] 記録日の当日中（23:59:59まで）は編集可能
- [ ] 翌日以降は編集不可（読み取り専用）
- [ ] 読み取り専用の場合、全てのフィールドが`disabled`
- [ ] 読み取り専用の場合、保存ボタンが非表示
- [ ] 「この日報は編集期限が過ぎています」とメッセージが表示される

### 4. リカバリーモードのテスト

- [ ] 新規作成時、リカバリーモードを起動できる
- [ ] 編集モード時、リカバリーモードのON/OFFを変更できない
- [ ] 編集モード時、リカバリーボタンが非表示になる

### 5. データ保存のテスト

- [ ] 編集モードで保存した場合、変更内容が正しく反映される
- [ ] ホーム画面に戻った際、変更内容が正しく表示される
- [ ] 再度記録画面を開いた際、保存した内容が正しく読み込まれる

## リスクと対策

### リスク1: Server ComponentとClient Componentの境界エラー

**リスク**:
- `lib/db.ts`を直接Client Componentで使用してしまう

**対策**:
- API Routes経由でデータ取得する
- `app/api/daily-records/[date]/route.ts`を作成し、Server側でデータ取得

### リスク2: 日付判定のタイムゾーン問題

**リスク**:
- ユーザーのタイムゾーンとサーバーのタイムゾーンが異なる場合、編集期限の判定が正しく動作しない

**対策**:
- `date-fns`を使用して日付を統一
- クライアント側で日付判定を行う（ユーザーのタイムゾーンで判定）

### リスク3: リカバリーモードの状態管理

**リスク**:
- 編集モード時にリカバリーモードのON/OFFを変更できてしまう

**対策**:
- 編集モード時、リカバリーモードの起動ボタンを非表示にする
- `isEditMode`の状態に基づいてボタンの表示/非表示を制御

### リスク4: データ読み込み中のUI表示

**リスク**:
- データ読み込み中に古いデータや空のフォームが表示される

**対策**:
- ローディング状態（`isLoading`）を管理
- データ読み込み中はローディングスピナーを表示

## 実装後の確認事項

- [ ] 新規作成モードが正しく動作する
- [ ] 編集モードが正しく動作する
- [ ] 編集期限が正しく判定される
- [ ] 読み取り専用表示が正しく動作する
- [ ] リカバリーモードの制約が正しく動作する
- [ ] ホーム画面での表示が正しい
- [ ] カレンダー画面での表示が正しい
- [ ] データベースへの保存が正しく動作する
- [ ] ビルドエラーがないことを確認
- [ ] 型エラーがないことを確認
