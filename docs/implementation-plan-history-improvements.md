# 目標変遷画面（/history）改善 実装計画

## 変更要件サマリー

1. **初期表示の変更**: 画面を開いた時点で最新（現在）の状態を静止画表示し、再生ボタンで過去からアニメーションを開始
2. **表記の統一**: 「初級・中級・上級」から「Bronze/Silver/Gold」に完全統一
3. **モーダルバッジ表示ロジックの修正**: 前のカードのtransitionTypeを次のカードに表示する形に変更

---

## 実装タスク

### タスク1: 初期表示の変更（アニメーションエンジンの修正）

**対象ファイル**: [lib/animation/useAnimationEngine.ts](../lib/animation/useAnimationEngine.ts)

**変更内容**:
- 現在の実装では初期化時に`currentFrameIndex = 0`（最初のフレーム）から開始している
- これを**最終フレーム**（`frames.length - 1`）から開始するように変更
- 再生ボタン押下時に、インデックスを0にリセットしてから再生を開始

**実装詳細**:
```typescript
// useAnimationEngine.ts
const reset = () => {
  // 現在: 最初のフレーム（index=0）にリセット
  // 変更後: 最終フレーム（index=frames.length-1）にリセット
  setState({
    currentFrameIndex: frames.length - 1,
    isPlaying: false,
    totalFrames: frames.length
  });
};

// playボタンを押した時の処理を追加
const play = () => {
  // 現在最終フレームにいる場合は、最初からアニメーションを開始
  if (state.currentFrameIndex === frames.length - 1) {
    setState({
      currentFrameIndex: 0,
      isPlaying: true,
      totalFrames: frames.length
    });
  } else {
    // 途中で止めた場合は続きから再生
    setState({
      ...state,
      isPlaying: true
    });
  }
};
```

**影響範囲**:
- [lib/animation/useAnimationEngine.ts](../lib/animation/useAnimationEngine.ts): フックの実装変更
- [app/history/page.tsx](../app/history/page.tsx): 初期化ロジックの確認（おそらく変更不要）

---

### タスク2: 表記の統一（初級・中級・上級 → Bronze/Silver/Gold）

#### タスク2-1: ページヘッダーの説明文修正

**対象ファイル**: [app/history/page.tsx](../app/history/page.tsx)

**変更箇所**: 70行目
```typescript
// 変更前
各目標レベル（初級/中級/上級）の成長プロセスをアニメーションで確認できます。

// 変更後
各目標レベル（Bronze/Silver/Gold）の成長プロセスをアニメーションで確認できます。
```

#### タスク2-2: LevelDisplayコンポーネントの修正

**対象ファイル**: [components/progress-race/LevelDisplay.tsx](../components/progress-race/LevelDisplay.tsx)

**変更内容**:
- レベル名表示を「初級」「中級」「上級」から「Bronze」「Silver」「Gold」に変更
- 表記統一のため、getLevelName関数を削除または英語名を返すように変更

**想定される変更**:
```typescript
// 変更前
const getLevelName = (level: 'bronze' | 'silver' | 'gold') => {
  switch (level) {
    case 'bronze': return '初級';
    case 'silver': return '中級';
    case 'gold': return '上級';
  }
};

// 変更後
const getLevelName = (level: 'bronze' | 'silver' | 'gold') => {
  switch (level) {
    case 'bronze': return 'Bronze';
    case 'silver': return 'Silver';
    case 'gold': return 'Gold';
  }
};
```

#### タスク2-3: RaceBarChartコンポーネントの修正

**対象ファイル**: [components/progress-race/RaceBarChart.tsx](../components/progress-race/RaceBarChart.tsx)

**変更内容**:
- バーのラベルに表示されるレベル名を英語表記に変更
- 「初級：〜」「中級：〜」「上級：〜」→「Bronze：〜」「Silver：〜」「Gold：〜」

#### タスク2-4: LevelHistoryModalコンポーネントの修正

**対象ファイル**: [components/progress-race/LevelHistoryModal.tsx](../components/progress-race/LevelHistoryModal.tsx)

**変更箇所**: 58-69行目のgetLevelName関数
```typescript
// 変更前
const getLevelName = () => {
  switch (level) {
    case 'bronze': return '初級';
    case 'silver': return '中級';
    case 'gold': return '上級';
    default: return '';
  }
};

// 変更後
const getLevelName = () => {
  switch (level) {
    case 'bronze': return 'Bronze';
    case 'silver': return 'Silver';
    case 'gold': return 'Gold';
    default: return '';
  }
};
```

---

### タスク3: モーダルバッジ表示ロジックの修正

**対象ファイル**: [components/progress-race/LevelHistoryModal.tsx](../components/progress-race/LevelHistoryModal.tsx)

**変更箇所**: 125-154行目のレベル履歴リスト表示部分

**現在のロジック**:
```typescript
{goalCards.map((card, index) => (
  <div key={card.id}>
    {/* カード情報表示 */}
    {card.transitionType && (
      // このカード自身のtransitionTypeを表示
    )}
  </div>
))}
```

**変更後のロジック**:
```typescript
{goalCards.map((card, index) => {
  // 前のカードのtransitionTypeを取得
  const previousCard = index > 0 ? goalCards[index - 1] : null;
  const transitionBadge = previousCard?.transitionType;

  return (
    <div key={card.id}>
      {/* カード情報表示 */}
      {transitionBadge && (
        // 前のカードのtransitionTypeをこのカードに表示
        <div className="mt-2">
          {transitionBadge === 'level_up' ? (
            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              ↗️ レベルアップ
            </span>
          ) : (
            <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
              ↘️ 目標調整
            </span>
          )}
        </div>
      )}
    </div>
  );
})}
```

**表示ルール**:
- Lv.1（index=0）: バッジなし（初期状態のため）
- Lv.2（index=1）: Lv.1のtransitionTypeがあれば表示
- Lv.3（index=2）: Lv.2のtransitionTypeがあれば表示
- 以降同様

---

## 実装順序

1. **タスク2（表記統一）**: 影響範囲が明確で、リスクが低い
   - タスク2-1: page.tsx
   - タスク2-2: LevelDisplay.tsx
   - タスク2-3: RaceBarChart.tsx
   - タスク2-4: LevelHistoryModal.tsx

2. **タスク3（モーダルバッジ）**: UI表示のみの変更で、ロジックがシンプル
   - LevelHistoryModal.tsx の1ファイルのみ

3. **タスク1（初期表示）**: アニメーションエンジンの変更で、最も影響範囲が大きい
   - useAnimationEngine.ts の詳細確認が必要
   - 動作確認が必須

---

## 想定される課題と対応

### 課題1: useAnimationEngineの現在の実装が不明

**対応**:
- まず[lib/animation/useAnimationEngine.ts](../lib/animation/useAnimationEngine.ts)を読んで現在の実装を把握
- 初期化ロジック、play/pause/resetの実装を確認
- 必要に応じて実装方針を調整

### 課題2: アニメーション再生中にリセットボタンを押した時の挙動

**対応**:
- 再生中にリセットを押した場合は、一時停止して最終フレームに戻る
- または、再生を停止して最初のフレーム（index=0）に戻る
- requirements.mdでは「アニメーション終了後、再度最初から見たい場合に使用」とあるため、後者が適切

### 課題3: RaceBarChartの実装が不明

**対応**:
- [components/progress-race/RaceBarChart.tsx](../components/progress-race/RaceBarChart.tsx)を読んで現在の実装を確認
- レベル名表示箇所を特定して修正

---

## テスト観点

1. **初期表示**: 画面を開いた時に最終フレームが表示されるか
2. **再生ボタン**: 押下で最初のフレームからアニメーションが開始されるか
3. **一時停止**: アニメーション途中で停止できるか
4. **リセット**: 最終フレームに戻るか（または最初のフレームに戻るか）
5. **表記統一**: すべての箇所でBronze/Silver/Gold表記になっているか
6. **モーダルバッジ**: Lv.2以降のカードに前のカードのtransitionTypeが表示されるか
7. **Lv.1のバッジ**: Lv.1にはバッジが表示されないか

---

## 完了条件

- [ ] 画面を開いた時点で最新状態が表示される
- [ ] 再生ボタン押下で過去からアニメーションが開始される
- [ ] すべての表記がBronze/Silver/Goldに統一されている
- [ ] モーダル内で次のカードに前のカードのtransitionTypeバッジが表示される
- [ ] Lv.1にはバッジが表示されない
- [ ] requirements.mdの要件をすべて満たしている
