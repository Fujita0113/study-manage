# 昨日の日報未作成バナー 実装計画書

## 1. 概要

昨日の日報が作成されていない場合に、ホーム画面の右下にバナーを表示し、ユーザーが過去の日報を作成できるようにする機能を実装する。

## 2. 使用する主要モジュールとバージョン

| モジュール | バージョン | 用途 |
|-----------|-----------|------|
| next | 16.1.1 | ルーティング（URLパラメータ対応） |
| react | 19.2.3 | コンポーネント実装 |
| date-fns | 4.1.0 | 日付計算（昨日の日付取得） |
| lucide-react | 0.562.0 | アイコン表示 |

## 3. 依存関係で注意すべき点

- `date-fns` v4はESM形式のみ対応。既存コードで `formatDate` などを使用しているため、同様のパターンで実装する。
- 既存の `SuggestionBanner` コンポーネントを参考にし、スタイルを統一する。

## 4. 変更が必要なファイル

### 4.1 新規作成ファイル

| ファイルパス | 説明 |
|-------------|------|
| `components/YesterdayRecordBanner.tsx` | 昨日の日報未作成バナーコンポーネント |
| `app/api/daily-records/check-yesterday/route.ts` | 昨日の日報存在チェックAPI |

### 4.2 変更ファイル

| ファイルパス | 変更内容 |
|-------------|----------|
| `app/page.tsx` | 昨日の日報チェックと `YesterdayRecordBanner` の追加 |
| `app/record/RecordPageClient.tsx` | URLパラメータから日付を取得する機能追加 |
| `lib/db.ts` | 昨日の日報存在チェック関数追加 |

## 5. 各ファイルでの具体的な変更内容

### 5.1 `components/YesterdayRecordBanner.tsx`（新規作成）

```typescript
'use client';

import Link from 'next/link';

interface YesterdayRecordBannerProps {
  yesterdayDate: string; // YYYY-MM-DD形式
}

export function YesterdayRecordBanner({ yesterdayDate }: YesterdayRecordBannerProps) {
  return (
    <div className="fixed bottom-6 right-6 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg shadow-2xl p-4 max-w-sm z-50 animate-slide-up">
      {/* メッセージ */}
      <div className="mb-3">
        <p className="text-sm font-medium leading-relaxed">
          昨日の日報が作成されていません。日報を作成しますか？
        </p>
      </div>

      {/* アクションボタン */}
      <Link
        href={`/record?date=${yesterdayDate}`}
        className="block w-full bg-white text-center py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors text-slate-700"
      >
        昨日の日報を作成する
      </Link>
    </div>
  );
}
```

**ポイント**:
- 閉じるボタンなし（常に表示）
- 既存の `SuggestionBanner` と同じスタイル基盤を使用
- 色はslate系（提案バナーと差別化しつつ統一感維持）

### 5.2 `app/api/daily-records/check-yesterday/route.ts`（新規作成）

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { subDays } from 'date-fns';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const yesterday = formatDate(subDays(new Date(), 1));

    const { data, error } = await supabase
      .from('daily_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', yesterday)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116: Row not found（レコードなし）は正常
      console.error('Error checking yesterday record:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      hasYesterdayRecord: !!data,
      yesterdayDate: yesterday,
    });
  } catch (error) {
    console.error('Error in check-yesterday:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 5.3 `app/page.tsx`（変更）

変更箇所:

1. `checkYesterdayRecord` 関数を `lib/db.ts` から呼び出す
2. バナー表示領域を修正（複数バナー縦並び対応）

```typescript
// インポート追加
import { YesterdayRecordBanner } from '@/components/YesterdayRecordBanner';
import { checkYesterdayRecord } from '@/lib/db';

// HomePage関数内で昨日の日報チェック
const yesterdayStatus = await checkYesterdayRecord(user.id);

// JSX部分でバナーを縦に並べて表示
{/* バナーエリア（右下固定） */}
<div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
  {!yesterdayStatus.hasRecord && (
    <YesterdayRecordBanner yesterdayDate={yesterdayStatus.date} />
  )}
  <SuggestionBanner suggestion={suggestion} />
</div>
```

**注意**: バナーコンポーネントから `fixed` スタイルを削除し、親コンテナで管理する方式に変更

### 5.4 `lib/db.ts`（変更）

新規関数追加:

```typescript
/**
 * 昨日の日報が作成されているかチェック
 */
export async function checkYesterdayRecord(userId: string): Promise<{
  hasRecord: boolean;
  date: string;
}> {
  const supabase = await createClient();
  const yesterday = formatDate(subDays(new Date(), 1));

  const { data, error } = await supabase
    .from('daily_records')
    .select('id')
    .eq('user_id', userId)
    .eq('date', yesterday)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking yesterday record:', error);
  }

  return {
    hasRecord: !!data,
    date: yesterday,
  };
}
```

### 5.5 `app/record/RecordPageClient.tsx`（変更）

URLパラメータから日付を取得できるように変更:

```typescript
// インポート追加
import { useSearchParams } from 'next/navigation';

// コンポーネント内
const searchParams = useSearchParams();
const dateParam = searchParams.get('date');

// 日付の決定（URLパラメータがあればそれを使用、なければ今日）
const targetDate = dateParam || formatDate(new Date());

// 既存の `today` 変数を `targetDate` に置き換え
// 画面タイトルも日付に応じて変更
const pageTitle = dateParam ? `${formatDisplayDate(dateParam)}の日報` : '記録・日報';
```

### 5.6 `components/SuggestionBanner.tsx`（変更）

`fixed` スタイルを削除し、親コンテナでの配置に対応:

```typescript
// 変更前
<div className={`fixed bottom-6 right-6 ${bgColor} ...`}>

// 変更後
<div className={`${bgColor} text-white rounded-lg shadow-2xl p-4 max-w-sm animate-slide-up`}>
```

### 5.7 `components/YesterdayRecordBanner.tsx`（最終版）

同様に `fixed` スタイルを削除:

```typescript
<div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg shadow-2xl p-4 max-w-sm animate-slide-up">
```

## 6. 実装手順

### Step 1: `lib/db.ts` に昨日の日報チェック関数を追加
- `checkYesterdayRecord` 関数を実装
- `date-fns` の `subDays` をインポート

### Step 2: `YesterdayRecordBanner` コンポーネントを作成
- 新規ファイル `components/YesterdayRecordBanner.tsx` を作成
- 既存の `SuggestionBanner` のスタイルを参考に実装

### Step 3: `SuggestionBanner` コンポーネントを修正
- `fixed` 配置スタイルを削除
- 親コンテナで配置管理する方式に変更

### Step 4: `app/page.tsx` を修正
- 昨日の日報チェック処理を追加
- バナーコンテナを追加（縦並び対応）
- 両バナーを条件付きで表示

### Step 5: `app/record/RecordPageClient.tsx` を修正
- `useSearchParams` でURLパラメータを取得
- `date` パラメータがある場合はその日付で日報を作成
- 画面タイトルを動的に変更

### Step 6: 動作確認
- 昨日の日報がない場合にバナーが表示されることを確認
- バナーのボタンクリックで記録画面に遷移し、日付が昨日になっていることを確認
- 昨日の日報を作成後、バナーが非表示になることを確認
- 提案バナーとの同時表示が正しく動作することを確認

## 7. 想定される影響範囲

| 影響範囲 | 詳細 |
|---------|------|
| ホーム画面 | バナー表示ロジックの変更 |
| 記録画面 | URL パラメータによる日付指定対応 |
| 提案バナー | 配置スタイルの変更（機能への影響なし） |

## 8. テスト方針

### 8.1 手動テスト項目

1. **バナー表示テスト**
   - [ ] 昨日の日報がない場合、バナーが表示される
   - [ ] 昨日の日報がある場合、バナーが表示されない
   - [ ] バナーに閉じるボタンがないこと

2. **バナー併存テスト**
   - [ ] 提案バナーと昨日の日報バナーが同時に表示される
   - [ ] 2つのバナーが縦に並んで表示される
   - [ ] 互いに干渉しない

3. **記録画面遷移テスト**
   - [ ] バナーのボタンクリックで `/record?date=YYYY-MM-DD` に遷移する
   - [ ] 記録画面で日付が昨日になっている
   - [ ] 昨日の日報を保存できる

4. **バナー非表示テスト**
   - [ ] 昨日の日報を作成後、ホーム画面でバナーが非表示になる

## 9. 備考

- 「昨日」の判定はサーバーサイドで行い、タイムゾーンの問題を回避
- 既存の `formatDate` ユーティリティを活用してコードの一貫性を保つ
- バナーのアニメーション（`animate-slide-up`）は既存のものを再利用
