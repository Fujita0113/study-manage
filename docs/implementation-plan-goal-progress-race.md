# 目標変遷画面リニューアル 実装計画書

## 概要

既存の「目標変遷画面（Goal History Timeline）」を、「目標変遷画面（Goal Progress Race）」として全面リニューアルします。横スクロールのタイムライン表示から、デッドヒート形式の横棒グラフアニメーションに変更し、過去から現在までの成長プロセスを視覚的に体験できるようにします。

## 要件概要

### 変更内容
- 横スクロールタイムライン → 横棒グラフアニメーション（デッドヒート形式）
- 目標カード表示 → 3本のバー（初級・中級・上級）
- 静的な履歴表示 → アニメーションによる動的な成長プロセス再生
- レベル称号システムの導入（各レベル独立でLv.を管理）

### 主要機能
1. デッドヒート形式の横棒グラフ（0〜14日ゲージ）
2. アニメーション再生（過去から現在まで全履歴）
3. レベルアップ・レベルダウンのエフェクト演出
4. レベル履歴詳細モーダル（総達成率表示含む）

---

## データモデルの変更

### 1. 目標スロット（GoalSlot）への追加フィールド

既存のデータモデルに以下のフィールドを追加する必要があります：

```typescript
// 既存フィールド
interface GoalSlot {
  id: string;
  goalLevel: 'Bronze' | 'Silver' | 'Gold';
  goalContent: string;
  startDate: string; // ISO 8601
  endDate: string | null; // ISO 8601 or null (現在進行中)
  reason: 'levelUp' | 'levelDown' | null;

  // 新規追加フィールド
  level: number; // レベル（Lv.1, Lv.2, ...）
  // レベルアップ時：前のスロットのlevel + 1
  // レベルダウン時：前のスロットのlevelと同じ（横ばい）
}
```

### 2. デイリーレコード（DailyRecord）の参照

アニメーション再生のために、各日のデイリーレコードを参照し、以下を判定します：
- その日にBronze/Silver/Goldのいずれを達成したか
- 連続達成日数のカウント
- 14日到達でレベルアップ、7日中4日未達でレベルダウンの判定

---

## 実装の構成要素

### 1. コンポーネント構成

```
GoalProgressRacePage (新規作成)
├── GoalProgressRaceView (メインビュー)
│   ├── LevelDisplay (現在のレベル表示)
│   ├── RaceBarChart (デッドヒート表示)
│   │   ├── RaceBar (各レベルのバー) × 3
│   │   │   ├── BarLabel (目標内容ラベル)
│   │   │   ├── BarGauge (0〜14日のゲージ)
│   │   │   └── LevelUpEffect (エフェクト演出)
│   ├── PlaybackControls (再生コントロール)
│   └── LevelHistoryModal (レベル履歴モーダル)
```

### 2. 状態管理

```typescript
interface GoalProgressRaceState {
  // アニメーション関連
  isPlaying: boolean;
  currentAnimationFrame: number;
  totalFrames: number;

  // データ関連
  goalSlots: {
    bronze: GoalSlot[];
    silver: GoalSlot[];
    gold: GoalSlot[];
  };
  dailyRecords: DailyRecord[];

  // 現在の表示状態
  currentBronzeLevel: number;
  currentSilverLevel: number;
  currentGoldLevel: number;
  currentBronzeGoal: string;
  currentSilverGoal: string;
  currentGoldGoal: string;
  currentBronzeDays: number; // 0〜14
  currentSilverDays: number; // 0〜14
  currentGoldDays: number; // 0〜14

  // モーダル関連
  selectedLevel: 'Bronze' | 'Silver' | 'Gold' | null;
  isModalOpen: boolean;
}
```

### 3. アニメーションロジック

#### 3-1. データの前処理

1. 全GoalSlotを取得（Bronze/Silver/Gold別）
2. 全DailyRecordを取得（日付順）
3. 各日ごとに以下を計算：
   - 各レベルの連続達成日数
   - その日時点でのレベル（Lv.）
   - その日時点での目標内容
   - レベルアップ・レベルダウンのタイミング

#### 3-2. アニメーションフレームの生成

```typescript
interface AnimationFrame {
  date: string; // ISO 8601
  bronze: {
    level: number;
    goalContent: string;
    days: number; // 0〜14
    isLevelUp: boolean;
    isLevelDown: boolean;
  };
  silver: {
    level: number;
    goalContent: string;
    days: number; // 0〜14
    isLevelUp: boolean;
    isLevelDown: boolean;
  };
  gold: {
    level: number;
    goalContent: string;
    days: number; // 0〜14
    isLevelUp: boolean;
    isLevelDown: boolean;
  };
}
```

#### 3-3. アニメーション再生

- `requestAnimationFrame`または`setInterval`を使用
- 各フレームごとにバーの長さを更新
- 14日到達時に「LEVEL UP!」エフェクトを表示
- レベルダウン時に「ADJUST!」エフェクトを表示

---

## 実装の段階的アプローチ

### Phase 1: データモデルの拡張とマイグレーション

**タスク:**
1. GoalSlotに`level`フィールドを追加
2. 既存データのマイグレーション処理を実装
   - 既存のGoalSlotに対して、時系列順にlevelを自動計算
   - levelUp時は+1、levelDown時は横ばい
3. データモデルのユニットテスト

**成果物:**
- 更新されたデータモデル型定義
- マイグレーションスクリプト
- テストコード

---

### Phase 2: アニメーションロジックの実装

**タスク:**
1. アニメーションフレーム生成関数の実装
   - GoalSlotとDailyRecordから、日ごとのフレームデータを生成
   - 連続達成日数のカウントロジック
   - レベルアップ・レベルダウンの判定ロジック
2. アニメーション再生エンジンの実装
   - フレーム単位での状態更新
   - 再生・一時停止・リセット機能
3. ロジックのユニットテスト

**成果物:**
- アニメーションロジック関数
- テストコード

---

### Phase 3: UIコンポーネントの実装

**タスク:**
1. `RaceBarChart`コンポーネント
   - 3本のバー（初級・中級・上級）を表示
   - バーのラベル（目標内容）を表示
   - 0〜14日のゲージを視覚化
2. `RaceBar`コンポーネント
   - バーのアニメーション（0→14日へ伸びる）
   - バーの色（Bronze/Silver/Gold）
3. `LevelUpEffect`コンポーネント
   - 「LEVEL UP!」エフェクトの表示
   - 「ADJUST!」エフェクトの表示
4. `LevelDisplay`コンポーネント
   - 現在のレベル表示（例：「初級 Lv.3」）

**成果物:**
- UIコンポーネント一式
- Storybookストーリー（任意）

---

### Phase 4: 再生コントロールの実装

**タスク:**
1. `PlaybackControls`コンポーネント
   - 再生ボタン
   - 一時停止ボタン
   - リセットボタン（任意）
2. 再生状態の管理
   - 再生中・停止中の状態管理
   - 再生速度の調整（任意）

**成果物:**
- 再生コントロールコンポーネント
- 状態管理ロジック

---

### Phase 5: レベル履歴モーダルの実装

**タスク:**
1. `LevelHistoryModal`コンポーネント
   - モーダルの開閉制御
   - レベル履歴リストの表示
   - 総達成率の計算と表示
2. 総達成率の計算ロジック
   - 「そのレベルの目標を達成した日数 ÷ そのレベルでの総日数」
3. 期間情報の表示
   - 各レベルがいつからいつまで有効だったか

**成果物:**
- モーダルコンポーネント
- 総達成率計算関数
- テストコード

---

### Phase 6: ページ統合とルーティング

**タスク:**
1. `GoalProgressRacePage`の作成
   - 全コンポーネントの統合
   - データフェッチング処理
2. ルーティングの設定
   - 既存の目標変遷画面のルートを新画面に置き換え
3. エラーハンドリング
   - データが存在しない場合の表示
   - アニメーション再生エラーのハンドリング

**成果物:**
- 完成した目標変遷画面
- ルーティング設定

---

### Phase 7: スタイリングと最終調整

**タスク:**
1. レスポンシブ対応（PC画面最適化）
2. アニメーションのパフォーマンス最適化
3. アクセシビリティ対応
4. ブラウザ互換性の確認

**成果物:**
- 完全にスタイリングされた画面
- パフォーマンスレポート

---

### Phase 8: テストと品質保証

**タスク:**
1. E2Eテストの実装
   - アニメーション再生のテスト
   - モーダル開閉のテスト
   - レベル履歴表示のテスト
2. ユーザビリティテスト
3. バグ修正

**成果物:**
- E2Eテストコード
- バグ修正パッチ

---

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript
- **スタイリング**: TailwindCSS
- **アニメーション**: Framer Motion または CSS Animations
- **状態管理**: React Hooks (useState, useEffect, useReducer)

### データ管理
- **データベース**: JSON形式のローカルストレージ（既存の仕組みを踏襲）
- **データフェッチング**: クライアントサイドフェッチング

---

## リスクと対策

### リスク1: アニメーションのパフォーマンス問題
**対策:**
- 大量のフレームデータを扱う場合、間引き処理を実装
- `requestAnimationFrame`を使用したスムーズな描画
- 必要に応じてWebWorkerでのデータ処理

### リスク2: 既存データとの互換性
**対策:**
- マイグレーション処理の徹底テスト
- 既存データのバックアップ機能の実装
- ロールバック可能な設計

### リスク3: ユーザー体験の低下
**対策:**
- アニメーションの再生速度を適切に調整
- スキップ機能の実装（任意）
- 初回起動時のガイド表示

---

## 成功基準

1. アニメーションがスムーズに再生される（60fps維持）
2. 全履歴データが正確にアニメーション化される
3. レベルアップ・レベルダウンのエフェクトが適切に表示される
4. モーダルで総達成率が正確に計算・表示される
5. 既存の目標変更ロジック（提案バナー、目標編集画面）との整合性が保たれる

---

## スケジュール概算

| Phase | 内容 | 想定期間 |
|-------|------|----------|
| Phase 1 | データモデル拡張 | 実装に応じて調整 |
| Phase 2 | アニメーションロジック | 実装に応じて調整 |
| Phase 3 | UIコンポーネント | 実装に応じて調整 |
| Phase 4 | 再生コントロール | 実装に応じて調整 |
| Phase 5 | レベル履歴モーダル | 実装に応じて調整 |
| Phase 6 | ページ統合 | 実装に応じて調整 |
| Phase 7 | スタイリング・最終調整 | 実装に応じて調整 |
| Phase 8 | テスト・品質保証 | 実装に応じて調整 |

---

## 補足事項

### 既存機能との連携
- 提案バナーのロジックは変更なし
- 目標編集画面のロジックは変更なし（新しいGoalSlotが作成される際にlevelフィールドが自動計算される）
- デイリーレコードのロジックは変更なし

### 将来の拡張性
- アニメーション再生速度の調整機能
- 特定期間のみを再生する機能
- レベル履歴のエクスポート機能
- 達成率グラフの追加表示

---

## 結論

この実装計画に従って段階的に開発を進めることで、既存の目標変遷画面を、ユーザーの成長プロセスを視覚的に体験できる魅力的な「目標変遷画面（Goal Progress Race）」にリニューアルできます。各Phaseで成果物を確認しながら進めることで、品質とスケジュールの両立を図ります。
