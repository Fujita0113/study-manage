# 目標変遷画面（Goal History Timeline）実装計画

## 概要

目標（Bronze/Silver/Gold）の変遷を横スクロールのタイムライン形式で可視化する画面を実装します。特定の条件（14日連続達成、または7日中4日未達）によって発生する「目標内容の変更」の軌跡を、直感的に振り返ることができるようにします。

要件の詳細は [docs/requirements.md](docs/requirements.md) の「5. 目標変遷画面（Goal History Timeline）」を参照してください。

---

## 1. データモデルの設計・拡張

### 1.1 新しいエンティティ: GoalHistorySlot

目標変更の履歴を記録するための新しいエンティティを追加します。

#### TypeScript型定義

```typescript
/**
 * 目標変更の理由を表す
 */
export type GoalChangeReason =
  | 'bronze_14days'    // Bronze 14日連続達成
  | 'silver_14days'    // Silver 14日連続達成
  | 'gold_14days'      // Gold 14日連続達成
  | '7days_4fails'     // 7日中4日未達
  | 'initial';         // 初回設定

/**
 * 目標履歴スロット
 * 目標を変更するたびに新しいスロットが作成される
 */
export interface GoalHistorySlot {
  id: string;                      // UUID
  userId: string;                  // 外部キー: User.id

  // 目標内容（このスロット期間中の目標）
  bronzeGoal: string;              // Bronze目標の内容
  silverGoal: string;              // Silver目標の内容
  goldGoal: string;                // Gold目標の内容

  // 期間情報
  startDate: string;               // スロット開始日（YYYY-MM-DD）
  endDate?: string;                // スロット終了日（YYYY-MM-DD）、現在進行中の場合はnull

  // 変更理由（このスロットが作成された理由）
  changeReason: GoalChangeReason;

  // メタデータ
  createdAt: Date;                 // 作成日時
  updatedAt: Date;                 // 最終更新日時
}
```

#### Supabaseテーブル定義（SQL）

```sql
-- Goal History Slots テーブル
CREATE TABLE goal_history_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 目標内容
  bronze_goal TEXT NOT NULL CHECK (char_length(bronze_goal) BETWEEN 1 AND 500),
  silver_goal TEXT NOT NULL CHECK (char_length(silver_goal) BETWEEN 1 AND 500),
  gold_goal TEXT NOT NULL CHECK (char_length(gold_goal) BETWEEN 1 AND 500),

  -- 期間情報
  start_date DATE NOT NULL,
  end_date DATE,

  -- 変更理由
  change_reason TEXT NOT NULL CHECK (
    change_reason IN ('bronze_14days', 'silver_14days', 'gold_14days', '7days_4fails', 'initial')
  ),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_goal_history_slots_user_id ON goal_history_slots(user_id);
CREATE INDEX idx_goal_history_slots_start_date ON goal_history_slots(start_date DESC);

-- 自動更新トリガー
CREATE TRIGGER update_goal_history_slots_updated_at
BEFORE UPDATE ON goal_history_slots
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 データモデルの追加箇所

以下のファイルに新しい型定義を追加します：

**[types/index.ts](types/index.ts):**
```typescript
// Goal History
export type GoalChangeReason =
  | 'bronze_14days'
  | 'silver_14days'
  | 'gold_14days'
  | '7days_4fails'
  | 'initial';

export interface GoalHistorySlot {
  id: string;
  userId: string;
  bronzeGoal: string;
  silverGoal: string;
  goldGoal: string;
  startDate: string;
  endDate?: string;
  changeReason: GoalChangeReason;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 2. データベースアクセス層の実装

### 2.1 [lib/db.ts](lib/db.ts) に関数を追加

```typescript
// ==================== Goal History Slots ====================

/**
 * 目標履歴スロットを全て取得（新しい順）
 */
export async function getGoalHistorySlots(
  userId: string = MOCK_USER_ID
): Promise<GoalHistorySlot[]> {
  // TODO: Supabaseクエリに置き換える
  return mockGoalHistorySlots.sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  );
}

/**
 * 現在進行中のスロットを取得
 */
export async function getCurrentGoalSlot(
  userId: string = MOCK_USER_ID
): Promise<GoalHistorySlot | null> {
  const slots = await getGoalHistorySlots(userId);
  return slots.find(slot => !slot.endDate) || null;
}

/**
 * 新しい目標履歴スロットを作成
 * 同時に、現在進行中のスロットを終了させる
 */
export async function createGoalHistorySlot(
  bronzeGoal: string,
  silverGoal: string,
  goldGoal: string,
  changeReason: GoalChangeReason,
  userId: string = MOCK_USER_ID
): Promise<GoalHistorySlot> {
  // 1. 現在進行中のスロットを終了させる
  const currentSlot = await getCurrentGoalSlot(userId);
  if (currentSlot) {
    await endGoalHistorySlot(currentSlot.id);
  }

  // 2. 新しいスロットを作成
  const today = new Date().toISOString().split('T')[0];
  const newSlot: GoalHistorySlot = {
    id: `slot-${Date.now()}`,
    userId,
    bronzeGoal,
    silverGoal,
    goldGoal,
    startDate: today,
    endDate: undefined,
    changeReason,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // TODO: Supabase insert
  return newSlot;
}

/**
 * スロットを終了させる（endDateを設定）
 */
export async function endGoalHistorySlot(
  slotId: string
): Promise<GoalHistorySlot> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const endDate = yesterday.toISOString().split('T')[0];

  // TODO: Supabase update
  // UPDATE goal_history_slots SET end_date = endDate WHERE id = slotId

  return {} as GoalHistorySlot; // Placeholder
}
```

### 2.2 [lib/mockData.ts](lib/mockData.ts) にモックデータを追加

```typescript
export const mockGoalHistorySlots: GoalHistorySlot[] = [
  {
    id: 'slot-1',
    userId: MOCK_USER_ID,
    bronzeGoal: '毎日30分プログラミングする',
    silverGoal: '1つの機能を完成させる',
    goldGoal: 'リファクタリングまで完了させる',
    startDate: '2026-01-01',
    endDate: '2026-01-14',
    changeReason: 'initial',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'slot-2',
    userId: MOCK_USER_ID,
    bronzeGoal: '毎日1時間プログラミングする',
    silverGoal: '2つの機能を完成させる',
    goldGoal: 'テストコードも書く',
    startDate: '2026-01-15',
    endDate: undefined, // 現在進行中
    changeReason: 'bronze_14days',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
];
```

---

## 3. 目標編集画面の更新

### 3.1 [app/goals/page.tsx](app/goals/page.tsx) の handleSave を修正

目標を更新する際に、新しいスロットを作成するロジックを追加します。

```typescript
// 保存処理
const handleSave = async () => {
  if (!bronzeDesc.trim() || !silverDesc.trim() || !goldDesc.trim()) {
    alert('すべての目標を入力してください');
    return;
  }

  try {
    // 1. Goalテーブルを更新
    await updateGoal('bronze', bronzeDesc.trim());
    await updateGoal('silver', silverDesc.trim());
    await updateGoal('gold', goldDesc.trim());

    // 2. 新しい目標履歴スロットを作成
    const changeReason = determineChangeReason(editParam); // editパラメータから理由を判定
    await createGoalHistorySlot(
      bronzeDesc.trim(),
      silverDesc.trim(),
      goldDesc.trim(),
      changeReason
    );

    router.push('/');
  } catch (error) {
    console.error('Failed to update goals:', error);
    alert('目標の更新に失敗しました');
  }
};

/**
 * editパラメータから変更理由を判定
 */
function determineChangeReason(editParam: string | null): GoalChangeReason {
  switch (editParam) {
    case 'bronze':
      return 'bronze_14days';
    case 'silver':
      return 'silver_14days';
    case 'gold':
      return 'gold_14days';
    case 'all':
      return '7days_4fails';
    default:
      return 'initial';
  }
}
```

---

## 4. サイドバーの更新

### 4.1 [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx) に「目標変遷」メニューを追加

```typescript
import { HomeIcon, CalendarIcon, SettingsIcon, HistoryIcon } from '../icons';

const navItems = [
  { href: '/', label: 'ホーム', icon: HomeIcon },
  { href: '/record', label: '記録', icon: RecordIcon }, // 既存の記録画面へのリンク
  { href: '/calendar', label: 'カレンダー', icon: CalendarIcon },
  { href: '/history', label: '目標変遷', icon: HistoryIcon }, // 新規追加
  { href: '/settings', label: '設定', icon: SettingsIcon },
];
```

### 4.2 [components/icons.tsx](components/icons.tsx) に HistoryIcon を追加

```typescript
export function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
```

---

## 5. 目標変遷画面の実装

### 5.1 新規ファイル: [app/history/page.tsx](app/history/page.tsx)

```typescript
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { getGoalHistorySlots, getStreak } from '@/lib/db';
import type { GoalHistorySlot, Streak } from '@/types';
import { GoalSlotCard } from '@/components/history/GoalSlotCard';
import { GoalTransitionArrow } from '@/components/history/GoalTransitionArrow';

export default function HistoryPage() {
  const [slots, setSlots] = useState<GoalHistorySlot[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedSlots, fetchedStreak] = await Promise.all([
          getGoalHistorySlots(),
          getStreak(),
        ]);
        setSlots(fetchedSlots);
        setStreak(fetchedStreak);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load history:', error);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <AppLayout pageTitle="目標変遷">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  // 初回起動時（スロットが1つもない場合）
  if (slots.length === 0) {
    return (
      <AppLayout pageTitle="目標変遷">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-slate-600 text-lg">まだ目標変更履歴がありません</p>
            <p className="text-slate-500 text-sm mt-2">
              目標を変更すると、ここに変遷の履歴が表示されます
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="目標変遷">
      <div className="pb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">目標変遷タイムライン</h1>

        {/* 横スクロールコンテナ */}
        <div className="overflow-x-auto pb-4">
          <div className="flex items-start gap-4 min-w-max">
            {slots.map((slot, index) => (
              <div key={slot.id} className="flex items-start">
                <GoalSlotCard
                  slot={slot}
                  isCurrentSlot={!slot.endDate}
                  currentStreak={!slot.endDate ? streak?.currentStreak || 0 : undefined}
                />

                {/* 次のスロットがある場合、矢印を表示 */}
                {index < slots.length - 1 && (
                  <GoalTransitionArrow changeReason={slots[index + 1].changeReason} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
```

### 5.2 新規コンポーネント: [components/history/GoalSlotCard.tsx](components/history/GoalSlotCard.tsx)

```typescript
'use client';

import { GoalHistorySlot } from '@/types';
import { LockIcon } from '@/components/icons';

interface GoalSlotCardProps {
  slot: GoalHistorySlot;
  isCurrentSlot: boolean;
  currentStreak?: number;
}

export function GoalSlotCard({ slot, isCurrentSlot, currentStreak }: GoalSlotCardProps) {
  // 期間の長さを計算（カードの幅を決定）
  const duration = calculateDuration(slot.startDate, slot.endDate);
  const cardWidth = Math.max(300, duration * 20); // 最小300px、1日あたり20px

  return (
    <div
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
      style={{ minWidth: `${cardWidth}px` }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500">
            {formatDateRange(slot.startDate, slot.endDate)}
          </p>
          {isCurrentSlot && (
            <div className="flex items-center gap-2 mt-1">
              <LockIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">編集ロック中</span>
            </div>
          )}
        </div>

        {/* 現在進行中のスロットの場合、ストリーク表示 */}
        {isCurrentSlot && currentStreak !== undefined && (
          <div className="text-right">
            <p className="text-xs text-slate-500">現在のストリーク</p>
            <p className="text-lg font-bold text-blue-600">{currentStreak} / 14日</p>
          </div>
        )}
      </div>

      {/* 目標内容 */}
      <div className="space-y-3">
        <GoalItem level="Bronze" description={slot.bronzeGoal} />
        <GoalItem level="Silver" description={slot.silverGoal} />
        <GoalItem level="Gold" description={slot.goldGoal} />
      </div>
    </div>
  );
}

function GoalItem({ level, description }: { level: string; description: string }) {
  const colorClass =
    level === 'Bronze' ? 'bg-amber-100 text-amber-800' :
    level === 'Silver' ? 'bg-slate-100 text-slate-800' :
    'bg-yellow-100 text-yellow-800';

  return (
    <div>
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colorClass} mb-1`}>
        {level}
      </span>
      <p className="text-sm text-slate-700">{description}</p>
    </div>
  );
}

/**
 * 期間の日数を計算
 */
function calculateDuration(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 日付範囲をフォーマット
 */
function formatDateRange(startDate: string, endDate?: string): string {
  const start = new Date(startDate).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'numeric', day: 'numeric'
  });

  if (!endDate) {
    return `${start} 〜 現在`;
  }

  const end = new Date(endDate).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'numeric', day: 'numeric'
  });

  return `${start} 〜 ${end}`;
}
```

### 5.3 新規コンポーネント: [components/history/GoalTransitionArrow.tsx](components/history/GoalTransitionArrow.tsx)

```typescript
'use client';

import { GoalChangeReason } from '@/types';

interface GoalTransitionArrowProps {
  changeReason: GoalChangeReason;
}

export function GoalTransitionArrow({ changeReason }: GoalTransitionArrowProps) {
  const config = getArrowConfig(changeReason);

  return (
    <div className="flex flex-col items-center justify-center px-4">
      {/* 矢印 */}
      <div className={`text-4xl ${config.color}`}>
        {config.arrow}
      </div>

      {/* ラベル */}
      <p className={`text-xs font-medium mt-2 ${config.textColor} whitespace-nowrap`}>
        {config.label}
      </p>
    </div>
  );
}

function getArrowConfig(reason: GoalChangeReason) {
  switch (reason) {
    case 'bronze_14days':
    case 'silver_14days':
    case 'gold_14days':
      return {
        arrow: '↗️',
        label: '14日連続達成',
        color: 'text-green-500',
        textColor: 'text-green-700',
      };
    case '7days_4fails':
      return {
        arrow: '↘️',
        label: '目標調整',
        color: 'text-orange-500',
        textColor: 'text-orange-700',
      };
    default:
      return {
        arrow: '→',
        label: '目標変更',
        color: 'text-slate-400',
        textColor: 'text-slate-600',
      };
  }
}
```

### 5.4 新規アイコン: [components/icons.tsx](components/icons.tsx) に LockIcon を追加

```typescript
export function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
```

---

## 6. 実装手順

### Phase 1: データモデル・DB層の準備

1. **[types/index.ts](types/index.ts) に型定義を追加**
   - `GoalChangeReason` 型
   - `GoalHistorySlot` インターフェース

2. **[lib/mockData.ts](lib/mockData.ts) にモックデータを追加**
   - `mockGoalHistorySlots` 配列

3. **[lib/db.ts](lib/db.ts) に関数を追加**
   - `getGoalHistorySlots()`
   - `getCurrentGoalSlot()`
   - `createGoalHistorySlot()`
   - `endGoalHistorySlot()`

### Phase 2: UI コンポーネントの実装

4. **[components/icons.tsx](components/icons.tsx) にアイコンを追加**
   - `HistoryIcon`
   - `LockIcon`

5. **[components/history/GoalSlotCard.tsx](components/history/GoalSlotCard.tsx) を作成**
   - スロットカードのコンポーネント

6. **[components/history/GoalTransitionArrow.tsx](components/history/GoalTransitionArrow.tsx) を作成**
   - 遷移矢印のコンポーネント

7. **[app/history/page.tsx](app/history/page.tsx) を作成**
   - 目標変遷画面のメインページ

### Phase 3: サイドバー・目標編集画面の更新

8. **[components/layout/Sidebar.tsx](components/layout/Sidebar.tsx) を更新**
   - 「目標変遷」メニュー項目を追加

9. **[app/goals/page.tsx](app/goals/page.tsx) の handleSave を更新**
   - 目標更新時に新しいスロットを作成するロジックを追加

### Phase 4: 動作確認

10. **動作確認**
    - サイドバーから「目標変遷」にアクセスできるか
    - スロットが正しく表示されるか
    - 横スクロールが機能するか
    - 矢印が適切に表示されるか
    - 現在進行中のスロットにロックアイコンとストリーク表示があるか

---

## 7. 注意事項

### 初回起動時の処理

- アプリの初回起動時、まだ目標が設定されていない場合、スロットは存在しません
- 最初に目標を設定した際に、`changeReason: 'initial'` で最初のスロットを作成する必要があります
- この処理は、初回の目標設定画面（または目標編集画面）の保存処理に組み込む必要があります

### Supabaseへの移行

- 現在はモックデータで実装しますが、将来的にSupabaseに移行する際は以下の対応が必要です：
  1. `goal_history_slots` テーブルの作成
  2. [lib/db.ts](lib/db.ts) の各関数をSupabaseクエリに置き換え
  3. リレーションシップの設定（User → GoalHistorySlot）

### パフォーマンス考慮事項

- スロットが多数ある場合、横スクロールのパフォーマンスが低下する可能性があります
- 将来的には、仮想化（Virtualization）の導入を検討してください

---

## 8. 将来の拡張機能

以下の機能は現時点では実装不要ですが、将来的に検討できます：

- **スロット詳細表示**: スロットをタップすると、その期間中の日ごとの達成状況カレンダーをポップアップで表示
- **フィルタリング**: 特定の期間や変更理由でスロットをフィルタリング
- **統計情報**: 平均スロット期間、最長スロット期間などの統計を表示
- **エクスポート機能**: タイムラインをPDFや画像で出力

---

## まとめ

この実装計画に従って、目標変遷画面を段階的に実装していきます。各フェーズを完了するごとに動作確認を行い、要件通りに機能することを確認してください。
