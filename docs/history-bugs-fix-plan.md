# /history画面 バグ修正計画書

## 概要

`/history`画面で2つのバグが発生している。

1. **グラフを左にスクロールすると強制的に右に戻される問題**
2. **期間ラベルの表示ロジックが間違っている問題**

---

## 使用モジュールとバージョン

| モジュール | バージョン | 用途 |
|-----------|-----------|------|
| React | 19.2.3 | UIフレームワーク |
| Next.js | 16.1.1 | アプリフレームワーク |
| recharts | 3.6.0 | グラフ描画 |
| date-fns | 4.1.0 | 日付計算 |

---

## バグ1: 左スクロール時に強制的に右に戻される

### 発生箇所

[HistoryCharts.tsx:177-188](app/history/_components/HistoryCharts.tsx#L177-L188)

### 原因

`useEffect`の依存配列に`startDate`が含まれており、`startDate`はレンダリングごとに`new Date()`で新しいオブジェクトが生成されるため、毎回異なる参照となる。

```typescript
// 問題のコード（行151-153）
const startDate = levelChanges.length > 0
  ? new Date(levelChanges[0].started_at.split('T')[0])
  : new Date();  // ← 毎回新しいDateオブジェクトが生成される
```

```typescript
// 問題のuseEffect（行177-188）
useEffect(() => {
  if (scrollContainerRef.current && levelChanges.length > 0) {
    // ... スクロール位置を今日に設定 ...
  }
}, [levelChanges, handleScroll, startDate]);  // ← startDateが変わるたびに実行される
```

#### 問題の流れ

1. ユーザーが左にスクロールする
2. `handleScroll`が呼ばれ、`centerLineDate`が更新される
3. コンポーネントが再レンダリングされる
4. `startDate`が新しい`Date`オブジェクトとして再生成される（参照が変わる）
5. `useEffect`の依存配列の`startDate`が変化したと判定される
6. `useEffect`が再実行され、スクロール位置が「今日」にリセットされる
7. 結果として、左にスクロールしても強制的に右（今日の位置）に戻される

### 修正方法

`startDate`を`useMemo`でメモ化して、`levelChanges`が変わらない限り同じ参照を維持する。

```typescript
// 修正後
const startDate = useMemo(() => {
  return levelChanges.length > 0
    ? new Date(levelChanges[0].started_at.split('T')[0])
    : new Date();
}, [levelChanges]);
```

---

## バグ2: 期間ラベルの表示ロジックが間違っている

### 発生箇所

[HistoryCharts.tsx:72-109](app/history/_components/HistoryCharts.tsx#L72-L109)（`calculatePeriodLabels`関数）

### 現象

スクリーンショットで確認された状況：
- 「絶好調！」と「不調気味...」が同じ位置（画面右端）まで伸びて重なっている
- 期間ラベルが正しい期間を表示していない

### 原因

APIレスポンスを確認すると：

| goal_type | change_reason | started_at | ended_at | 期待ラベル |
|-----------|--------------|------------|----------|-----------|
| bronze | level_up | 2025-11-29 | **null** | 習慣継続中！ |
| silver | level_down | 2025-12-27 | **null** | 不調気味... |
| gold | level_up | 2026-01-10 | **null** | 絶好調！ |

`ended_at`が`null`の場合、現在の実装では**すべて「今日」まで**の期間として計算している。

```typescript
// 現在のコード（行83-85）
const endX = event.ended_at
  ? getXPosition(event.ended_at, startDate)
  : getXPosition(new Date().toISOString(), startDate);  // ← nullの場合は今日まで
```

これは**仕様上正しい**（`ended_at`がnullは「現在も継続中」を意味するため）。

しかし、**期間ラベルの意味が間違っている**。

#### 期間ラベルの本来の意味

期間ラベルは「レベル変更が起きた理由に対応する**先行期間**」を示すべき：

- **level_up**の場合：「14日間連続でBronze達成したから」→ **その14日間**に「習慣継続中！」を表示すべき
- **level_down**の場合：「目標を下げた」→ **下げる原因となった期間**に「不調気味...」を表示すべき

しかし現在の実装では、`level_up`/`level_down`イベントの**開始日から今日まで**を期間として表示している。これが誤り。

#### 正しい期間の計算方法

`change_reason`が`level_up`または`level_down`のレコードは、**前のレコードの期間**（同じgoal_typeの直前のレコード）に対する評価を表している。

例：
- Bronze: `initial` (11/15-11/28) → `level_up` (11/29〜)
  - 「習慣継続中！」は**11/15-11/28の期間**に表示すべき（この期間の成果でlevel_upした）

- Silver: `initial` (11/15-12/26) → `level_down` (12/27〜)
  - 「不調気味...」は**11/15-12/26の期間**に表示すべき（この期間の不調でlevel_downした）

- Gold: `initial` (11/15-1/9) → `level_up` (1/10〜)
  - 「絶好調！」は**11/15-1/9の期間**に表示すべき（この期間の成果でlevel_upした）

### 修正方法

`calculatePeriodLabels`関数を修正し、`level_up`/`level_down`イベントの**直前のレコード**（同じ`goal_type`の`ended_at`が設定されているレコード）の期間にラベルを表示する。

```typescript
// 修正後のcalculatePeriodLabels関数
const calculatePeriodLabels = (
  levelChanges: GoalLevelHistoryRecord[],
  startDate: Date
): PeriodLabel[] => {
  const labels: PeriodLabel[] = [];
  const rowEndPositions: number[] = [];

  // change_reasonがlevel_upまたはlevel_downのイベントを処理
  const events = levelChanges.filter(lc => lc.change_reason !== 'initial');

  for (const event of events) {
    // 同じgoal_typeの直前のレコード（ended_atがnullでないもの）を探す
    const previousRecord = levelChanges.find(
      lc => lc.goal_type === event.goal_type &&
            lc.ended_at !== null &&
            new Date(lc.ended_at) < new Date(event.started_at)
    );

    if (!previousRecord) continue;

    // 直前のレコードの期間にラベルを表示
    const startX = getXPosition(previousRecord.started_at, startDate);
    const endX = getXPosition(previousRecord.ended_at!, startDate);

    // 空いているrowを探す
    let row = 0;
    while (rowEndPositions[row] !== undefined && rowEndPositions[row] > startX - 50) {
      row++;
    }
    rowEndPositions[row] = endX;

    const label = getEvaluationLabel(event);
    if (label) {
      labels.push({
        id: event.id,
        goalType: event.goal_type,
        label,
        changeReason: event.change_reason as 'level_up' | 'level_down',
        startX,
        endX,
        row,
      });
    }
  }

  return labels;
};
```

---

## 修正対象ファイル

| ファイル | 修正内容 |
|---------|---------|
| [app/history/_components/HistoryCharts.tsx](app/history/_components/HistoryCharts.tsx) | `startDate`のメモ化、`calculatePeriodLabels`関数の修正 |

---

## 修正手順

### ステップ1: バグ1の修正（スクロール問題）

1. `HistoryCharts.tsx`を開く
2. `useMemo`をimport文に追加
3. `startDate`の計算を`useMemo`でラップする

```typescript
// Before（行151-153）
const startDate = levelChanges.length > 0
  ? new Date(levelChanges[0].started_at.split('T')[0])
  : new Date();

// After
const startDate = useMemo(() => {
  return levelChanges.length > 0
    ? new Date(levelChanges[0].started_at.split('T')[0])
    : new Date();
}, [levelChanges]);
```

### ステップ2: バグ2の修正（期間ラベルのロジック）

1. `calculatePeriodLabels`関数を修正
2. `level_up`/`level_down`イベントの**直前のレコード**の期間にラベルを表示するように変更

---

## テスト方針

### バグ1のテスト

1. `/history`画面を開く
2. グラフを左にスクロールする
3. スクロール位置が維持されることを確認（右に戻されないこと）
4. スクロール後も中央縦線の日付が正しく更新されることを確認

### バグ2のテスト

テストデータに基づく期待される表示：

| ラベル | 表示期間 | 理由 |
|--------|---------|------|
| 習慣継続中！（緑） | 11/15 - 11/28 | Bronze 14日達成でlevel_up |
| 不調気味...（赤） | 11/15 - 12/26 | Silver不調でlevel_down |
| 絶好調！（緑） | 11/15 - 1/9 | Gold 14日達成でlevel_up |

確認事項：
1. 期間ラベルが重ならず、正しい期間に表示されること
2. 緑色（level_up）と赤色（level_down）が正しく色分けされること
3. ラベルのテキストが正しいこと

---

## 影響範囲

- `/history`画面のみ
- 他の画面には影響なし
- データベーススキーマの変更なし
- APIの変更なし

---

## 注意事項

- `useMemo`の依存配列には`levelChanges`のみを含める
- 期間ラベルは「レベル変更の原因となった期間」に表示する
- `ended_at`がnullのレコードは「現在継続中」を意味し、期間ラベルの対象外
