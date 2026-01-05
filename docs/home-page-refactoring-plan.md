# ホーム画面 改修計画書（改訂版）

**作成日**: 2026-01-05
**更新日**: 2026-01-05（改訂）
**対象**: [app/page.tsx](../app/page.tsx)
**要件定義**: [requirements.md](./requirements.md) 第2章「ホーム画面（Dashboard）」

---

## 1. エグゼクティブサマリー

### 改訂の背景
初版作成後、ユーザーフィードバックに基づき要件定義が大幅に変更されました。本改訂版では、新しい要件に基づく改修計画を再定義します。

### 主要な変更点（要件定義レベル）

| 項目 | 旧要件 | 新要件 | 影響 |
|-----|-------|-------|-----|
| **レイアウト構造** | サイドバー + メインエリア + サイドエリア | サイドバー + メインエリア（全幅） | 中 |
| **カード表示形式** | 縦1列リスト | 2-3列グリッド | 大 |
| **表示日数** | 過去7日分 | PCで最適な日数（14日分推奨） | 中 |
| **ドットマップ** | サイドエリアに表示 | **削除** | 中 |
| **未記録カード表示** | 今日の記録がなくても表示 | **削除**（記録がある日のみ表示） | 中 |
| **提案バナー位置** | サイドエリア内 | **画面右下固定（×ボタン付き通知）** | 大 |
| **学習内容データソース** | GitHubコミット（初版での実装） | ユーザー入力（doText） | 大 |

### 改修の目的
1. **視認性の向上**: グリッドレイアウトで一度に多くの情報を把握
2. **UI簡素化**: サイドエリア・ドットマップを削除し、本質的な情報に集中
3. **画面スペースの有効活用**: サイドエリアを削除してメインエリアを全幅に
4. **提案の目立たせ**: 右下通知形式で重要な提案を見逃さない
5. **要件適合**: ユーザー入力（doText）を学習内容として正しく表示

---

## 2. 新要件の全体像

### 2.1 ホーム画面の構成（新）

```
┌────┬─────────────────────────────────────────────────┐
│    │ Header（ストリーク表示 + 記録ボタン）            │
│ S  ├─────────────────────────────────────────────────┤
│ i  │                                                 │
│ d  │  ┌────────┐ ┌────────┐ ┌────────┐             │
│ e  │  │ Card 1 │ │ Card 2 │ │ Card 3 │ ← 3列グリッド│
│ b  │  └────────┘ └────────┘ └────────┘             │
│ a  │  ┌────────┐ ┌────────┐ ┌────────┐             │
│ r  │  │ Card 4 │ │ Card 5 │ │ Card 6 │             │
│    │  └────────┘ └────────┘ └────────┘             │
│    │       ...         ...        ...               │
│    │  （14日分のカード、記録がある日のみ表示）         │
│    │                                                 │
│    │                      ┌──────────────┐          │
│    │                      │ 提案バナー   │          │
│    │                      │ [×] [目標編集]│   ← 右下固定
│    │                      └──────────────┘          │
└────┴─────────────────────────────────────────────────┘
```

### 2.2 削除された機能

| 削除機能 | 理由 |
|---------|-----|
| **サイドエリア**（右側のエリア） | メインエリアを全幅にして視認性向上 |
| **過去7日間のドットマップ** | カード自体が達成度を視覚化しているため冗長 |
| **未記録日のカード** | 記録がある日のみに集中し、空カードによるノイズを削減 |

### 2.3 維持される機能

| 維持機能 | 備考 |
|---------|-----|
| **サイドバー** | 「ホーム」「カレンダー」「工夫管理」「設定」へのナビゲーション |
| **ヘッダー** | ストリーク表示 + 記録ボタン |
| **カード内容** | 日付、達成度バッジ、学習内容、日報抜粋 |

---

## 3. 差分分析（新要件 vs 現状実装）

### 3.1 構造的差異

| 項目 | 現状実装 | 新要件 | ギャップ |
|-----|---------|-------|---------|
| **メインエリアレイアウト** | `flex flex-col lg:flex-row`（メイン + サイド） | `flex-1`（メインのみ、全幅） | サイドエリア削除 |
| **カードレイアウト** | `space-y-4`（縦積み） | `grid grid-cols-3 gap-6`（グリッド） | CSS変更 |
| **カード幅** | `flex-1`（lg:でサイド考慮） | `w-full`（全幅利用） | CSS変更 |
| **表示件数** | 7日分（last7Days） | 14日分推奨（last14Days） | データ取得範囲変更 |
| **提案バナー** | サイドエリア内（静的配置） | `fixed bottom-4 right-4`（右下固定） | コンポーネント化 + CSS変更 |

### 3.2 データ層の差異

| 項目 | 現状実装 | 新要件 | 対応 |
|-----|---------|-------|-----|
| **学習内容** | GitHubCommit[] | doText（改行区切り文字列） | 初版計画通り修正 |
| **未記録日** | `hasRecord: false`のカードを生成 | 未記録日は非表示 | フィルタリング追加 |
| **モックデータ** | 7日分 + 提案条件不足 | **14日分 + 提案条件満たすデータ** | モックデータ大幅拡充 |

---

## 4. 改修タスク

### タスク #1: レイアウト構造の変更 【HIGH】

#### 1.1 AppLayoutの変更は不要

サイドバーは維持されるため、[components/layout/AppLayout.tsx](../components/layout/AppLayout.tsx)の変更は**不要**です。

#### 1.2 app/page.tsxのレイアウト変更

**変更対象**: [app/page.tsx](../app/page.tsx)

**変更内容**:
```tsx
// Before（メインエリア + サイドエリア）
<div className="flex flex-col lg:flex-row gap-6">
  {/* メインエリア */}
  <div className="flex-1 space-y-4">
    {dailyReportCards.map(card => (...))}
  </div>

  {/* サイドエリア */}
  <div className="lg:w-80">
    {/* ドットマップ */}
    {/* 提案バナー */}
  </div>
</div>

// After（メインエリアのみ、全幅）
<div>
  {/* デイリーレポートカードグリッド */}
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {dailyReportCards.map(card => (...))}
  </div>
</div>
```

---

### タスク #2: DailyReportCard型の拡張 【HIGH】

**変更対象**: [types/index.ts:121-128](../types/index.ts)

**変更内容**:
```typescript
// Before
export interface DailyReportCard {
  date: string;
  displayDate: string;
  achievementLevel: AchievementLevel;
  commits: GitHubCommit[];
  journalExcerpt?: string;
  hasRecord: boolean;
}

// After
export interface DailyReportCard {
  date: string;
  displayDate: string;
  achievementLevel: AchievementLevel;
  learningItems: string[];  // ★ユーザー入力の学習内容（doTextから生成）
  journalExcerpt?: string;
  // hasRecord削除（未記録はカード自体を表示しないため不要）
}
```

---

### タスク #3: モックデータの大幅拡充 【HIGH】

**変更対象**: [lib/mockData.ts](../lib/mockData.ts)

**必要な変更**:

1. **14日分のDailyRecordを作成**（現在は7日分のみ）
2. **全レコードにdoTextを追加**（学習内容サマリー）
3. **提案条件を満たすデータパターンを作成**:
   - **デフォルト**: Bronze 14日連続達成（Bronze提案テスト用）
   - コメントアウトで他パターンも用意（Silver/Gold/レベルダウン）

**実装例**:
```typescript
// 14日前から今日まで、Bronze以上を連続達成
export const mockDailyRecords: DailyRecord[] = [
  // 14日前: Bronze
  {
    id: 'record-14days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(14),
    achievementLevel: 'bronze',
    doText: 'Next.jsの基礎を30分学習\nTypeScriptの型定義を復習',
    journalText: '30分だけだったけど、続けることが大事。',
    createdAt: new Date(getDateString(14)),
    updatedAt: new Date(getDateString(14)),
  },
  // 13日前: Bronze
  {
    id: 'record-13days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(13),
    achievementLevel: 'bronze',
    doText: 'Reactのコンポーネント設計を学習',
    journalText: '少しずつ理解が深まってきた。',
    createdAt: new Date(getDateString(13)),
    updatedAt: new Date(getDateString(13)),
  },
  // ... 残り12日分も同様にBronze以上で作成
  // 今日（0日前）は未記録とする
];
```

**注意**:
- Bronze 14日連続達成で提案バナーが表示されることをテスト
- 今日（getDateString(0)）は記録なしにして、カードが13枚表示されることを確認

---

### タスク #4: ホーム画面のデータ取得ロジック修正 【HIGH】

**変更対象**: [app/page.tsx](../app/page.tsx)

**変更内容**:

```typescript
// Before
const last7Days = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);
  return formatDate(date);
});

const records = await getDailyRecords(MOCK_USER_ID, {
  startDate: formatDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
  endDate: today
});

const dailyReportCards: DailyReportCard[] = last7Days.map(date => {
  const record = records.find(r => r.date === date);
  const dayCommits = allGitHubCommits.filter(/* ... */).slice(0, 3);

  return {
    date,
    displayDate: formatDateDisplay(date),
    achievementLevel: record?.achievementLevel || 'none',
    commits: dayCommits,
    journalExcerpt: createJournalExcerpt(record?.journalText),
    hasRecord: !!record
  };
});

// After
const records = await getDailyRecords(MOCK_USER_ID, {
  startDate: formatDate(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)),
  endDate: today
});

// ★カード生成ロジック（未記録日を除外）
const dailyReportCards: DailyReportCard[] = records
  .map(record => {
    // doTextから学習内容を抽出
    const learningItems = record.doText
      ? record.doText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .slice(0, 3)
      : [];

    return {
      date: record.date,
      displayDate: formatDateDisplay(record.date),
      achievementLevel: record.achievementLevel,
      learningItems,
      journalExcerpt: createJournalExcerpt(record.journalText),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date)); // 新しい順
```

**重要な変更点**:
- `last7Days`配列を削除（未記録日のカード生成が不要なため）
- `records`をそのままマッピングして`dailyReportCards`を生成
- `commits`フィールドを削除、`learningItems`を追加
- `hasRecord`フィールドを削除

---

### タスク #5: グリッドレイアウトへの変更 【HIGH】

**変更対象**: [app/page.tsx](../app/page.tsx) のUIセクション

**変更内容**:

```tsx
// Before（縦1列 + サイドエリア）
<div className="flex flex-col lg:flex-row gap-6">
  {/* メインエリア */}
  <div className="flex-1 space-y-4">
    {dailyReportCards.map(card => (
      <Link href={`/day/${card.date}`} key={card.date}>
        {/* カード内容 */}
      </Link>
    ))}
  </div>

  {/* サイドエリア */}
  <div className="lg:w-80">
    {/* ドットマップ */}
    {/* 提案バナー */}
  </div>
</div>

// After（グリッド表示、全幅）
<div>
  {/* デイリーレポートカードグリッド */}
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {dailyReportCards.map(card => (
      <Link
        href={`/day/${card.date}`}
        key={card.date}
        className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
      >
        {/* 日付 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {card.displayDate}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelBadgeClass(card.achievementLevel)}`}
          >
            {getLevelLabel(card.achievementLevel)}
          </span>
        </div>

        {/* 学習内容 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">学習内容</h4>
          {card.learningItems.length === 0 ? (
            <p className="text-sm text-slate-400">学習内容の記録なし</p>
          ) : (
            <ul className="space-y-1">
              {card.learningItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span className="line-clamp-1">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 日報抜粋 */}
        {card.journalExcerpt && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-slate-700 mb-2">日報</h4>
            <p className="text-sm text-slate-600 line-clamp-2">
              {card.journalExcerpt}
            </p>
          </div>
        )}
      </Link>
    ))}
  </div>
</div>
```

**レスポンシブ設計**:
- モバイル（< 768px）: 1列
- タブレット（768px - 1280px）: 2列
- デスクトップ（> 1280px）: 3列

---

### タスク #6: 提案バナーの右下固定通知化 【HIGH】

**新規作成**: [components/SuggestionBanner.tsx](../components/SuggestionBanner.tsx)

**注意**: 提案判定ロジック（`getSuggestion()`）は既に実装済みです（[lib/db.ts:251-303](../lib/db.ts)）。
このタスクでは、既存の提案データを右下固定通知として表示する**UIコンポーネントのみ**を作成します。

#### 既存の提案ロジック仕様

**レベルアップ提案**:
- Bronze/Silver/Gold のいずれかを14日連続達成で表示
- `type: 'level_up'`
- `targetLevel`: 達成したレベル
- `canEditAllGoals: false`

**レベルダウン提案**:
- 直近7日間で未達成（none）が4日以上で表示
- `type: 'level_down'`
- `canEditAllGoals: true`

**Suggestion型定義**（[types/index.ts:110-118](../types/index.ts)）:
```typescript
export interface Suggestion {
  type: SuggestionType;              // 'level_up' | 'level_down'
  message: string;                   // 表示メッセージ
  targetLevel?: GoalLevel;           // レベルアップ時のターゲット ('bronze' | 'silver' | 'gold')
  canEditAllGoals: boolean;          // レベルダウン時はtrue
}
```

**重要**: `getSuggestion()` の呼び出し（[app/page.tsx:76](../app/page.tsx)）は**そのまま維持**します。

#### SuggestionBannerコンポーネントの実装

**実装内容**:
```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Suggestion } from '@/types';
import { X } from 'lucide-react'; // アイコンライブラリ使用

interface SuggestionBannerProps {
  suggestion: Suggestion | null;
}

export function SuggestionBanner({ suggestion }: SuggestionBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!suggestion || !isVisible) {
    return null;
  }

  const bgColor = suggestion.type === 'level_up'
    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
    : 'bg-gradient-to-r from-blue-500 to-indigo-500';

  return (
    <div className={`fixed bottom-6 right-6 ${bgColor} text-white rounded-lg shadow-2xl p-4 max-w-sm z-50 animate-slide-up`}>
      {/* 閉じるボタン */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        aria-label="閉じる"
      >
        <X size={18} />
      </button>

      {/* メッセージ */}
      <div className="pr-6 mb-3">
        <p className="text-sm font-medium leading-relaxed">
          {suggestion.message}
        </p>
      </div>

      {/* アクションボタン */}
      <Link
        href="/goals"
        className="block w-full bg-white text-center py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors"
        style={{ color: suggestion.type === 'level_up' ? '#F59E0B' : '#4F46E5' }}
      >
        目標を編集する
      </Link>
    </div>
  );
}
```

#### app/page.tsxでの変更

**Before（サイドエリア内で静的表示）**:
```tsx
{/* サイドエリア */}
<div className="lg:w-80">
  {suggestion && (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-sm text-yellow-800 mb-3">{suggestion.message}</p>
      <Link href="/goals" className="...">目標を編集する</Link>
    </div>
  )}
</div>
```

**After（右下固定コンポーネント）**:
```tsx
import { SuggestionBanner } from '@/components/SuggestionBanner';

export default async function HomePage() {
  // ... データ取得
  const suggestion = await getSuggestion(); // ★既存のまま維持

  return (
    <AppLayout pageTitle="ホーム">
      {/* グリッド表示 */}
      <div className="grid ...">
        {/* カード */}
      </div>

      {/* 提案バナー（右下固定） */}
      <SuggestionBanner suggestion={suggestion} />
    </AppLayout>
  );
}
```

**アニメーション追加（tailwind.config.ts）**:
```typescript
module.exports = {
  theme: {
    extend: {
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
};
```

---

### タスク #7: ドットマップの削除 【MEDIUM】

**変更対象**: [app/page.tsx](../app/page.tsx)

**対応**: 以下のコードを削除

```typescript
// Before（削除対象）
const dotMapDays = last7Days.slice().reverse(); // 古い順に並べ替え

// JSX内（削除対象）
<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
  <h3 className="text-base font-semibold text-slate-800 mb-4">
    過去7日間の達成度
  </h3>
  <div className="flex gap-2">
    {dotMapDays.map((date) => {
      const record = records.find((r) => r.date === date);
      const level = record?.achievementLevel || 'none';
      return (
        <div key={date} className="flex flex-col items-center gap-1">
          <div
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: getLevelColor(level) }}
          />
          <span className="text-xs text-slate-500">
            {new Date(date).getDate()}
          </span>
        </div>
      );
    })}
  </div>
</div>
```

---

## 5. 実装スケジュール

### フェーズ1: データ層の改修（優先度: HIGH）
- [ ] タスク #2: DailyReportCard型の拡張（learningItems追加、commits/hasRecord削除）
- [ ] タスク #3: モックデータの大幅拡充（14日分 + 提案条件満たすデータ）
- [ ] タスク #4: データ取得ロジック修正（7→14日、doTextパース、未記録フィルタ）

**所要時間**: 2-3時間

### フェーズ2: UIの大幅変更（優先度: HIGH）
- [ ] タスク #1: レイアウト構造の変更（サイドエリア削除）
- [ ] タスク #5: グリッドレイアウトへの変更
- [ ] タスク #6: 提案バナーの右下固定通知化（新規コンポーネント作成）
- [ ] タスク #7: ドットマップの削除

**所要時間**: 2-3時間

### フェーズ3: 動作確認とデバッグ（優先度: HIGH）
- [ ] グリッド表示の視覚確認（1列/2列/3列）
- [ ] 提案バナーの表示確認（Bronze 14日連続データでテスト）
- [ ] 学習内容の正しい表示確認
- [ ] カードクリック遷移の確認

**所要時間**: 1時間

---

## 6. テスト計画

### 6.1 機能テスト

| # | テストケース | 期待結果 | 確認方法 |
|---|------------|---------|---------|
| T1 | 14日分の記録がある場合 | 14枚のカードがグリッド表示される | ブラウザで視覚確認 |
| T2 | 13日分しか記録がない場合（今日未記録） | 13枚のカードのみ表示される | モックデータで確認 |
| T3 | doTextに3項目以上ある場合 | 最初の3項目のみ表示 | モックデータで検証 |
| T4 | doTextが空の場合 | 「学習内容の記録なし」表示 | モックデータで検証 |
| T5 | Bronze 14日連続達成 | 提案バナーが右下に表示される | モックデータで検証 |
| T6 | 提案バナーの×ボタン | クリックでバナーが消える | ブラウザで操作確認 |
| T7 | レスポンシブ（モバイル） | 1列表示 | DevToolsで確認 |
| T8 | レスポンシブ（タブレット） | 2列表示 | DevToolsで確認 |
| T9 | レスポンシブ（デスクトップ） | 3列表示 | DevToolsで確認 |
| T10 | サイドバーの表示 | 正常に表示され、ナビゲーション可能 | ブラウザで確認 |

### 6.2 ビジュアルテスト

| 確認項目 | 期待結果 |
|---------|---------|
| カード間の余白 | gap-6（1.5rem）で統一 |
| カードのホバー効果 | shadow-lgへスムーズに遷移 |
| 達成度バッジの色 | Bronze/Silver/Gold/未記録が正しく表示 |
| 提案バナーのアニメーション | 下からスライドアップして表示 |
| グリッドレイアウトの整列 | 3列が均等に配置される |

### 6.3 リグレッションテスト

既存機能への影響確認:
- [ ] サイドバーのナビゲーション
- [ ] ヘッダーのストリーク表示
- [ ] 記録ボタンのリンク先（/record）
- [ ] カードクリック時の遷移先（/day/{date}）
- [ ] 日報抜粋の100文字制限
- [ ] 達成度バッジの色（カラーパレット準拠）

---

## 7. モックデータ設計詳細

### 7.1 基本方針

**14日分のデータ構成**:
- 14日前～1日前（14日分）: Bronze連続達成 → Bronze提案トリガー
- 今日（0日前）: 未記録（カードは13枚表示）

### 7.2 提案テストパターン

#### パターンA: Bronze提案（デフォルトで有効）
```typescript
// 14日前～1日前まで全てBronze
achievementLevel: 'bronze' // 14レコード連続
```

#### パターンB: Silver提案（切り替え用、コメントアウトで用意）
```typescript
// 14日前～1日前まで全てSilver
achievementLevel: 'silver' // 14レコード連続
```

#### パターンC: Gold提案（切り替え用、コメントアウトで用意）
```typescript
// 14日前～1日前まで全てGold
achievementLevel: 'gold' // 14レコード連続
```

#### パターンD: レベルダウン提案（切り替え用、コメントアウトで用意）
```typescript
// 直近7日間に「none」が4日以上
// 例: 7日前～1日前で [none, none, bronze, none, silver, none, bronze]
```

### 7.3 doTextのサンプルデータ

```typescript
const learningContentExamples = [
  // 短い（1-2項目）
  'Next.jsの基礎を30分学習\nTypeScriptの型定義を復習',

  // 標準（3項目）
  'Reactのコンポーネント設計を学習\nTailwind CSSでレスポンシブUI実装\nAPIルートの設計パターンを調査',

  // 長い（4項目以上、最初の3つのみ表示）
  'データベーススキーマの設計\nPrismaのマイグレーション実行\nRelation設定の最適化\nクエリパフォーマンスの測定',
];
```

---

## 8. 技術的考慮事項

### 8.1 パフォーマンス

**グリッド表示による影響**:
- 14日分のカードを一度に表示するため、初期レンダリングコストが増加
- 対策: React Server Componentsを活用し、サーバーサイドで事前レンダリング
- 将来的な改善: 仮想スクロール（react-windowなど）の導入

### 8.2 アクセシビリティ

**グリッドレイアウトでの配慮**:
```tsx
<div
  className="grid ..."
  role="list"
  aria-label="デイリーレポートカード一覧"
>
  <Link
    href={...}
    role="listitem"
    aria-label={`${card.displayDate}の記録`}
  >
```

**提案バナーでの配慮**:
```tsx
<button
  aria-label="提案バナーを閉じる"
  onClick={...}
>
  <X size={18} aria-hidden="true" />
</button>
```

### 8.3 状態管理

**提案バナーの閉じる状態**:
- 現状: コンポーネント内のuseStateで管理（ページリロードで復活）
- 将来的な改善: localStorage + Zustand/Reduxで永続化
  - `dismissedSuggestions: string[]` に提案IDを保存
  - 同じ提案は一度閉じたら再表示しない

---

## 9. リスク分析

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|---------|------|
| グリッド表示でカードが小さくなりすぎる | 中 | 中 | min-heightを設定、カード内余白を最適化 |
| 14日分のデータ取得が遅い | 低 | 低 | モックデータのため影響なし、将来的にはキャッシング |
| 提案バナーが他要素と重なる | 低 | 中 | z-50で最前面、bottom-6で下部要素との余白確保 |
| レスポンシブで3列が狭く感じる | 低 | 中 | xl:以上で3列、必要に応じて2xl:で調整 |

---

## 10. 今後の検討事項

### 10.1 カード表示の拡張機能

1. **フィルタリング**:
   - 達成度別フィルタ（Bronze/Silver/Goldのみ表示）
   - 期間指定（最近1週間/2週間/1ヶ月）

2. **ソート**:
   - 新しい順（デフォルト）
   - 古い順
   - 達成度順

3. **無限スクロール**:
   - 初期14日分 → スクロールで追加読み込み

### 10.2 提案バナーの拡張

1. **複数提案の管理**:
   - Bronze/Silver/Gold複数レベルで同時に条件達成した場合の表示優先順位

2. **提案履歴の記録**:
   - 「過去にこの提案を見た」記録をDBに保存
   - 「また見る」ボタンで再表示

3. **提案の多様化**:
   - レベルアップ/ダウン以外の提案（例：「3日間記録していません」リマインダー）

---

## 11. 付録

### A. 改修対象ファイル一覧（優先度順）

| ファイルパス | 改修内容 | 優先度 | 影響範囲 |
|------------|---------|-------|---------|
| [lib/mockData.ts](../lib/mockData.ts) | 14日分データ + doText追加 | HIGH | データ層 |
| [types/index.ts](../types/index.ts) | DailyReportCard型変更 | HIGH | 型定義 |
| [app/page.tsx](../app/page.tsx) | グリッド化、データ取得変更 | HIGH | UI + ロジック |
| [components/SuggestionBanner.tsx](../components/SuggestionBanner.tsx) | 新規作成（右下固定） | HIGH | 新規コンポーネント |

### B. 削除されるコード量

| 削除対象 | 行数（推定） |
|---------|------------|
| サイドエリアのレイアウトコード | ~40行 |
| ドットマップ表示コード | ~30行 |
| 未記録カード生成ロジック | ~20行 |
| **合計** | **~90行** |

### C. 新規追加されるコード量

| 追加対象 | 行数（推定） |
|---------|------------|
| SuggestionBannerコンポーネント | ~80行 |
| グリッドレイアウトUI | ~60行 |
| モックデータ（7日分追加） | ~200行 |
| doTextパースロジック | ~15行 |
| **合計** | **~355行** |

**差分**: +265行（純増）

---

## 12. 承認・レビュー

### チェックリスト
- [x] 新要件定義との差分を全て洗い出した
- [x] サイドバーは維持、サイドエリアのみ削除を明確化した
- [x] グリッドレイアウトのレスポンシブ設計を定義した
- [x] 提案バナーの右下固定UIを設計した
- [x] 14日分のモックデータ設計を完了した
- [x] 提案条件を満たすテストデータパターンを定義した
- [x] リスクと対策を明確化した
- [x] テストケースを定義した

### 次のアクション
1. **本ドキュメントのレビュー**: 新要件との一致確認
2. **モックデータの優先実装**: 提案バナーのテストを可能にする
3. **フェーズ1から順次実装開始**

---

**作成者**: Claude Code
**最終更新**: 2026-01-05（改訂版v2）
