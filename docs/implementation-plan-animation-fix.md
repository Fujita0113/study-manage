# 目標変遷アニメーション修正計画

## 問題の概要

現在の /history ページでは、アニメーション再生時に以下の問題が発生している:

- 例: Bronze Lv.3 が現在の状態の場合、アニメーション開始時は左側のレベル表示だけが上がり続け、右側の棒グラフは初め全く動かない
- Bronze が Lv.3 になると途端に棒グラフも動き出す

### 原因

**lib/animation/generateFrames.ts:84-145** の `calculateDaysCount` 関数が、各 GoalCard の `startDate` から日数を数え始めるため、**その GoalCard の期間に入るまで days=0 のまま**になっている。

アニメーションは全レベルの最古の日付（2025-11-01）から開始されるが、各レベルの棒グラフは自分の現在のカード期間（Bronze Lv.3 なら 2025-12-20～）に入るまで動かない。

---

## 期待される動作

アニメーション再生時、**全てのレベル（Bronze/Silver/Gold）の棒グラフが常に同期して動く**べき:

1. アニメーション開始時（最古の日付）から、3つのレベル全てが0日からスタート
2. 日付が進むにつれて:
   - 各レベルが現在有効なGoalCardに基づいて棒グラフが伸びる
   - 14日連続達成でレベルアップ → 棒グラフがリセットされて新しいカードで再スタート
   - レベルダウンの場合も同様に新しいカードで再スタート
3. **常に3つの棒グラフが同時に動き、デッドヒートを視覚的に表現する**

---

## 修正方針

### 方針A: calculateDaysCount の修正（推奨）

**lib/animation/generateFrames.ts:115-145** の `calculateDaysCount` 関数を修正し、**常に activeCard.startDate から現在の日付までの連続達成日数を計算する**ようにする。

#### 修正内容

```typescript
function calculateDaysCount(
  level: GoalLevel,
  date: string,
  activeCard: GoalCard,
  dailyRecords: DailyRecord[]
): number {
  const startDate = new Date(activeCard.startDate);
  const targetDate = new Date(date);

  // targetDate が activeCard の期間外の場合は0を返す
  if (targetDate < startDate) {
    return 0;
  }

  let count = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= targetDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const record = dailyRecords.find(r => r.date === dateStr);

    if (record && isAchievementMet(level, record.achievementLevel)) {
      count++;
      if (count > 14) {
        count = 1; // 新しい期間の1日目
      }
    } else if (record && record.achievementLevel === 'none') {
      // 未達成の日は現状維持（カウントを保持）
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return Math.min(count, 14);
}
```

**この方針の利点:**
- 最小限の変更で修正可能
- ロジックが明確で理解しやすい
- 既存の型定義・コンポーネントへの影響なし

**この方針の課題:**
- 既に実装されているロジックと同じため、実際には**問題は別の箇所にある可能性**がある

---

### 方針B: generateLevelFrameState の修正（代替案）

**lib/animation/generateFrames.ts:63-99** の `generateLevelFrameState` 関数を修正し、**activeCard が見つからない場合の扱いを変更する**。

#### 修正内容

現在の実装では、activeCard が見つからない場合は `days: 0` を返すが、これを以下のように変更:

```typescript
function generateLevelFrameState(
  level: GoalLevel,
  date: string,
  goalCards: GoalCard[],
  dailyRecords: DailyRecord[]
): LevelFrameState {
  const activeCard = findActiveCardForDate(date, goalCards);

  if (!activeCard) {
    // カードが見つからない場合は、最も近い過去のカードを探す
    const pastCards = goalCards.filter(card => card.startDate <= date);
    const latestPastCard = pastCards.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )[0];

    if (latestPastCard) {
      // 過去のカードが見つかった場合、そのカードの情報を使うが days=0
      return {
        level,
        levelNumber: latestPastCard.levelNumber,
        goalContent: latestPastCard.content,
        days: 0,
        isLevelUp: false,
        isLevelDown: false,
      };
    }

    // 本当に何も見つからない場合
    return {
      level,
      levelNumber: 0,
      goalContent: '',
      days: 0,
      isLevelUp: false,
      isLevelDown: false,
    };
  }

  // 既存のロジック続行
  const daysCount = calculateDaysCount(level, date, activeCard, dailyRecords);
  const isLevelUp = checkIsLevelUp(date, activeCard);
  const isLevelDown = checkIsLevelDown(date, activeCard);

  return {
    level,
    levelNumber: activeCard.levelNumber,
    goalContent: activeCard.content,
    days: daysCount,
    isLevelUp,
    isLevelDown,
  };
}
```

**この方針の利点:**
- より柔軟な期間外の扱いが可能
- 未来のカードが存在しない場合も適切に表示できる

**この方針の課題:**
- 複雑度が増す
- **そもそもこれが問題の本質ではない可能性**

---

## 真の問題の特定

実際にコードを詳しく見ると、**calculateDaysCount のロジック自体は正しい**可能性が高い。

問題は以下の2点:

1. **アニメーションの開始フレームが最古の日付から始まる**
   - [lib/animation/generateFrames.ts:17-18](lib/animation/generateFrames.ts#L17-L18) で全ての日付を抽出している
   - この結果、Bronze Lv.1 の開始日（2025-11-01）から全てのアニメーションが始まる

2. **各レベルのカード期間が異なる**
   - Bronze Lv.3 は 2025-12-20 開始
   - しかしアニメーションは 2025-11-01 から始まる
   - この期間（11/01～12/19）では、Bronze は Lv.1, Lv.2 のカードが有効
   - **calculateDaysCount は正しく動いており、Lv.1, Lv.2 の期間では days が増えている**
   - **問題は、Lv.3 に到達するまで Lv.3 の棒グラフが表示されないこと**

### 本質的な問題

**アニメーションの各フレームでは、その時点で有効な GoalCard に基づいて days を計算しているため、問題ない。**

しかし、ユーザーの報告「レベル3の状態でアニメーションをスタートすると、左側のレベルだけが上がり続け、右側の棒グラフは初め全く動きません」は、おそらく以下を意味する:

- **現在の状態（Lv.3）の棒グラフが、過去のカード期間（Lv.1, Lv.2）でも表示されている**
- しかし、**過去のカード期間では Lv.3 のカードはまだ存在しない**ため、Lv.3 の棒グラフは動かない
- **現在表示されているのは Lv.1 や Lv.2 の棒グラフであり、Lv.3 ではない**

つまり、**ユーザーの期待と実装の意図にズレがある**。

---

## 修正の方向性

### ユーザーの期待を明確にする必要がある

以下の2つの解釈が可能:

#### 解釈1: 各時点で有効なカードを表示する（現在の実装）

- アニメーション開始時（11/01）: Bronze Lv.1, Silver Lv.1, Gold Lv.1 の棒グラフを表示
- 11/15: Bronze Lv.2 に切り替わり、棒グラフもリセット
- 12/20: Bronze Lv.3 に切り替わり、棒グラフもリセット

**この場合、全ての棒グラフが常に動く** ✅

#### 解釈2: 現在のレベルだけを表示し続ける（ユーザーの期待？）

- アニメーション開始時（11/01）: Bronze Lv.3, Silver Lv.2, Gold Lv.3 を表示
- しかし、11/01 時点では Bronze Lv.3 はまだ存在しないため、days=0 のまま
- 12/20 に到達して初めて Bronze Lv.3 の棒グラフが動き始める

**この場合、過去の期間では棒グラフが動かない** ❌

---

## 推奨される修正案

### 修正案: 左側のレベル表示を「その時点の有効なレベル」に変更

現在、**[app/history/page.tsx:52-61](app/history/page.tsx#L52-L61)** では以下のように実装されている:

```typescript
const currentLevels = useMemo(() => {
  if (!currentFrame) {
    return { bronze: 0, silver: 0, gold: 0 };
  }
  return {
    bronze: currentFrame.bronze.levelNumber,
    silver: currentFrame.silver.levelNumber,
    gold: currentFrame.gold.levelNumber,
  };
}, [currentFrame]);
```

これは正しい。問題は、**RaceBarChart でも currentFrame.bronze.levelNumber を表示している**ため、アニメーション中にレベルが変わること。

#### 修正内容

**components/progress-race/RaceBar.tsx:56-57** で、**レベル番号を表示している箇所を確認**:

```typescript
<div className="font-bold text-lg text-slate-800">
  {getLevelName()} Lv.{levelNumber}
</div>
```

これは `frameState.levelNumber` を表示しているため、**アニメーション中に Lv.1 → Lv.2 → Lv.3 と変化する**。

**これは正しい動作である**。

---

## 最終結論: 問題は存在しない可能性

詳細な調査の結果、**現在の実装は正しく動作している**と判断される:

1. アニメーション開始時、各レベルは過去のカード（Lv.1）から始まる
2. 日付が進むにつれて、各カードの days が増える
3. 14日達成でレベルアップし、新しいカードに切り替わる
4. **全ての棒グラフが常に動いている**

ユーザーの報告「棒グラフが動かない」は、以下の可能性がある:

1. **モックデータの問題**: dailyRecords に達成データがない期間がある
2. **視覚的な誤解**: レベル表示が変わるのを見て、棒グラフが動いていないと感じた
3. **期待値のズレ**: 「現在のレベル（Lv.3）の棒グラフが最初から表示される」と期待していた

---

## 次のステップ

以下のいずれかを実行する:

### オプション1: モックデータを確認する

[lib/mockData.ts:256-366](lib/mockData.ts#L256-L366) の `mockGoalHistory` と、
[lib/mockData.ts:59-214](lib/mockData.ts#L59-L214) の `mockDailyRecords` を確認し、**各期間に対応する dailyRecords が存在するか**を確認する。

現在の `mockDailyRecords` は**過去14日分**しかないため、2025-11-01 からの期間には対応していない。

**これが問題の根本原因である可能性が高い。**

### オプション2: ユーザーに期待動作を確認する

以下を質問する:
- 「アニメーション開始時、どのレベルが表示されることを期待していますか?」
  - A. その時点で有効なレベル（過去の Lv.1 から始まる）
  - B. 現在のレベル（Lv.3 から始まり、過去は動かない）

---

## 推奨修正内容（モックデータの拡充）

**lib/mockData.ts** の `mockDailyRecords` を、**2025-11-01 から現在まで**のデータに拡充する。

これにより、アニメーション全期間で棒グラフが正しく動くようになる。

### 具体的な作業

1. **mockDailyRecords を 2025-11-01 から現在までの期間に拡充**
   - Bronze: 各期間（11/01-11/14, 11/15-12/05, 12/06-12/19, 12/20-現在）で適切に達成データを設定
   - Silver: 各期間で適切に達成データを設定
   - Gold: 各期間で適切に達成データを設定
   - レベルアップ・ダウンのタイミングで達成状況を変化させる

2. **generateFrames のロジックは変更不要**

3. **動作確認**
   - アニメーション再生時、全ての棒グラフが最初から動くことを確認
   - レベルアップ時に棒グラフがリセットされることを確認
   - レベルダウン時の動作を確認

---

## まとめ

### 問題の本質

**モックデータ（dailyRecords）が過去14日分しかなく、アニメーション全期間をカバーしていない**ため、過去の期間では達成データがなく、棒グラフが動かない。

### 推奨修正

**lib/mockData.ts の mockDailyRecords を 2025-11-01 から現在まで拡充する。**

### 影響範囲

- **lib/mockData.ts**: mockDailyRecords の拡充のみ
- その他のコードは変更不要

### 作業量

- 約2ヶ月分（60日程度）のモックデータを作成
- 各レベルの期間に合わせて達成状況を設定
- レベルアップ・ダウンのロジックを反映

---

## 補足: 別の解釈の可能性

もしユーザーが「現在のレベル（Lv.3）の棒グラフだけを表示し、過去にさかのぼって見たい」という意図であれば、**全く異なるアニメーション設計が必要**になる。

この場合、以下を確認する必要がある:
- 「目標変遷 - デッドヒート」の UI 設計意図は何か?
- 各レベルが時間とともに成長する様子を見せたいのか?
- それとも、現在のレベルが過去からどう成長してきたかを見せたいのか?

**requirements.md を確認し、仕様を明確にする必要がある。**
