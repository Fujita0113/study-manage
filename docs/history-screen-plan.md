# 履歴画面(/history) 実装計画

## 作業の目的と概要

学習記録の履歴を、折れ線グラフと棒グラフを組み合わせた可視化で表示する新しい画面を実装します。目標のレベル変遷と達成状況を一目で把握できるようにします。

現在はモックデータによる実装がある可能性がありますが、これをSupabaseから実データを取得する実装に変更します。

## 使用する主要モジュールとバージョン

### 既存の依存関係（package.jsonより）
- **Next.js**: `16.1.1` - App Router使用
- **React**: `19.2.3`
- **React DOM**: `19.2.3`
- **TypeScript**: `^5`
- **@supabase/supabase-js**: `^2.90.1` - Supabaseクライアント
- **@supabase/ssr**: `^0.8.0` - Server Component用Supabaseクライアント
- **date-fns**: `^4.1.0` - 日付操作
- **Tailwind CSS**: `^4` - スタイリング
- **lucide-react**: `^0.562.0` - アイコン

### 新規に追加するモジュール
- **recharts**: `^2.15.0` - グラフ描画ライブラリ（React用、宣言的で使いやすい）

### 依存関係で注意すべき点
1. **Next.js 16.1.1 + React 19.2.3の組み合わせ**
   - Next.js 16はReact 19に対応しているが、一部のサードパーティライブラリ（特にRechartsなど）がReact 19で警告を出す可能性がある
   - 実装後、コンソールに警告が出ないか確認が必要

2. **Rechartsのバージョン互換性**
   - Recharts 2.15.0はReact 18を想定しているが、React 19でも動作する
   - `ResponsiveContainer`、`LineChart`、`BarChart`などの基本コンポーネントは問題なく動作する見込み

3. **Server ComponentとClient Componentの境界**
   - **絶対に守るべきルール**: `lib/db.ts`の関数はClient Componentで直接使用不可
   - Client Componentでデータ取得する場合は、必ずAPI Routes経由でアクセス
   - Rechartsはブラウザ専用ライブラリのため、`'use client'`ディレクティブが必須

4. **date-fns 4.1.0**
   - 日付フォーマットや計算に使用
   - バージョン4系では一部のAPIが変更されているため、既存コードとの一貫性を保つ

## 変更が必要なファイルのリスト

### 1. データベーススキーマ（新規作成）
- `supabase/migrations/[timestamp]_create_goal_level_history.sql`
  - `goal_level_history`テーブルの作成

### 2. データベースアクセスレイヤー（新規作成）
- `lib/db/goal-level-history.ts`
  - `goal_level_history`テーブルへのアクセス関数
  - `getGoalLevelHistory(userId, startDate?, endDate?)`
  - `createGoalLevelHistoryEntry(...)`

- `lib/db/records.ts`
  - 日次記録の取得関数（既存の`lib/db.ts`から分離または新規作成）
  - `getRecordsByDateRange(userId, startDate?, endDate?)`

### 3. API Routes（新規作成）
- `app/api/history/achievement/route.ts`
  - GET: 折れ線グラフ用の達成状況データを取得
  - レスポンス: `{ date: string, level: number }[]`

- `app/api/history/level-history/route.ts`
  - GET: 棒グラフ用の目標レベル履歴データを取得
  - レスポンス: `{ date: string, bronze: number, silver: number, gold: number, bronzeContent: string, silverContent: string, goldContent: string }[]`

### 4. 履歴画面コンポーネント（新規作成）
- `app/history/page.tsx`
  - Server Component: ページのエントリーポイント、レイアウト定義

- `app/history/_components/HistoryCharts.tsx` (Client Component)
  - メインのグラフ表示コンポーネント
  - 折れ線グラフと棒グラフを統合
  - 横スクロール機能
  - 中央縦線の表示
  - 目標内容の動的表示（左側固定）

- `app/history/_components/AchievementLineChart.tsx` (Client Component)
  - 折れ線グラフ専用コンポーネント
  - Rechartsの`LineChart`を使用
  - レベル変更期間のラベル表示

- `app/history/_components/LevelBarChart.tsx` (Client Component)
  - 棒グラフ専用コンポーネント
  - Rechartsの`BarChart`を使用
  - 日ごとのセグメント分割
  - レベルに応じた色分け

- `app/history/_components/GoalLabels.tsx` (Client Component)
  - 棒グラフ左側の目標内容表示コンポーネント
  - 中央縦線の位置に応じて動的に更新

- `app/history/_components/CenterLine.tsx` (Client Component)
  - 中央縦線のコンポーネント
  - 固定表示

### 5. 型定義（新規作成）
- `types/history.ts`
  - `AchievementData`: 折れ線グラフのデータ型
  - `LevelHistoryData`: 棒グラフのデータ型
  - `GoalLevelHistoryRecord`: `goal_level_history`テーブルのレコード型

### 6. サイドバーメニュー（既存ファイル修正）
- `components/Sidebar.tsx` または該当するナビゲーションコンポーネント
  - 「履歴」メニュー項目を追加
  - メニュー順序: ホーム → 記録 → カレンダー → **履歴** → 目標変遷 → 設定

## 各ファイルでの具体的な変更内容

### 1. `supabase/migrations/[timestamp]_create_goal_level_history.sql`

```sql
-- goal_level_historyテーブルの作成
CREATE TABLE IF NOT EXISTS public.goal_level_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('bronze', 'silver', 'gold')),
  level INTEGER NOT NULL CHECK (level >= 1),
  goal_content TEXT NOT NULL CHECK (char_length(goal_content) >= 1 AND char_length(goal_content) <= 500),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  change_reason TEXT NOT NULL CHECK (change_reason IN ('initial', 'level_up', 'level_down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT valid_date_range CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX idx_goal_level_history_user_id ON public.goal_level_history(user_id);
CREATE INDEX idx_goal_level_history_dates ON public.goal_level_history(user_id, started_at, ended_at);

-- RLS（Row Level Security）の有効化
ALTER TABLE public.goal_level_history ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分のデータのみ閲覧可能
CREATE POLICY "Users can view their own goal level history"
  ON public.goal_level_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のデータのみ挿入可能
CREATE POLICY "Users can insert their own goal level history"
  ON public.goal_level_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のデータのみ更新可能
CREATE POLICY "Users can update their own goal level history"
  ON public.goal_level_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- トリガー: updated_atの自動更新
CREATE TRIGGER update_goal_level_history_updated_at
  BEFORE UPDATE ON public.goal_level_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- テーブルコメント
COMMENT ON TABLE public.goal_level_history IS '目標レベルの履歴（レベルアップ・ダウンの記録）';
COMMENT ON COLUMN public.goal_level_history.id IS '履歴ID（UUID）';
COMMENT ON COLUMN public.goal_level_history.user_id IS 'ユーザーID（外部キー: auth.users.id）';
COMMENT ON COLUMN public.goal_level_history.goal_type IS '目標タイプ（bronze/silver/gold）';
COMMENT ON COLUMN public.goal_level_history.level IS '目標レベル（Lv.1, Lv.2...）';
COMMENT ON COLUMN public.goal_level_history.goal_content IS '目標内容（1-500文字）';
COMMENT ON COLUMN public.goal_level_history.started_at IS 'この目標レベルが開始された日時';
COMMENT ON COLUMN public.goal_level_history.ended_at IS 'この目標レベルが終了した日時（NULL=現在も継続中）';
COMMENT ON COLUMN public.goal_level_history.change_reason IS '変更理由（initial/level_up/level_down）';
```

### 2. `lib/db/goal-level-history.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

export interface GoalLevelHistoryRecord {
  id: string;
  user_id: string;
  goal_type: 'bronze' | 'silver' | 'gold';
  level: number;
  goal_content: string;
  started_at: string;
  ended_at: string | null;
  change_reason: 'initial' | 'level_up' | 'level_down';
  created_at: string;
  updated_at: string;
}

/**
 * 指定期間の目標レベル履歴を取得
 */
export async function getGoalLevelHistory(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<GoalLevelHistoryRecord[]> {
  const supabase = await createClient();

  let query = supabase
    .from('goal_level_history')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: true });

  // 期間指定がある場合のフィルタリング
  if (startDate) {
    query = query.gte('started_at', startDate);
  }
  if (endDate) {
    query = query.lte('started_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching goal level history:', error);
    throw error;
  }

  return data || [];
}

/**
 * 新しい目標レベル履歴エントリーを作成
 */
export async function createGoalLevelHistoryEntry(
  userId: string,
  goalType: 'bronze' | 'silver' | 'gold',
  level: number,
  goalContent: string,
  startedAt: string,
  changeReason: 'initial' | 'level_up' | 'level_down'
): Promise<GoalLevelHistoryRecord> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goal_level_history')
    .insert({
      user_id: userId,
      goal_type: goalType,
      level,
      goal_content: goalContent,
      started_at: startedAt,
      change_reason: changeReason,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating goal level history entry:', error);
    throw error;
  }

  return data;
}

/**
 * 既存の目標レベル履歴エントリーの終了日を更新
 */
export async function endGoalLevelHistoryEntry(
  entryId: string,
  endedAt: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('goal_level_history')
    .update({ ended_at: endedAt })
    .eq('id', entryId);

  if (error) {
    console.error('Error ending goal level history entry:', error);
    throw error;
  }
}
```

### 3. `app/api/history/achievement/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // recordsテーブルから達成状況を取得
    const { data: records, error } = await supabase
      .from('daily_records')
      .select('date, achievement_level')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching records:', error);
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    // 達成レベルを数値に変換
    const achievementData = records.map(record => {
      let level = 0;
      if (record.achievement_level === 'bronze') level = 1;
      else if (record.achievement_level === 'silver') level = 2;
      else if (record.achievement_level === 'gold') level = 3;

      return {
        date: record.date,
        level,
      };
    });

    return NextResponse.json(achievementData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4. `app/api/history/level-history/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { eachDayOfInterval, parseISO, formatISO } from 'date-fns';

export async function GET() {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // goal_level_historyテーブルからレベル履歴を取得
    const { data: history, error } = await supabase
      .from('goal_level_history')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: true });

    if (error) {
      console.error('Error fetching goal level history:', error);
      return NextResponse.json({ error: 'Failed to fetch level history' }, { status: 500 });
    }

    if (!history || history.length === 0) {
      return NextResponse.json([]);
    }

    // 全期間の開始日と終了日を取得
    const firstDate = parseISO(history[0].started_at.split('T')[0]);
    const lastDate = history[history.length - 1].ended_at
      ? parseISO(history[history.length - 1].ended_at.split('T')[0])
      : new Date();

    // 日ごとのデータを生成
    const allDays = eachDayOfInterval({ start: firstDate, end: lastDate });

    const levelHistoryData = allDays.map(day => {
      const dateStr = formatISO(day, { representation: 'date' });

      // その日に有効だった各目標レベルを検索
      const bronzeEntry = history.find(
        h =>
          h.goal_type === 'bronze' &&
          h.started_at.split('T')[0] <= dateStr &&
          (!h.ended_at || h.ended_at.split('T')[0] >= dateStr)
      );
      const silverEntry = history.find(
        h =>
          h.goal_type === 'silver' &&
          h.started_at.split('T')[0] <= dateStr &&
          (!h.ended_at || h.ended_at.split('T')[0] >= dateStr)
      );
      const goldEntry = history.find(
        h =>
          h.goal_type === 'gold' &&
          h.started_at.split('T')[0] <= dateStr &&
          (!h.ended_at || h.ended_at.split('T')[0] >= dateStr)
      );

      return {
        date: dateStr,
        bronze: bronzeEntry?.level || 0,
        silver: silverEntry?.level || 0,
        gold: goldEntry?.level || 0,
        bronzeContent: bronzeEntry?.goal_content || '',
        silverContent: silverEntry?.goal_content || '',
        goldContent: goldEntry?.goal_content || '',
      };
    });

    return NextResponse.json(levelHistoryData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 5. `app/history/page.tsx`

```typescript
import { Metadata } from 'next';
import HistoryCharts from './_components/HistoryCharts';

export const metadata: Metadata = {
  title: '履歴 | 学習管理',
  description: '学習記録の履歴を可視化',
};

export default function HistoryPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">学習履歴</h1>
      <HistoryCharts />
    </div>
  );
}
```

### 6. `app/history/_components/HistoryCharts.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import AchievementLineChart from './AchievementLineChart';
import LevelBarChart from './LevelBarChart';
import GoalLabels from './GoalLabels';
import { AchievementData, LevelHistoryData } from '@/types/history';

export default function HistoryCharts() {
  const [achievementData, setAchievementData] = useState<AchievementData[]>([]);
  const [levelHistoryData, setLevelHistoryData] = useState<LevelHistoryData[]>([]);
  const [centerLineDate, setCenterLineDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // 達成状況データ取得
        const achievementRes = await fetch('/api/history/achievement');
        if (!achievementRes.ok) throw new Error('Failed to fetch achievement data');
        const achievementJson = await achievementRes.json();
        setAchievementData(achievementJson);

        // レベル履歴データ取得
        const levelHistoryRes = await fetch('/api/history/level-history');
        if (!levelHistoryRes.ok) throw new Error('Failed to fetch level history data');
        const levelHistoryJson = await levelHistoryRes.json();
        setLevelHistoryData(levelHistoryJson);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('データの取得に失敗しました');
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (achievementData.length === 0 && levelHistoryData.length === 0) {
    return <div className="text-center py-10">まだ学習履歴がありません</div>;
  }

  return (
    <div className="relative">
      {/* 目標ラベル（左側固定） */}
      <GoalLabels centerLineDate={centerLineDate} levelHistoryData={levelHistoryData} />

      {/* グラフエリア */}
      <div className="ml-64 overflow-x-auto">
        {/* 折れ線グラフ */}
        <AchievementLineChart data={achievementData} />

        {/* 棒グラフ */}
        <LevelBarChart data={levelHistoryData} />

        {/* 中央縦線 */}
        <div className="absolute top-0 left-1/2 h-full w-0.5 bg-blue-500 pointer-events-none" />
      </div>
    </div>
  );
}
```

### 7. `types/history.ts`

```typescript
export interface AchievementData {
  date: string; // YYYY-MM-DD
  level: number; // 0=未記録, 1=Bronze, 2=Silver, 3=Gold
}

export interface LevelHistoryData {
  date: string; // YYYY-MM-DD
  bronze: number; // Lv.1, Lv.2...
  silver: number;
  gold: number;
  bronzeContent: string;
  silverContent: string;
  goldContent: string;
}

export interface GoalLevelHistoryRecord {
  id: string;
  user_id: string;
  goal_type: 'bronze' | 'silver' | 'gold';
  level: number;
  goal_content: string;
  started_at: string;
  ended_at: string | null;
  change_reason: 'initial' | 'level_up' | 'level_down';
  created_at: string;
  updated_at: string;
}
```

## テストユーザーID

**サンプルユーザーID**: `b58180f4-3421-4e02-8903-e54d5acee1e9`

このユーザーIDに紐づくテストデータを作成します。

## 実装手順（ステップバイステップ）

### フェーズ0: テストデータ準備（Supabase MCP使用）

1. **サンプルユーザーの認証データ作成**
   - Supabase MCPを使用して、auth.usersテーブルにサンプルユーザーを作成
   - user_id: `b58180f4-3421-4e02-8903-e54d5acee1e9`
   - email: `test@example.com`
   - password: `testpassword123`

2. **user_settingsテーブルにサンプルユーザーを追加**
   ```sql
   INSERT INTO public.user_settings (id, created_at, updated_at)
   VALUES (
     'b58180f4-3421-4e02-8903-e54d5acee1e9',
     '2026-01-01 00:00:00+00',
     '2026-01-01 00:00:00+00'
   );
   ```

3. **goalsテーブルにサンプルユーザーの目標を追加**
   ```sql
   INSERT INTO public.goals (id, user_id, level, description, created_at, updated_at)
   VALUES
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'bronze', '毎日30分プログラミングする', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'silver', '1つの機能を完成させる', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'gold', 'リファクタリングまで完了させる', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');
   ```

4. **goal_history_slotsテーブルにサンプルユーザーの履歴を追加**
   ```sql
   INSERT INTO public.goal_history_slots (id, user_id, bronze_goal, silver_goal, gold_goal, start_date, end_date, change_reason, created_at, updated_at)
   VALUES
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '毎日30分プログラミングする', '1つの機能を完成させる', 'リファクタリングまで完了させる', '2026-01-01', NULL, 'initial', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');
   ```

5. **daily_recordsテーブルにサンプルユーザーの学習記録を追加**
   ```sql
   -- 2026-01-01から2026-01-14まで（Bronze連続14日達成）
   INSERT INTO public.daily_records (id, user_id, date, achievement_level, do_text, journal_text, created_at, updated_at)
   VALUES
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-01', 'bronze', 'データベースの基礎を学習', 'SQLの基本が理解できた。', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-02', 'bronze', 'APIの設計について学習', 'RESTfulな設計の重要性が分かった。', '2026-01-02 00:00:00+00', '2026-01-02 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-03', 'silver', 'Git/GitHubの使い方を復習', 'ブランチの使い方が理解できた。', '2026-01-03 00:00:00+00', '2026-01-03 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-04', 'silver', 'コードレビューの観点を学習', '他人のコードを読む練習になった。', '2026-01-04 00:00:00+00', '2026-01-04 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-05', 'gold', 'テストコードの書き方を学習', 'Jestの基本的な使い方が分かった。', '2026-01-05 00:00:00+00', '2026-01-05 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-06', 'gold', 'パフォーマンス最適化について学習', '遅延読み込みの重要性が理解できた。', '2026-01-06 00:00:00+00', '2026-01-06 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-07', 'silver', 'セキュリティについて学習', 'XSS対策の重要性が分かった。', '2026-01-07 00:00:00+00', '2026-01-07 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-08', 'bronze', 'アクセシビリティについて学習', 'WAI-ARIAの基本が理解できた。', '2026-01-08 00:00:00+00', '2026-01-08 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-09', 'silver', 'デプロイ方法について学習', 'Vercelの使い方が分かった。', '2026-01-09 00:00:00+00', '2026-01-09 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-10', 'gold', 'モニタリング・ログ管理について学習', '成長を実感できている。', '2026-01-10 00:00:00+00', '2026-01-10 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-11', 'silver', 'CI/CDパイプライン構築', '自動化の重要性が分かった。', '2026-01-11 00:00:00+00', '2026-01-11 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-12', 'bronze', 'ドキュメント作成', '伝わる文章を意識した。', '2026-01-12 00:00:00+00', '2026-01-12 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-13', 'gold', 'パフォーマンスチューニング', '最適化のコツが掴めた。', '2026-01-13 00:00:00+00', '2026-01-13 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-14', 'gold', 'リファクタリング実践', '14日連続達成！少しずつ成長している。', '2026-01-14 00:00:00+00', '2026-01-14 00:00:00+00');
   ```

### フェーズ1: データベースとバックエンド準備

6. **Rechartsライブラリのインストール**
   ```bash
   npm install recharts
   ```

7. **`goal_level_history`テーブルのマイグレーション作成**
   - `supabase/migrations/[timestamp]_create_goal_level_history.sql`を作成
   - `npx supabase db push`でデータベースに反映

8. **`goal_level_history`テーブルにサンプルユーザーのテストデータを追加**
   ```sql
   -- Bronze: Lv.1 (2026-01-01～2026-01-14)
   INSERT INTO public.goal_level_history (id, user_id, goal_type, level, goal_content, started_at, ended_at, change_reason, created_at, updated_at)
   VALUES
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'bronze', 1, '毎日30分プログラミングする', '2026-01-01 00:00:00+00', NULL, 'initial', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'silver', 1, '1つの機能を完成させる', '2026-01-01 00:00:00+00', NULL, 'initial', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
     (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'gold', 1, 'リファクタリングまで完了させる', '2026-01-01 00:00:00+00', NULL, 'initial', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');
   ```

9. **データベースアクセスレイヤーの実装**
   - `lib/db/goal-level-history.ts`を作成
   - 関数の実装とエクスポート

10. **API Routesの実装**
    - `app/api/history/achievement/route.ts`を作成
    - `app/api/history/level-history/route.ts`を作成
    - 認証チェックとデータ取得ロジックの実装

### フェーズ2: 型定義とコンポーネント準備

11. **型定義ファイルの作成**
    - `types/history.ts`を作成
    - 必要な型をすべて定義

12. **履歴画面のページファイル作成**
    - `app/history/page.tsx`を作成
    - メタデータとレイアウトを定義

### フェーズ3: UIコンポーネント実装

13. **メインチャートコンポーネントの実装**
    - `app/history/_components/HistoryCharts.tsx`を作成
    - API呼び出しとデータ管理
    - ローディング・エラーハンドリング

14. **折れ線グラフコンポーネントの実装**
    - `app/history/_components/AchievementLineChart.tsx`を作成
    - Rechartsの`LineChart`を使用
    - レベル変更期間のラベル表示実装

15. **棒グラフコンポーネントの実装**
    - `app/history/_components/LevelBarChart.tsx`を作成
    - Rechartsの`BarChart`を使用
    - 日ごとのセグメント分割と色分け実装

16. **目標ラベルコンポーネントの実装**
    - `app/history/_components/GoalLabels.tsx`を作成
    - 左側固定表示
    - 中央縦線の位置に応じた動的更新

17. **中央縦線コンポーネントの実装**
    - `app/history/_components/CenterLine.tsx`を作成
    - 画面中央に固定表示

### フェーズ4: ナビゲーション統合

18. **サイドバーメニューの更新**
    - `components/Sidebar.tsx`（または該当するファイル）を修正
    - 「履歴」メニュー項目を追加
    - メニュー順序を調整

### フェーズ5: テストと調整

19. **サンプルユーザーでログインしてテスト**
    - email: `test@example.com`
    - password: `testpassword123`
    - サンプルユーザーでログインして履歴画面を確認

20. **動作確認**
    - 開発サーバーを起動して画面表示を確認
    - データ取得が正しく行われるか確認
    - 横スクロール動作の確認
    - 中央縦線と目標表示の連動確認

21. **パフォーマンスチェック**
    - 大量データでの表示速度確認
    - 必要に応じて仮想化や最適化を検討

22. **UI/UXの調整**
    - レスポンシブデザインの確認
    - グラフの色やサイズの調整
    - ラベルの可読性確認

## 想定される影響範囲

### 新規作成ファイル
- データベーステーブル: `goal_level_history`
- API Routes: `/api/history/achievement`, `/api/history/level-history`
- 画面: `/history`
- コンポーネント: `HistoryCharts`, `AchievementLineChart`, `LevelBarChart`, `GoalLabels`, `CenterLine`
- 型定義: `types/history.ts`
- DBアクセス: `lib/db/goal-level-history.ts`

### 既存ファイルの修正
- `components/Sidebar.tsx`（または該当するナビゲーションファイル）: メニュー項目追加

### データベース変更
- 新規テーブル`goal_level_history`の追加
- RLSポリシーの追加
- インデックスの追加

### 既存機能への影響
- **目標編集機能**: 目標を変更する際、`goal_level_history`テーブルにもエントリーを追加する必要がある
  - **重要**: 今後の目標編集画面の実装時に、このテーブルへのデータ挿入処理を追加する必要がある
  - 現時点では履歴画面の表示のみを実装し、履歴の記録機能は別タスクとする

## テスト方針

### 1. データベーステスト
- `goal_level_history`テーブルへのCRUD操作
- RLSポリシーの動作確認
- インデックスによるパフォーマンス向上の確認

### 2. API Routesテスト
- 認証なしでのアクセス拒否
- 正常なデータ取得
- エラーハンドリング

### 3. UIコンポーネントテスト
- データがない場合の表示
- データがある場合のグラフ描画
- 横スクロールの動作
- 中央縦線の位置
- 目標ラベルの動的更新

### 4. 統合テスト
- サイドバーからの遷移
- ページ全体のレイアウト
- レスポンシブデザイン

## 注意事項とリスク

### 注意事項
1. **データ移行が必要**
   - 既存ユーザーの目標情報を`goal_level_history`テーブルに初期データとして登録する必要がある
   - `goals`テーブルの現在の目標を`initial`として`goal_level_history`に登録する移行スクリプトが必要
   - 実装計画の一部として、次のステップで移行スクリプトを作成する

2. **目標編集機能との連携**
   - 目標編集画面（`app/goal-edit/page.tsx`など）で目標を変更する際、`goal_level_history`テーブルへの追加処理が必要
   - 現在の実装計画には含まれていないため、別タスクとして管理する

3. **パフォーマンス**
   - 全期間表示のため、データ量が多い場合は初回読み込みが遅くなる可能性
   - 将来的にReact Queryなどでキャッシュを実装予定

4. **React 19との互換性**
   - Rechartsが一部のReact 19機能で警告を出す可能性
   - 実装後、コンソールを確認して警告が出た場合は対応を検討

### リスク
1. **データ不整合**
   - `goal_level_history`テーブルと`goals`テーブルの同期が取れなくなるリスク
   - 目標変更時に必ず両方を更新する仕組みが必要

2. **パフォーマンス低下**
   - データ量が増えた場合、全期間取得が遅くなる可能性
   - 必要に応じてページネーションや仮想化の導入を検討

3. **UI/UX課題**
   - 横スクロールの操作性が悪い場合、ユーザー体験が低下する可能性
   - 実装後のフィードバックを元に調整が必要

## フェーズ6: 追加機能実装（横スクロール・中央縦線・左側固定ラベル）

現在の基本実装（フェーズ1〜5）が完了した後、以下の追加機能を実装します。

### 23. 横スクロール機能の実装

**目的**: 全期間のデータを横スクロールで閲覧可能にする

**実装内容**:
- `HistoryCharts.tsx`を修正
- グラフエリアに横スクロール可能なコンテナを追加
- グラフの幅をデータ数に応じて動的に計算（1日あたり約50px）
- スクロール位置を状態として管理

**コード変更箇所**:
```typescript
// app/history/_components/HistoryCharts.tsx

// グラフ幅を計算（1日あたり50px）
const chartWidth = Math.max(achievementData.length * 50, 800);

// スクロールコンテナ
<div
  ref={scrollContainerRef}
  className="overflow-x-auto"
  onScroll={handleScroll}
>
  <div style={{ width: chartWidth }}>
    {/* グラフコンポーネント */}
  </div>
</div>
```

### 24. 中央縦線コンポーネントの実装

**目的**: 画面中央に固定された縦線を表示し、現在フォーカス中の日付を示す

**実装内容**:
- `app/history/_components/CenterLine.tsx`を作成
- 画面中央に固定表示（position: fixed または sticky）
- グラフ全体を貫通する高さ
- 視認性の高い色（青色など）

**コード例**:
```typescript
// app/history/_components/CenterLine.tsx
'use client';

interface CenterLineProps {
  currentDate: string;
}

export default function CenterLine({ currentDate }: CenterLineProps) {
  return (
    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-500 pointer-events-none z-10">
      {/* 日付表示 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
        {currentDate}
      </div>
    </div>
  );
}
```

### 25. スクロール位置から中央日付を計算するロジック

**目的**: スクロール位置に応じて中央縦線が指す日付を計算

**実装内容**:
- `HistoryCharts.tsx`に`handleScroll`関数を追加
- スクロール位置からグラフ上の日付インデックスを計算
- 計算した日付を`centerLineDate`状態にセット

**コード例**:
```typescript
// app/history/_components/HistoryCharts.tsx

const scrollContainerRef = useRef<HTMLDivElement>(null);
const [centerLineDate, setCenterLineDate] = useState<string>(
  new Date().toISOString().split('T')[0]
);

const handleScroll = () => {
  if (!scrollContainerRef.current || achievementData.length === 0) return;

  const container = scrollContainerRef.current;
  const scrollLeft = container.scrollLeft;
  const containerWidth = container.clientWidth;
  const dayWidth = 50; // 1日あたりのピクセル幅

  // 中央位置の日付インデックスを計算
  const centerOffset = scrollLeft + containerWidth / 2;
  const dayIndex = Math.floor(centerOffset / dayWidth);

  // データ範囲内に収める
  const clampedIndex = Math.max(0, Math.min(dayIndex, achievementData.length - 1));

  if (achievementData[clampedIndex]) {
    setCenterLineDate(achievementData[clampedIndex].date);
  }
};

// 初期スクロール位置を今日に設定
useEffect(() => {
  if (scrollContainerRef.current && achievementData.length > 0) {
    const todayIndex = achievementData.findIndex(
      d => d.date === new Date().toISOString().split('T')[0]
    );
    if (todayIndex >= 0) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const dayWidth = 50;
      scrollContainerRef.current.scrollLeft = todayIndex * dayWidth - containerWidth / 2;
    }
  }
}, [achievementData]);
```

### 26. 左側固定の目標ラベルコンポーネント

**目的**: スクロールしても目標内容が左側に固定表示される

**実装内容**:
- `app/history/_components/GoalLabels.tsx`を作成
- 3つの目標（Gold/Silver/Bronze）のラベルを表示
- 中央縦線の日付に応じた目標内容を動的に表示
- `position: sticky`で左側に固定

**コード例**:
```typescript
// app/history/_components/GoalLabels.tsx
'use client';

import type { LevelHistoryData } from '@/types/history';

interface GoalLabelsProps {
  centerLineDate: string;
  levelHistoryData: LevelHistoryData[];
}

export default function GoalLabels({ centerLineDate, levelHistoryData }: GoalLabelsProps) {
  // 中央縦線の日付に対応する目標を取得
  const currentData = levelHistoryData.find(d => d.date === centerLineDate) || {
    bronze: 0,
    silver: 0,
    gold: 0,
    bronzeContent: '',
    silverContent: '',
    goldContent: '',
  };

  return (
    <div className="sticky left-0 w-64 bg-white z-20 border-r">
      {/* Gold */}
      <div className="h-[100px] flex items-center px-4 border-b">
        <div>
          <span className="text-amber-500 font-bold">Gold Lv.{currentData.gold}</span>
          <p className="text-sm text-gray-600 truncate">{currentData.goldContent}</p>
        </div>
      </div>

      {/* Silver */}
      <div className="h-[100px] flex items-center px-4 border-b">
        <div>
          <span className="text-slate-400 font-bold">Silver Lv.{currentData.silver}</span>
          <p className="text-sm text-gray-600 truncate">{currentData.silverContent}</p>
        </div>
      </div>

      {/* Bronze */}
      <div className="h-[100px] flex items-center px-4 border-b">
        <div>
          <span className="text-orange-600 font-bold">Bronze Lv.{currentData.bronze}</span>
          <p className="text-sm text-gray-600 truncate">{currentData.bronzeContent}</p>
        </div>
      </div>
    </div>
  );
}
```

### 27. 横棒グラフへの変更

**目的**: 現在の縦棒グラフを横棒グラフに変更し、要件に合わせる

**実装内容**:
- Rechartsの`BarChart`の`layout="vertical"`を使用
- 各目標（Gold/Silver/Bronze）ごとに独立した横棒を描画
- 日ごとにセグメント分割し、レベルに応じた色分け

**コード例**:
```typescript
// app/history/_components/LevelBarChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import type { LevelHistoryData } from '@/types/history';

interface LevelBarChartProps {
  data: LevelHistoryData[];
  goalType: 'bronze' | 'silver' | 'gold';
}

// レベルに応じた色を返す
const getLevelColor = (goalType: string, level: number) => {
  const baseColors: Record<string, string[]> = {
    bronze: ['#FDDCAB', '#F5B041', '#CD7F32', '#8B4513'],  // 薄い→濃い
    silver: ['#D5DBDB', '#AEB6BF', '#94A3B8', '#6B7280'],
    gold: ['#FEF3C7', '#FCD34D', '#F59E0B', '#D97706'],
  };
  const colors = baseColors[goalType] || baseColors.bronze;
  return colors[Math.min(level, colors.length) - 1] || colors[0];
};

export default function LevelBarChart({ data, goalType }: LevelBarChartProps) {
  const levelKey = goalType as keyof LevelHistoryData;

  return (
    <ResponsiveContainer width="100%" height={60}>
      <BarChart data={data} layout="vertical" barCategoryGap={0}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="date" hide />
        <Bar dataKey={() => 1} stackId="stack">
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={getLevelColor(goalType, entry[levelKey] as number)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### 28. レベル変更期間の表示（ラベル付き区間）

**目的**: レベルアップ・ダウンが発生した期間を区間として表示し、評価ラベルを表示

**実装内容**:
- `goal_level_history`からレベル変更イベントを取得
- 各期間に応じた評価ラベルを計算
  - Goldレベルアップ: 「絶好調！」
  - Silverレベルアップ: 「そこそこの調子！」
  - Bronzeレベルアップ: 「習慣継続中！」
  - レベルダウン: 「不調気味...」
- ラベルが重ならないよう上下交互に配置

**コード例**:
```typescript
// app/history/_components/PeriodLabels.tsx
'use client';

import type { GoalLevelHistoryRecord } from '@/types/history';

interface PeriodLabelsProps {
  history: GoalLevelHistoryRecord[];
  chartWidth: number;
  dayWidth: number;
  startDate: string;
}

const getEvaluationLabel = (record: GoalLevelHistoryRecord): string => {
  if (record.change_reason === 'level_down') {
    return '不調気味...';
  }
  if (record.change_reason === 'level_up') {
    switch (record.goal_type) {
      case 'gold': return '絶好調！';
      case 'silver': return 'そこそこの調子！';
      case 'bronze': return '習慣継続中！';
    }
  }
  return '';
};

export default function PeriodLabels({ history, chartWidth, dayWidth, startDate }: PeriodLabelsProps) {
  // レベル変更イベントのみフィルタ（initialを除く）
  const levelChangeEvents = history.filter(h => h.change_reason !== 'initial');

  return (
    <div className="relative h-8" style={{ width: chartWidth }}>
      {levelChangeEvents.map((event, index) => {
        const label = getEvaluationLabel(event);
        if (!label) return null;

        // 開始日からの日数を計算
        const eventDate = new Date(event.started_at);
        const start = new Date(startDate);
        const daysDiff = Math.floor((eventDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const left = daysDiff * dayWidth;

        // 上下交互に配置
        const top = index % 2 === 0 ? 0 : 16;

        return (
          <div
            key={event.id}
            className="absolute text-xs whitespace-nowrap"
            style={{ left, top }}
          >
            <span className="bg-gray-100 px-1 rounded">
              {'<->'} {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

### 29. レベル変更の縦線表示

**目的**: レベル変更が発生した日付に縦線を引く

**実装内容**:
- `goal_level_history`からレベル変更日を取得
- 各変更日にグラフ全体を貫通する縦線を描画

**コード例**:
```typescript
// app/history/_components/LevelChangeLine.tsx
'use client';

interface LevelChangeLineProps {
  changeDate: string;
  dayWidth: number;
  startDate: string;
  height: number;
}

export default function LevelChangeLine({ changeDate, dayWidth, startDate, height }: LevelChangeLineProps) {
  const eventDate = new Date(changeDate);
  const start = new Date(startDate);
  const daysDiff = Math.floor((eventDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const left = daysDiff * dayWidth;

  return (
    <div
      className="absolute w-px bg-gray-400 pointer-events-none"
      style={{ left, height, top: 0 }}
    />
  );
}
```

### 30. HistoryChartsコンポーネントの統合

**目的**: すべての追加機能を統合したコンポーネントに更新

**実装内容**:
- 横スクロールコンテナ
- 中央縦線
- 左側固定ラベル
- 横棒グラフ
- レベル変更期間の表示
- レベル変更の縦線

**完成形のレイアウト構造**:
```
+------------------+----------------------------------------+
|                  |                                        |
| 目標ラベル        |          折れ線グラフ                    |
| (左側固定)        |          (横スクロール)                  |
|                  |              |                         |
| Gold Lv.1        |              |  中央縦線               |
| リファクタ...     |              |                         |
|                  |              |                         |
| Silver Lv.1      |--------------|--------------------------|
| 1機能完成...      |              |                         |
|                  |              |                         |
| Bronze Lv.1      |--------------|--------------------------|
| 30分プログラ...   |              |                         |
|                  |                                        |
+------------------+----------------------------------------+
                   |<------ 横スクロール可能エリア -------->|
```

## 実装の優先順位

追加機能の実装は以下の優先順位で進めます：

1. **横スクロール機能** - 基盤となる機能
2. **スクロール位置から中央日付を計算** - スクロールとの連携
3. **中央縦線コンポーネント** - 視覚的なフィードバック
4. **左側固定の目標ラベル** - 動的な目標表示
5. **横棒グラフへの変更** - 要件に合わせた表示
6. **レベル変更の縦線表示** - 期間の視覚化
7. **レベル変更期間の表示（ラベル付き区間）** - 評価ラベルの表示

## 次のステップ

1. ユーザーによる実装計画の承認
2. フェーズ1から順次実装開始
3. 各フェーズ完了後、動作確認とテスト
4. フェーズ6（追加機能）の実装
5. 全実装完了後、統合テストとUI/UX調整
6. 別タスク: 既存ユーザーの目標を`goal_level_history`に移行するスクリプト作成
7. 別タスク: 目標編集機能に`goal_level_history`への追加処理を実装
