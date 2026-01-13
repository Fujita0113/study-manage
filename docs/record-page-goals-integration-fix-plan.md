# 日報登録画面（/record）目標表示バグ修正計画

## 作業概要

日報登録画面（/record）の「目標達成度」セクションで、goalsテーブルから取得した実際の目標内容が表示されない問題を修正する。

## 問題の根本原因

**APIレスポンスのデータ形式とフロントエンドの処理の不一致**

### 詳細

1. **`GET /api/goals`のレスポンス形式**:
   - 配列形式: `Goal[]`
   - 実際のデータ: `[{ level: "bronze", description: "朝散歩をする" }, { level: "silver", ... }, { level: "gold", ... }]`
   - [app/api/goals/route.ts:11-12](app/api/goals/route.ts#L11-L12)

2. **フロントエンドの期待する形式**:
   - オブジェクト形式: `{ bronze: Goal, silver: Goal, gold: Goal }`
   - [app/record/page.tsx:43-47](app/record/page.tsx#L43-L47)

3. **結果**:
   - `goalsData.bronze`は`undefined`
   - フォールバック処理により常にデフォルト値が使用される
   - 画面にはサンプル値が表示される

## 修正計画（アプローチA：フロントエンド側で配列を変換）

### 作業概要

[app/record/page.tsx](app/record/page.tsx)で、`GET /api/goals`から取得した配列形式のデータを、オブジェクト形式に変換してから使用する。

### 根本原因

**APIレスポンス形式とフロントエンド処理の不一致**

- **API**: 配列形式 `Goal[]` を返す
- **フロントエンド**: オブジェクト形式 `{ bronze: Goal, silver: Goal, gold: Goal }` を期待
- **結果**: データアクセスが失敗し、常にデフォルト値が使用される

### 使用する主要モジュールとバージョン

- **Next.js**: 16.1.1
- **React**: 19.2.3
- **TypeScript**: ^5

### 修正内容

#### 変更が必要なファイル

- **[app/record/page.tsx](app/record/page.tsx)** - 1箇所のみ修正

#### 修正箇所

[app/record/page.tsx:40-48](app/record/page.tsx#L40-L48)の目標データ取得処理を修正：

**Before（現在の実装 - 不具合あり）:**
```typescript
// 目標データを取得
const goalsResponse = await fetch('/api/goals');
if (goalsResponse.ok) {
  const goalsData = await goalsResponse.json();
  setGoals({
    bronze: goalsData.bronze?.description || '30分だけ座る',  // ❌ 配列に.bronzeは存在しない
    silver: goalsData.silver?.description || '1機能完成',
    gold: goalsData.gold?.description || 'リファクタまで完了'
  });
}
```

**After（修正後）:**
```typescript
// 目標データを取得
const goalsResponse = await fetch('/api/goals');
if (goalsResponse.ok) {
  const goalsData: Goal[] = await goalsResponse.json(); // 配列として取得

  // 配列をlevelをキーとしたオブジェクトに変換
  const goalsMap = goalsData.reduce((acc, goal) => {
    acc[goal.level] = goal;
    return acc;
  }, {} as Record<string, Goal>);

  setGoals({
    bronze: goalsMap.bronze?.description || '30分だけ座る',
    silver: goalsMap.silver?.description || '1機能完成',
    gold: goalsMap.gold?.description || 'リファクタまで完了'
  });
}
```

### 修正内容の詳細

#### [app/record/page.tsx:40-48](app/record/page.tsx#L40-L48)の修正

**修正前:**
```typescript
// 目標データを取得
const goalsResponse = await fetch('/api/goals');
if (goalsResponse.ok) {
  const goalsData = await goalsResponse.json();
  setGoals({
    bronze: goalsData.bronze?.description || '30分だけ座る',  // ❌ 配列に.bronzeは存在しない
    silver: goalsData.silver?.description || '1機能完成',
    gold: goalsData.gold?.description || 'リファクタまで完了'
  });
}
```

**修正後:**

```typescript
// 目標データを取得
const goalsResponse = await fetch('/api/goals');
if (goalsResponse.ok) {
  const goalsData: Goal[] = await goalsResponse.json(); // Goal[]型として明示

  // 配列をオブジェクトマップに変換
  const goalsMap = goalsData.reduce((acc, goal) => {
    acc[goal.level] = goal;
    return acc;
  }, {} as Record<string, Goal>);

  setGoals({
    bronze: goalsMap.bronze?.description || '30分だけ座る',
    silver: goalsMap.silver?.description || '1機能完成',
    gold: goalsMap.gold?.description || 'リファクタまで完了'
  });
}
```

#### ステップ2: 型のインポート追加

`Goal`型を使用するため、ファイル冒頭のimport文に追加：

```typescript
import type { DailyRecord, Goal } from '@/types';
```

### コード変更の詳細

#### 変更箇所1: useEffect内のgoals取得処理（43-47行目）

**Before:**
```typescript
const goalsData = await goalsResponse.json();
setGoals({
  bronze: goalsData.bronze?.description || '30分だけ座る',
  silver: goalsData.silver?.description || '1機能完成',
  gold: goalsData.gold?.description || 'リファクタまで完了'
});
```

**After:**
```typescript
const goalsData: Goal[] = await goalsResponse.json();
// 配列をオブジェクト形式に変換
const goalsMap = goalsData.reduce((acc, goal) => {
  acc[goal.level] = goal;
  return acc;
}, {} as Record<string, Goal>);

setGoals({
  bronze: goalsMap.bronze?.description || '30分だけ座る',
  silver: goalsMap.silver?.description || '1機能完成',
  gold: goalsMap.gold?.description || 'リファクタまで完了'
});
```

### 実装の詳細

#### 修正箇所

[app/record/page.tsx:42-48](app/record/page.tsx#L42-L48)

#### 修正前のコード

```typescript
const goalsData = await goalsResponse.json();
setGoals({
  bronze: goalsData.bronze?.description || '30分だけ座る',
  silver: goalsData.silver?.description || '1機能完成',
  gold: goalsData.gold?.description || 'リファクタまで完了'
});
```

#### 修正後のコード

```typescript
const goalsData: Goal[] = await goalsResponse.json(); // 配列として受け取る
// 配列をオブジェクト形式に変換
const goalsMap = goalsData.reduce((acc, goal) => {
  acc[goal.level] = goal;
  return acc;
}, {} as Record<string, Goal>);

setGoals({
  bronze: goalsMap.bronze?.description || '30分だけ座る',
  silver: goalsMap.silver?.description || '1機能完成',
  gold: goalsMap.gold?.description || 'リファクタまで完了'
});
```

### 変更の説明

1. **配列として受け取る**: `goalsData`を`Goal[]`型として明示
2. **reduce関数で変換**: 配列をオブジェクト形式に変換
   - `{ bronze: Goal, silver: Goal, gold: Goal }` の形式に変換
3. **既存のロジックを維持**: 変換後は既存のコードと同じロジックで動作

### 影響範囲

- **変更ファイル**: [app/record/page.tsx](app/record/page.tsx)の43-47行目のみ
- **他の箇所**: 影響なし（APIや他の画面は変更不要）

### エラーハンドリング

- 空の配列が返された場合: `goalsMap`は空オブジェクトとなり、デフォルト値が使用される
- 特定のレベルが欠けている場合: そのレベルのデフォルト値が使用される

## テスト方針

### 手動テスト項目

1. **正常系**
   - [ ] 目標が設定されている状態で/recordにアクセスし、各レベルのExampleに実際の目標内容が表示されることを確認
   - [ ] Bronze/Silver/Goldそれぞれの目標内容が正しく表示されることを確認

2. **異常系**
   - [ ] 目標が未設定の状態で/recordにアクセスし、デフォルト値が表示されることを確認
   - [ ] ネットワークエラー時にデフォルト値が表示されることを確認

3. **統合テスト**
   - [ ] 目標編集画面で目標を変更後、/recordページで新しい目標が反映されることを確認
   - [ ] ページリロード後も正しい目標が表示されることを確認

修正計画を [docs/record-page-goals-integration-plan.md](docs/record-page-goals-integration-plan.md) に更新しました。

この計画で実装を進めてよろしいでしょうか？