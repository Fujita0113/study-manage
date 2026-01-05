# 実装計画書 - 学習管理アプリケーション

**対象読者**: ジュニアエンジニア
**目的**: モックデータを使用したフロントエンド実装の完全ガイド
**前提条件**: データモデル、型定義、モックデータは既に完成済み

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [既に完成しているもの](#既に完成しているもの)
3. [実装する画面一覧](#実装する画面一覧)
4. [画面別実装ガイド](#画面別実装ガイド)
5. [共通コンポーネント](#共通コンポーネント)
6. [実装の順序](#実装の順序)
7. [トラブルシューティング](#トラブルシューティング)

---

## 🎯 プロジェクト概要

学習習慣を記録・管理するためのダッシュボードアプリケーションです。

### 主な機能
- **目標管理**: Bronze/Silver/Goldの3段階目標
- **日次記録**: PDCAサイクルに基づく振り返り
- **工夫管理**: 目標達成のための施策を記録・評価
- **ストリーク表示**: 連続達成日数の可視化
- **GitHub連携**: コミット履歴の表示（モック）

### 技術スタック
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Context (モックデータプロバイダー)
- **データベース**: Prisma + PostgreSQL (現在はモックデータのみ)

---

## ✅ 既に完成しているもの

### 1. データモデル定義
- **ファイル**: `prisma/schema.prisma`
- **内容**: UserSettings, Goal, Effort, DailyRecord, EffortEvaluation, Streak

### 2. TypeScript型定義
- **ファイル**: `types/index.ts`
- **内容**: すべてのエンティティの型とUI用の拡張型

### 3. モックデータジェネレーター
- **ファイル**: `lib/mockData.ts`
- **内容**: 各画面のテストに必要な完全なモックデータセット
- **データ内容**:
  - ユーザー設定（GitHub連携情報含む）
  - 3つの目標（Bronze/Silver/Gold）
  - 6つの工夫（各レベル2つずつ、アーカイブ1つ含む）
  - 過去7日分の日次記録
  - 昨日の工夫評価データ
  - ストリーク情報（現在7日連続）
  - GitHubコミット履歴

### 4. データベースアクセス関数
- **ファイル**: `lib/db.ts`
- **内容**: すべてのCRUD操作（現在はモックデータを返す）
- **関数例**:
  - `getGoals()`: 目標一覧取得
  - `getEfforts()`: 工夫一覧取得
  - `getDailyRecords()`: 日次記録取得
  - `getSuggestion()`: レベルアップ/ダウン提案の判定

### 5. ユーティリティ関数
- **ファイル**: `lib/utils.ts`
- **内容**: 日付フォーマット、レベル表示、ラベル変換など

### 6. レイアウトコンポーネント
- **ファイル**:
  - `components/layout/Sidebar.tsx`: サイドバーナビゲーション
  - `components/layout/Header.tsx`: ヘッダー（ストリーク表示 + 記録ボタン）
  - `components/layout/AppLayout.tsx`: 全体レイアウト
- **状態管理**: `lib/store.tsx` (AppStateProvider)

---

## 📱 実装する画面一覧

### 必須画面（6画面）

| 画面名 | ルート | ファイルパス | 優先度 |
|--------|--------|------------|--------|
| ホーム | `/` | `app/page.tsx` | ⭐⭐⭐ |
| 記録・日報 | `/record` | `app/record/page.tsx` | ⭐⭐⭐ |
| カレンダー | `/calendar` | `app/calendar/page.tsx` | ⭐⭐ |
| 日詳細 | `/day/[date]` | `app/day/[date]/page.tsx` | ⭐⭐ |
| 工夫管理 | `/efforts` | `app/efforts/page.tsx` | ⭐⭐ |
| 目標編集 | `/goals` | `app/goals/page.tsx` | ⭐ |
| 設定 | `/settings` | `app/settings/page.tsx` | ⭐ |

---

## 🛠 画面別実装ガイド

### 1. ホーム画面（`app/page.tsx`）

#### 表示内容
- **今日の達成度ステータス**: 未記録 or 達成レベル表示
- **ストリークビジュアライザー**: 過去7日間のドット表示
- **提案バナー**: レベルアップ/ダウンの提案（条件合致時のみ）
- **GitHubコミット履歴**: 直近のコミットメッセージリスト

#### 使用するデータアクセス関数
```typescript
import { getDailyRecordByDate, getDailyRecords, getSuggestion, getGitHubCommits } from '@/lib/db';
import { formatDate } from '@/lib/utils';
```

#### 実装のポイント
1. **今日の日付を取得**
```typescript
const today = formatDate(new Date());
const todayRecord = await getDailyRecordByDate(today);
```

2. **過去7日分の記録を取得**
```typescript
const endDate = today;
const startDate = formatDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
const records = await getDailyRecords(MOCK_USER_ID, { startDate, endDate });
```

3. **提案バナーの表示判定**
```typescript
const suggestion = await getSuggestion();
// suggestion が null でない場合に表示
```

4. **ドットマップの実装**
```typescript
const last7Days = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return formatDate(date);
});

// 各日付の達成レベルに応じて色を変える
```

#### UI構成
```
┌─────────────────────────────────────┐
│ [今日の達成度ステータス]               │
├─────────────────────────────────────┤
│ [GitHubコミット履歴]                  │
│ - feat: 新機能追加                    │
│ - fix: バグ修正                       │
│ [更新ボタン]                          │
├─────────────────────────────────────┤
│ サイドエリア:                         │
│ [ストリークビジュアライザー]           │
│ ● ● ● ● ● ● ●  (7日分のドット)      │
│                                     │
│ [提案バナー] (条件合致時のみ)          │
│ 「レベルアップの条件を満たしました」   │
│ [目標を編集する]ボタン                │
└─────────────────────────────────────┘
```

---

### 2. 記録・日報画面（`app/record/page.tsx`）

#### 表示内容
- **CHECK**: 前日の工夫の答え合わせ
- **DO**: 今日の目標達成度選択（Bronze/Silver/Gold）
- **ACT/PLAN**: 工夫のステータス更新 + 新しい工夫の追加
- **Step-Up Strategy**: 次のレベルへの架け橋（Bronze/Silver達成時のみ）
- **Journal**: 自由記述

#### 使用するデータアクセス関数
```typescript
import {
  getEfforts,
  getDailyRecordByDate,
  createDailyRecord,
  createEffortEvaluation,
  updateEffort
} from '@/lib/db';
```

#### 実装のポイント

##### STEP 1: CHECKセクション - 前日の工夫評価
```typescript
// 1. ステータスが 'active' の工夫をすべて取得
const activeEfforts = await getEfforts(MOCK_USER_ID, { status: 'active' });

// 2. 昨日の日付を取得
const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
const yesterdayRecord = await getDailyRecordByDate(yesterday);

// 3. 各工夫に対して評価入力フォームを表示
activeEfforts.map(effort => (
  <EffortCheckCard
    effort={effort}
    onEvaluate={(executed, effectiveness) => {
      // evaluated配列に追加
    }}
  />
));
```

##### STEP 2: DOセクション - 達成度選択
```typescript
const [achievementLevel, setAchievementLevel] = useState<AchievementLevel>('none');

// 3段階カードを表示
<div className="grid grid-cols-3 gap-4">
  <AchievementCard level="bronze" onClick={() => setAchievementLevel('bronze')} />
  <AchievementCard level="silver" onClick={() => setAchievementLevel('silver')} />
  <AchievementCard level="gold" onClick={() => setAchievementLevel('gold')} />
</div>
```

##### STEP 3: ACTセクション - 工夫のステータス更新
```typescript
// 各工夫の評価に対して、次のアクションを選択
effortEvaluations.map(evaluation => (
  <EffortActionSelector
    evaluation={evaluation}
    onSelect={(nextAction, reason) => {
      // nextAction: 'continue' | 'improve' | 'stop'
      // reason: 終了理由 or 改良案
    }}
  />
));
```

##### STEP 4: PLANセクション - 新しい工夫の追加
```typescript
const [newEffortTitle, setNewEffortTitle] = useState('');
const [newEffortLevel, setNewEffortLevel] = useState<GoalLevel>('bronze');

// 今日の達成レベルに基づいて紐づけ
```

##### STEP 5: Step-Up Strategy（条件付き表示）
```typescript
// Bronze または Silver を達成した場合のみ表示
{achievementLevel !== 'gold' && achievementLevel !== 'none' && (
  <textarea
    placeholder="もし今日、一段上の目標を達成するとしたら、何が足りなかった？"
    value={stepUpStrategy}
    onChange={(e) => setStepUpStrategy(e.target.value)}
  />
)}
```

##### STEP 6: 保存処理
```typescript
const handleSubmit = async () => {
  const today = formatDate(new Date());

  // 1. 日次記録を作成
  const dailyRecord = await createDailyRecord({
    date: today,
    achievementLevel,
    journalText: journal,
    stepUpStrategy: stepUpStrategy || undefined,
  });

  // 2. 工夫評価を保存
  for (const evaluation of effortEvaluations) {
    await createEffortEvaluation({
      dailyRecordId: dailyRecord.id,
      effortId: evaluation.effortId,
      executed: evaluation.executed,
      effectiveness: evaluation.effectiveness,
      nextAction: evaluation.nextAction,
      reason: evaluation.reason,
    });

    // 3. 工夫のステータスを更新
    if (evaluation.nextAction === 'stop') {
      await updateEffort(evaluation.effortId, { status: 'archived' });
    }
  }

  // 4. 新しい工夫を作成
  // ...

  // 5. ホーム画面へ遷移
  router.push('/');
};
```

#### UI構成
```
┌─────────────────────────────────────┐
│ STEP 1: CHECK - 前日の工夫の答え合わせ │
├─────────────────────────────────────┤
│ 工夫: ジャージで寝る [Bronze]          │
│ [ ] 実行できた [ ] できなかった          │
│ [ ] 最高 [ ] 微妙 [ ] 逆効果            │
├─────────────────────────────────────┤
│ STEP 2: DO - 今日の目標達成度          │
│ [Bronze] [Silver] [Gold]             │
├─────────────────────────────────────┤
│ STEP 3: ACT - 工夫のステータス更新      │
│ [ ] そのまま継続                      │
│ [ ] 改良して継続 → [改良案入力]        │
│ [ ] 今日で終了 → [理由入力]            │
├─────────────────────────────────────┤
│ STEP 4: PLAN - 新しい工夫              │
│ [工夫内容入力]                        │
│ [レベル選択: Bronze/Silver/Gold]      │
├─────────────────────────────────────┤
│ STEP 5: Step-Up Strategy (条件付き)   │
│ [次のレベルへの課題入力]               │
├─────────────────────────────────────┤
│ STEP 6: Journal - 自由記述             │
│ [今日の感想入力]                      │
├─────────────────────────────────────┤
│ [記録を確定してロックする]              │
└─────────────────────────────────────┘
```

---

### 3. カレンダー画面（`app/calendar/page.tsx`）

#### 表示内容
- **月次カレンダー**: 当月の全日付を表示
- **日付セル**: 達成度に応じた色分け
- **ホバーツールチップ**: 目標とジャーナルの冒頭を表示

#### 使用するデータアクセス関数
```typescript
import { getDailyRecords } from '@/lib/db';
import { formatDate, getDaysInMonth } from '@/lib/utils';
```

#### 実装のポイント

##### 1. 月の日付リストを生成
```typescript
const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

const daysInMonth = getDaysInMonth(currentYear, currentMonth);
```

##### 2. 該当月の記録を取得
```typescript
const startDate = formatDate(new Date(currentYear, currentMonth - 1, 1));
const endDate = formatDate(new Date(currentYear, currentMonth, 0));
const records = await getDailyRecords(MOCK_USER_ID, { startDate, endDate });
```

##### 3. カレンダーグリッドの構築
```typescript
// 月の最初の曜日を取得（0: 日曜、1: 月曜...）
const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

// 空白セルを追加
const calendarCells = Array(firstDayOfWeek).fill(null);

// 日付セルを追加
daysInMonth.forEach(date => {
  const dateStr = formatDate(date);
  const record = records.find(r => r.date === dateStr);
  calendarCells.push({ date: dateStr, record });
});
```

##### 4. セルの色分け
```typescript
const getCellColor = (achievementLevel: AchievementLevel) => {
  switch (achievementLevel) {
    case 'gold': return 'bg-amber-500';
    case 'silver': return 'bg-slate-400';
    case 'bronze': return 'bg-[#CD7F32]';
    default: return 'bg-gray-200';
  }
};
```

##### 5. ホバーツールチップ
```typescript
<div className="group relative">
  <div className={cellColor}>
    {date.getDate()}
  </div>

  {record && (
    <div className="absolute hidden group-hover:block ...">
      <p>目標: {record.achievementLevel}</p>
      <p>{record.journalText?.substring(0, 50)}...</p>
    </div>
  )}
</div>
```

#### UI構成
```
┌─────────────────────────────────────┐
│ < 2025年1月 >                        │
├─────────────────────────────────────┤
│ 日 月 火 水 木 金 土                  │
├─────────────────────────────────────┤
│       1  2  3  4  5  6              │
│  7  8  9 10 11 12 13                │
│ 14 15 16 17 18 19 20                │
│ 21 22 23 24 25 26 27                │
│ 28 29 30 31                          │
└─────────────────────────────────────┘

※ 各セルは達成度に応じて色分け
※ ホバーでツールチップ表示
※ クリックで日詳細画面へ遷移
```

---

### 4. 日詳細画面（`app/day/[date]/page.tsx`）

#### 表示内容
- **達成度**: その日のBronze/Silver/Gold
- **工夫の評価**: 実行フラグ、実感効果、次のアクション
- **Step-Up Strategy**: 記載がある場合のみ
- **Journal**: 自由記述

#### 使用するデータアクセス関数
```typescript
import { getDailyRecordWithDetails } from '@/lib/db';
```

#### 実装のポイント

##### 1. URLパラメータから日付を取得
```typescript
// app/day/[date]/page.tsx
export default async function DayDetailPage({ params }: { params: { date: string } }) {
  const { date } = params; // YYYY-MM-DD
  const record = await getDailyRecordWithDetails(date);

  if (!record) {
    return <div>記録が見つかりません</div>;
  }

  // ...
}
```

##### 2. 工夫の評価を表示
```typescript
record.effortEvaluations.map(evaluation => (
  <div key={evaluation.id}>
    <h4>{evaluation.effort.title}</h4>
    <p>実行: {getExecutedLabel(evaluation.executed)}</p>
    <p>効果: {getEffectivenessLabel(evaluation.effectiveness)}</p>
    <p>次回: {getNextActionLabel(evaluation.nextAction)}</p>
    {evaluation.reason && <p>理由: {evaluation.reason}</p>}
  </div>
));
```

#### UI構成
```
┌─────────────────────────────────────┐
│ 2025/01/15 (水) の記録               │
├─────────────────────────────────────┤
│ 達成度: 🥇 Gold                      │
├─────────────────────────────────────┤
│ 工夫の評価:                          │
│ - ジャージで寝る [Bronze]            │
│   実行: できた / 効果: 最高            │
│   次回: そのまま継続                  │
├─────────────────────────────────────┤
│ Journal:                             │
│ 今日は集中力が続いた...              │
└─────────────────────────────────────┘
```

---

### 5. 工夫管理画面（`app/efforts/page.tsx`）

#### 表示内容
- **現在進行中の工夫一覧**: ステータスが 'active' の工夫
- **アーカイブ済み工夫一覧**: ステータスが 'archived' の工夫
- **編集機能**: 文言の微修正
- **再開機能**: アーカイブ済み工夫を再開

#### 使用するデータアクセス関数
```typescript
import { getEfforts, updateEffort, reactivateEffort } from '@/lib/db';
```

#### 実装のポイント

##### 1. アクティブな工夫を取得
```typescript
const activeEfforts = await getEfforts(MOCK_USER_ID, { status: 'active' });
```

##### 2. アーカイブ済み工夫を取得
```typescript
const archivedEfforts = await getEfforts(MOCK_USER_ID, { status: 'archived' });
```

##### 3. 工夫の編集（文言のみ）
```typescript
const handleEditTitle = async (effortId: string, newTitle: string) => {
  await updateEffort(effortId, { title: newTitle });
};
```

##### 4. 工夫の再開
```typescript
const handleReactivate = async (effortId: string) => {
  await reactivateEffort(effortId);
  // activatedAt が現在時刻に設定される
};
```

#### UI構成
```
┌─────────────────────────────────────┐
│ 現在進行中の工夫                      │
├─────────────────────────────────────┤
│ [Bronze] ジャージで寝る               │
│          [編集]                      │
│                                     │
│ [Silver] ポモドーロタイマーを使う      │
│          [編集]                      │
├─────────────────────────────────────┤
│ アーカイブ済み工夫                    │
├─────────────────────────────────────┤
│ [Bronze] アラームを10個セットする      │
│          理由: うるさくて逆効果        │
│          [明日から再開]               │
└─────────────────────────────────────┘
```

---

### 6. 目標編集画面（`app/goals/page.tsx`）

#### 表示内容
- **Bronze目標入力**: テキストボックス
- **Silver目標入力**: テキストボックス
- **Gold目標入力**: テキストボックス
- **更新ボタン**: 変更を保存

#### 使用するデータアクセス関数
```typescript
import { getGoals, updateGoal } from '@/lib/db';
```

#### 実装のポイント

##### 1. 現在の目標を取得
```typescript
const goals = await getGoals();
const bronzeGoal = goals.find(g => g.level === 'bronze');
const silverGoal = goals.find(g => g.level === 'silver');
const goldGoal = goals.find(g => g.level === 'gold');
```

##### 2. フォーム状態管理
```typescript
const [bronzeDesc, setBronzeDesc] = useState(bronzeGoal?.description || '');
const [silverDesc, setSilverDesc] = useState(silverGoal?.description || '');
const [goldDesc, setGoldDesc] = useState(goldGoal?.description || '');
```

##### 3. 保存処理
```typescript
const handleSave = async () => {
  await updateGoal('bronze', bronzeDesc);
  await updateGoal('silver', silverDesc);
  await updateGoal('gold', goldDesc);
  router.push('/');
};
```

#### UI構成
```
┌─────────────────────────────────────┐
│ 目標の編集                           │
├─────────────────────────────────────┤
│ Bronze目標（最低限）:                 │
│ [30分だけプログラミングする]           │
├─────────────────────────────────────┤
│ Silver目標（計画通り）:               │
│ [1つの機能を完成させる]               │
├─────────────────────────────────────┤
│ Gold目標（期待以上）:                 │
│ [リファクタリングまで完了させる]        │
├─────────────────────────────────────┤
│ [更新する]                           │
└─────────────────────────────────────┘
```

---

### 7. 設定画面（`app/settings/page.tsx`）

#### 表示内容
- **GitHubリポジトリURL**: テキスト入力
- **Personal Access Token**: パスワード入力（マスク表示）
- **ルール確認**: 固定テキスト表示

#### 使用するデータアクセス関数
```typescript
import { getUserSettings, updateUserSettings } from '@/lib/db';
```

#### 実装のポイント

##### 1. 現在の設定を取得
```typescript
const settings = await getUserSettings();
```

##### 2. フォーム状態管理
```typescript
const [githubRepo, setGithubRepo] = useState(settings.githubRepo || '');
const [githubToken, setGithubToken] = useState(settings.githubToken || '');
```

##### 3. 保存処理
```typescript
const handleSave = async () => {
  await updateUserSettings(MOCK_USER_ID, {
    githubRepo,
    githubToken,
  });
};
```

#### UI構成
```
┌─────────────────────────────────────┐
│ GitHub設定                           │
├─────────────────────────────────────┤
│ リポジトリURL:                       │
│ [owner/repository]                   │
│                                     │
│ Personal Access Token:               │
│ [••••••••••••]                      │
├─────────────────────────────────────┤
│ ルール確認                           │
│ - Gold 14日連続でレベルアップ提案     │
│ - Bronze未達4日以上でレベルダウン提案  │
├─────────────────────────────────────┤
│ [保存する]                           │
└─────────────────────────────────────┘
```

---

## 🧩 共通コンポーネント

実装を効率化するため、以下の再利用可能なコンポーネントを作成することを推奨します。

### 1. レベルバッジ (`components/ui/LevelBadge.tsx`)
```typescript
interface LevelBadgeProps {
  level: GoalLevel | AchievementLevel;
}

export function LevelBadge({ level }: LevelBadgeProps) {
  return (
    <span className={getLevelBadgeClass(level)}>
      {getLevelLabel(level)}
    </span>
  );
}
```

### 2. 達成度カード (`components/ui/AchievementCard.tsx`)
```typescript
interface AchievementCardProps {
  level: 'bronze' | 'silver' | 'gold';
  description: string;
  selected: boolean;
  onClick: () => void;
}
```

### 3. 工夫評価カード (`components/ui/EffortCheckCard.tsx`)
```typescript
interface EffortCheckCardProps {
  effort: Effort;
  onEvaluate: (executed: EffortExecuted, effectiveness: EffortEffectiveness) => void;
}
```

### 4. カレンダーセル (`components/ui/CalendarCell.tsx`)
```typescript
interface CalendarCellProps {
  date: string;
  record?: DailyRecord;
  onClick: () => void;
}
```

---

## 📝 実装の順序

以下の順序で実装することを推奨します：

### Phase 1: 基礎画面（重要度: ⭐⭐⭐）
1. **ホーム画面** (`app/page.tsx`)
   - モックデータの表示確認
   - ナビゲーションの動作確認

2. **記録・日報画面** (`app/record/page.tsx`)
   - アプリの中核機能
   - フォーム実装の練習になる

### Phase 2: 閲覧画面（重要度: ⭐⭐）
3. **カレンダー画面** (`app/calendar/page.tsx`)
   - 月次カレンダーの実装

4. **日詳細画面** (`app/day/[date]/page.tsx`)
   - Dynamic Routeの練習

### Phase 3: 管理画面（重要度: ⭐）
5. **工夫管理画面** (`app/efforts/page.tsx`)
   - CRUD操作の実装

6. **目標編集画面** (`app/goals/page.tsx`)
   - シンプルなフォーム

7. **設定画面** (`app/settings/page.tsx`)
   - 最もシンプル

---

## 🔍 トラブルシューティング

### よくあるエラーと解決方法

#### 1. `Cannot find module '@/types'`
**原因**: tsconfig.jsonのパス設定が不正
**解決方法**:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 2. `useAppState must be used within AppStateProvider`
**原因**: AppStateProviderが適用されていない
**解決方法**: `app/layout.tsx` で `<AppStateProvider>` が children を囲んでいるか確認

#### 3. モックデータが表示されない
**原因**: async/await の使い方が間違っている
**解決方法**:
```typescript
// ❌ 間違い
const goals = getGoals(); // Promise<Goal[]> が返る

// ✅ 正しい
const goals = await getGoals(); // Goal[] が返る
```

#### 4. 型エラー: `Type 'string' is not assignable to type 'GoalLevel'`
**原因**: 文字列リテラル型の扱いが間違っている
**解決方法**:
```typescript
// ❌ 間違い
const level = 'bronze'; // string型

// ✅ 正しい
const level: GoalLevel = 'bronze'; // GoalLevel型
```

#### 5. 日付フォーマットがおかしい
**原因**: タイムゾーンの考慮が不足
**解決方法**: `formatDate()` ユーティリティ関数を使用

---

## 📚 参考資料

### ドキュメント
- [requirements.md](./requirements.md): 機能要件の詳細
- [data-model.md](./data-model.md): データモデルの詳細

### コードファイル
- `lib/mockData.ts`: モックデータの内容確認
- `lib/db.ts`: 使用可能なデータアクセス関数一覧
- `lib/utils.ts`: ユーティリティ関数一覧
- `types/index.ts`: すべての型定義

### Next.js公式ドキュメント
- [App Router](https://nextjs.org/docs/app)
- [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Server Components vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## ✅ チェックリスト

実装完了前に以下を確認してください：

### 各画面共通
- [ ] AppLayout コンポーネントでラップされている
- [ ] ページタイトルが正しく設定されている
- [ ] モックデータが正しく表示される
- [ ] エラーハンドリングが実装されている（データが存在しない場合など）

### ホーム画面
- [ ] 今日の達成度が表示される
- [ ] ストリークビジュアライザーが表示される
- [ ] 提案バナーが条件に応じて表示される
- [ ] GitHubコミット履歴が表示される

### 記録・日報画面
- [ ] CHECKセクションで前日の工夫が表示される
- [ ] DOセクションで達成度を選択できる
- [ ] ACTセクションで工夫のステータスを更新できる
- [ ] PLANセクションで新しい工夫を追加できる
- [ ] 保存ボタンでホーム画面に遷移する

### カレンダー画面
- [ ] 月次カレンダーが表示される
- [ ] 達成度に応じて色分けされる
- [ ] ホバーでツールチップが表示される
- [ ] クリックで日詳細画面に遷移する

### 日詳細画面
- [ ] 指定日付の記録が表示される
- [ ] 工夫の評価が表示される
- [ ] 記録が存在しない場合のエラーメッセージが表示される

### 工夫管理画面
- [ ] アクティブな工夫が表示される
- [ ] アーカイブ済み工夫が表示される
- [ ] 工夫を編集できる
- [ ] アーカイブ済み工夫を再開できる

### 目標編集画面
- [ ] 現在の目標が初期値として表示される
- [ ] 3つの目標を編集できる
- [ ] 保存後にホーム画面に遷移する

### 設定画面
- [ ] GitHub設定を編集できる
- [ ] トークンがマスク表示される
- [ ] ルールが表示される

---

## 🎓 学習ポイント

この実装を通じて以下のスキルを習得できます：

1. **Next.js App Router**: 最新のルーティング方式
2. **TypeScript**: 型安全なコード記述
3. **非同期処理**: async/await の使い方
4. **状態管理**: React Context の使用
5. **フォーム処理**: ユーザー入力の扱い
6. **条件付きレンダリング**: UIの動的表示
7. **コンポーネント設計**: 再利用可能なコンポーネント作成

---

## 📞 サポート

不明点や困った時は：
1. まず `lib/mockData.ts` でモックデータの構造を確認
2. `lib/db.ts` で使用可能な関数を確認
3. 既存のコンポーネント（Sidebar, Headerなど）を参考にする
4. エラーメッセージを丁寧に読む

頑張ってください！🚀
