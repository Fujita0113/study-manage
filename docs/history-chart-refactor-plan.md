# 履歴画面チャート修正 実装計画

## 概要

履歴画面（/history）のグラフ表示を以下の3点で改修する。

1. **日付横軸の配置変更**: 折れ線グラフと棒グラフの境目に日付軸を配置
2. **期間ラベルの表示改善**: `<->`形式で開始〜終了の対応を明示、日付横軸の上に配置
3. **棒グラフのセグメント方式変更**: 日ごと分割からレベル期間ごと分割に変更

## 使用する主要モジュールとバージョン

| モジュール | バージョン | 用途 |
|-----------|-----------|------|
| recharts | ^3.6.0 | グラフ描画 |
| react | 19.2.3 | UIコンポーネント |
| date-fns | ^4.1.0 | 日付計算 |
| tailwindcss | ^4 | スタイリング |

## 依存関係で注意すべき点

- **Recharts 3.x**: 横棒グラフの新しいセグメント表示は、Rechartsの標準BarChartでは実現困難。カスタムSVG描画で実装する必要がある。
- **React 19**: 新しいReact 19の機能は特に使用しない（後方互換性維持）

## 変更が必要なファイル

| ファイル | 変更内容 |
|---------|---------|
| `app/history/_components/HistoryCharts.tsx` | メインのグラフコンポーネント全体を修正 |
| `app/api/history/level-changes/route.ts` | 期間情報を含むように拡張（ended_at対応） |
| `types/history.ts` | 新しいセグメントデータ型を追加 |

## 実装手順

### ステップ1: 型定義の追加

`types/history.ts`に以下の型を追加：

```typescript
// 棒グラフのセグメント（レベル期間ごと）
export interface LevelSegment {
  goalType: 'bronze' | 'silver' | 'gold';
  level: number;
  goalContent: string;
  startedAt: string;  // ISO日付
  endedAt: string | null;  // ISO日付、null=継続中
  startX: number;  // 描画開始X座標
  width: number;   // 描画幅（ピクセル）
}

// 期間ラベル用（<->形式）
export interface PeriodLabel {
  id: string;
  goalType: 'bronze' | 'silver' | 'gold';
  label: string;  // 「習慣継続中！」等
  changeReason: 'level_up' | 'level_down';
  startX: number;
  endX: number;
  row: number;  // 段（重なり回避用）
}
```

### ステップ2: APIルートの拡張

`app/api/history/level-changes/route.ts`を修正：
- 現在のレスポンスに加え、各レコードの`ended_at`を正しく返すようにする
- `ended_at`がnullの場合は継続中を意味する

### ステップ3: HistoryCharts.tsxの大幅改修

#### 3-1. レイアウト構造の変更

現在:
```
┌─────────────────────────────────┐
│ 折れ線グラフ（日付軸付き）       │
├─────────────────────────────────┤
│ Gold棒グラフ（日ごと分割）       │
├─────────────────────────────────┤
│ Silver棒グラフ（日ごと分割）     │
├─────────────────────────────────┤
│ Bronze棒グラフ（日ごと分割）     │
└─────────────────────────────────┘
```

変更後:
```
┌─────────────────────────────────┐
│ 折れ線グラフ（日付軸なし）       │
├─────────────────────────────────┤
│ 期間ラベル（<-> 形式）           │
├─────────────────────────────────┤
│ 日付横軸                         │
├─────────────────────────────────┤
│ Gold棒（レベル期間ごと分割）     │
├─────────────────────────────────┤
│ Silver棒（レベル期間ごと分割）   │
├─────────────────────────────────┤
│ Bronze棒（レベル期間ごと分割）   │
└─────────────────────────────────┘
```

#### 3-2. 折れ線グラフの修正

- X軸（日付軸）を非表示に変更
- `<XAxis hide />`を設定

#### 3-3. 日付横軸の新規追加

- カスタムSVGまたはdivで日付軸を描画
- 折れ線グラフと棒グラフの間に配置
- 日付ラベルを適切な間隔で表示

#### 3-4. 期間ラベル（`<->`形式）の実装

- `<`マーク：期間開始日のX座標に配置
- `>`マーク：期間終了日のX座標に配置
- `<`と`>`を線で結ぶ
- 線の上に評価ラベル（「習慣継続中！」等）を配置
- 複数の期間が重なる場合は、row（段）を変えて上下にずらす

```tsx
// 期間ラベルの描画例
<div style={{ position: 'absolute', left: startX, top: row * 24 }}>
  <span>&lt;</span>
  <span style={{ width: endX - startX }}>──{label}──</span>
  <span>&gt;</span>
</div>
```

#### 3-5. 棒グラフの大幅変更

RechartsのBarChartではなく、カスタムSVG/divで描画：

```tsx
// レベル期間ごとのセグメント描画
{segments.map((segment, idx) => (
  <div
    key={idx}
    style={{
      position: 'absolute',
      left: segment.startX,
      width: segment.width,
      backgroundColor: getGoalTypeColor(segment.goalType),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <span>Lv.{segment.level}</span>
  </div>
))}
```

#### 3-6. セグメントデータの計算ロジック

```typescript
const calculateSegments = (
  levelChanges: GoalLevelHistoryRecord[],
  goalType: 'bronze' | 'silver' | 'gold',
  startDate: Date,
  dayWidth: number
): LevelSegment[] => {
  const filtered = levelChanges.filter(lc => lc.goal_type === goalType);

  return filtered.map((record, idx) => {
    const start = new Date(record.started_at);
    const end = record.ended_at ? new Date(record.ended_at) : new Date();

    const startDays = differenceInDays(start, startDate);
    const durationDays = differenceInDays(end, start) + 1;

    return {
      goalType: record.goal_type,
      level: record.level,
      goalContent: record.goal_content,
      startedAt: record.started_at,
      endedAt: record.ended_at,
      startX: startDays * dayWidth,
      width: durationDays * dayWidth,
    };
  });
};
```

#### 3-7. 期間ラベル（row割り当て）の計算ロジック

```typescript
const calculatePeriodLabels = (
  levelChanges: GoalLevelHistoryRecord[],
  startDate: Date,
  dayWidth: number
): PeriodLabel[] => {
  const events = levelChanges.filter(lc => lc.change_reason !== 'initial');

  // row割り当て（重なり回避）
  const labels: PeriodLabel[] = [];
  const rowEndPositions: number[] = [];  // 各rowの終了X座標

  for (const event of events) {
    const startX = getXPosition(event.started_at, startDate, dayWidth);
    const endX = event.ended_at
      ? getXPosition(event.ended_at, startDate, dayWidth)
      : getXPosition(new Date().toISOString(), startDate, dayWidth);

    // 空いているrowを探す
    let row = 0;
    while (rowEndPositions[row] && rowEndPositions[row] > startX) {
      row++;
    }
    rowEndPositions[row] = endX;

    labels.push({
      id: event.id,
      goalType: event.goal_type,
      label: getEvaluationLabel(event),
      changeReason: event.change_reason,
      startX,
      endX,
      row,
    });
  }

  return labels;
};
```

### ステップ4: スタイリングの調整

- 日付横軸の太めのボーダー表示
- 期間ラベルの色分け（レベルアップ=緑、レベルダウン=赤）
- 棒グラフのセグメント間の区切り線

## 想定される影響範囲

- **履歴画面のみ**: 他の画面には影響なし
- **データ取得**: level-changes APIのレスポンス形式が若干変更されるが、後方互換性あり
- **パフォーマンス**: Rechartsを使わないカスタム描画に変更するため、大量データ時のパフォーマンスは要確認

## テスト方針

1. **表示確認**:
   - 折れ線グラフが日付軸なしで表示されること
   - 日付横軸が中央に表示されること
   - 期間ラベルが`<->`形式で正しく表示されること
   - 棒グラフがレベル期間ごとにセグメント分割されること

2. **インタラクション確認**:
   - スクロール時に中央縦線の位置に応じて左側ラベルが更新されること
   - 期間ラベルが重ならないこと

3. **エッジケース**:
   - レベル変更履歴がない場合
   - 1つのレベルしかない場合
   - 非常に長い期間のデータがある場合

## 備考

- Rechartsの標準コンポーネントでは今回の要件を満たせないため、カスタムSVG/div描画を採用する
- 将来的にパフォーマンス問題が発生した場合は、仮想スクロールの導入を検討
