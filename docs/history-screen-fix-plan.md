# 履歴画面（/history）の修正計画

## 概要

/history画面で以下の2つの課題を修正するための実装計画です：

1. **テストデータの充実化**: `b58180f4-3421-4e02-8903-e54d5acee1e9` ユーザーのモックデータを増やし、2〜3回のレベルアップ・停滞を含む履歴を作成
2. **レイアウトの修正**: サイドバーとヘッダーが非表示になっている問題を修正

---

## 1. 課題分析

### 課題1: テストデータの不足

現在のテストデータ（`20260115150001_add_test_data_for_sample_user.sql`）の状況：
- 2026年1月1日〜1月14日の14日分の`daily_records`
- `goal_level_history`に各目標（bronze/silver/gold）の初期レベル（Lv.1）のみ
- レベルアップやレベルダウンの履歴がない

**問題点**:
- /history画面のグラフ上でレベル変更の縦線や評価ラベル（「絶好調！」「習慣継続中！」など）が表示されない
- 複数期間にまたがるデータがないため、棒グラフの色分けが確認できない

### 課題2: レイアウトの欠如

現在の`app/history/page.tsx`の実装：
```tsx
export default function HistoryPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">学習履歴</h1>
      <HistoryCharts />
    </div>
  );
}
```

**問題点**:
- `AppLayout`コンポーネントを使用していない
- 他のページ（ホーム、カレンダー等）は`AppLayout`でラップされており、サイドバー/ヘッダーが表示される
- 履歴画面のみ独自のレイアウトになっているため、サイドバー/ヘッダーが表示されない

---

## 2. 使用するモジュールとバージョン

package.jsonより：
- `@supabase/ssr`: ^0.8.0
- `@supabase/supabase-js`: ^2.90.1
- `next`: 16.1.1
- `recharts`: ^3.6.0
- `date-fns`: ^4.1.0

### 依存関係の注意点
- 特になし（既存のSupabase CLIとマイグレーションの仕組みを使用）
- 新しいライブラリの追加は不要

---

## 3. 変更が必要なファイル

### 3.1 テストデータの充実化（新規作成）

**ファイル**: `supabase/migrations/20260117100000_enhanced_test_data_for_sample_user.sql`

### 3.2 レイアウトの修正

**ファイル**: `app/history/page.tsx`

---

## 4. 具体的な変更内容

### 4.1 テストデータの設計

ユーザーID: `b58180f4-3421-4e02-8903-e54d5acee1e9`

#### 期間設計（約60日分のデータ）

| 期間 | 日付範囲 | 主な達成レベル | イベント |
|------|---------|---------------|---------|
| 期間1 | 2025-11-15 〜 2025-11-28 (14日) | Bronze中心 | Bronze Lv.1 開始（initial） |
| 期間2 | 2025-11-29 〜 2025-12-12 (14日) | Bronze連続達成 | Bronze Lv.2 へレベルアップ |
| 期間3 | 2025-12-13 〜 2025-12-26 (14日) | Silver中心 | Silver Lv.1 継続、不調気味 |
| 期間4 | 2025-12-27 〜 2026-01-09 (14日) | Gold多め | Gold Lv.2 へレベルアップ |
| 期間5 | 2026-01-10 〜 2026-01-17 (8日) | 現在まで | 継続中 |

#### goal_level_history レコード設計

| goal_type | level | goal_content | started_at | ended_at | change_reason |
|-----------|-------|-------------|-----------|---------|---------------|
| bronze | 1 | 毎日30分プログラミングする | 2025-11-15 | 2025-11-28 | initial |
| bronze | 2 | 毎日1時間プログラミングする | 2025-11-29 | NULL | level_up |
| silver | 1 | 1つの機能を完成させる | 2025-11-15 | 2025-12-26 | initial |
| silver | 1 | 簡単なバグ修正をする | 2025-12-27 | NULL | level_down |
| gold | 1 | リファクタリングまで完了させる | 2025-11-15 | 2026-01-09 | initial |
| gold | 2 | テストコードも書く | 2026-01-10 | NULL | level_up |

#### daily_records データ（約60日分）

- 期間1（2025-11-15〜2025-11-28）: Bronze達成が多い
- 期間2（2025-11-29〜2025-12-12）: Bronze連続14日達成（→レベルアップ条件）
- 期間3（2025-12-13〜2025-12-26）: Silver中心、一部Bronze未達（→レベルダウン条件）
- 期間4（2025-12-27〜2026-01-09）: Gold達成が多い（→Goldレベルアップ条件）
- 期間5（2026-01-10〜2026-01-17）: 混在

### 4.2 レイアウト修正の設計

#### Before（現在）
```tsx
export default function HistoryPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">学習履歴</h1>
      <HistoryCharts />
    </div>
  );
}
```

#### After（修正後）
```tsx
import { AppLayout } from '@/components/layout/AppLayout';
import { calculateStreakFromRecords } from '@/lib/db';
import { requireAuth } from '@/lib/auth/server';
import HistoryCharts from './_components/HistoryCharts';

export const metadata: Metadata = {
  title: '履歴 | 学習管理',
  description: '学習記録の履歴を可視化',
};

export default async function HistoryPage() {
  // 認証チェック
  const user = await requireAuth();

  // ストリーク計算
  const streakDays = await calculateStreakFromRecords(user.id);

  return (
    <AppLayout pageTitle="履歴" streakDays={streakDays}>
      <HistoryCharts />
    </AppLayout>
  );
}
```

---

## 5. 実装手順

### Step 1: マイグレーションファイルの作成
1. `supabase/migrations/20260117100000_enhanced_test_data_for_sample_user.sql` を作成
2. 既存のテストデータを削除し、新しいテストデータを挿入するSQLを記述
3. 約60日分の`daily_records`と、レベルアップ・レベルダウンを含む`goal_level_history`を挿入

### Step 2: マイグレーションの実行
```bash
npx supabase db push
```

### Step 3: history/page.tsx の修正
1. Server Componentに変更（`metadata`を保持）
2. `AppLayout`でラップ
3. 認証チェックと`streakDays`の計算を追加

### Step 4: 動作確認
1. テストユーザー（`b58180f4-3421-4e02-8903-e54d5acee1e9`）でログイン
2. /history画面でサイドバー・ヘッダーが表示されることを確認
3. グラフ上でレベル変更の縦線と評価ラベルが表示されることを確認
4. 棒グラフでレベル別の色分けが表示されることを確認

---

## 6. 想定される影響範囲

### 影響あり
- `app/history/page.tsx`: レイアウト変更
- `supabase/migrations/`: 新規マイグレーションファイル追加
- データベース: テストユーザーのデータが更新される

### 影響なし
- 他のページ（ホーム、カレンダー、記録、設定）
- 他のユーザーのデータ
- API Routes

---

## 7. テスト方針

### 手動テスト項目

1. **レイアウト確認**
   - [ ] /history画面でサイドバーが左側に表示される
   - [ ] /history画面でヘッダー（ストリーク表示、記録ボタン）が上部に表示される
   - [ ] サイドバーの「履歴」リンクがアクティブ状態になる

2. **グラフ表示確認**
   - [ ] 折れ線グラフに約60日分のデータが表示される
   - [ ] レベル変更日に縦線が表示される
   - [ ] 縦線付近に評価ラベル（「習慣継続中！」「不調気味...」「絶好調！」）が表示される
   - [ ] 棒グラフでレベル（Lv.1, Lv.2）に応じた色分けが表示される

3. **スクロール動作確認**
   - [ ] 横スクロールで過去のデータを閲覧できる
   - [ ] 中央縦線の位置に応じて左側の目標ラベルが更新される

4. **認証確認**
   - [ ] 未認証ユーザーはログイン画面にリダイレクトされる

---

## 8. 注意事項

- テストデータはユーザーID `b58180f4-3421-4e02-8903-e54d5acee1e9` に限定されるため、他のユーザーには影響しない
- マイグレーションは既存データを削除してから挿入するため、このユーザーの過去のテストデータは失われる
- 本番環境へのデプロイ前に、テストデータのマイグレーションが本番に適用されないよう注意が必要
