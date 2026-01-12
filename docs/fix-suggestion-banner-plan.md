# 提案バナー表示バグ修正計画

## 作業の目的と概要

ホーム画面に目標編集提案ダイアログ（提案バナー）が表示されない問題を修正する。

### 問題の詳細

**現象**:
- DBに14日以上連続でBronze以上を達成しているデータが登録されているにも関わらず、ホーム画面に提案バナーが表示されない

**現在のDBデータ**:
```
2026-01-12: Gold
2026-01-11 ~ 2025-12-27: Bronze (16日間)
合計17日分のBronze以上の記録
```

**原因**:
[lib/db.ts:237-245](lib/db.ts#L237-L245)の`getSuggestion`関数内のBronze連続達成判定ロジックが誤っている。

```typescript
// 現在の実装（誤り）
const allBronze = recentRecords.every((r) => r.achievementLevel === 'bronze');
if (allBronze && recentRecords.length === 14) {
  return {
    type: 'level_up',
    message: 'Bronzeレベルを14日連続達成しました！目標をレベルアップしませんか？',
    targetLevel: 'bronze',
    canEditAllGoals: false,
  };
}
```

この実装では「**ちょうどBronzeのみ**を14日連続達成」した場合のみ提案が表示される。
しかし、要件定義では「**Bronze以上**を14日連続達成」と解釈すべきである。

つまり、Bronze、Silver、Goldのいずれかを14日以上連続で達成していれば、各レベルの提案バナーを表示する必要がある。

## 使用する主要モジュールとバージョン

- **@supabase/supabase-js**: ^2.90.1
- **date-fns**: ^4.1.0（必要に応じて）
- Next.js: 16.1.1
- TypeScript: ^5

## 依存関係で注意すべき点

特になし。既存のSupabaseクライアント機能のみを使用する。

## 変更が必要なファイルのリスト

1. **lib/db.ts** - `getSuggestion`関数の修正

## 各ファイルでの具体的な変更内容

### 1. lib/db.ts

**変更箇所**: `getSuggestion`関数（207-259行目）

**変更内容**:

現在の判定ロジック:
```typescript
// Check Gold level up
const allGold = recentRecords.every((r) => r.achievementLevel === 'gold');
if (allGold && recentRecords.length === 14) { ... }

// Check Silver level up
const allSilver = recentRecords.every((r) => r.achievementLevel === 'silver');
if (allSilver && recentRecords.length === 14) { ... }

// Check Bronze level up
const allBronze = recentRecords.every((r) => r.achievementLevel === 'bronze');
if (allBronze && recentRecords.length === 14) { ... }
```

修正後の判定ロジック:
```typescript
// Check Gold level up (Gold以上を14日連続)
const allGoldOrAbove = recentRecords.every((r) => r.achievementLevel === 'gold');
if (allGoldOrAbove && recentRecords.length === 14) { ... }

// Check Silver level up (Silver以上を14日連続 = Silver or Gold)
const allSilverOrAbove = recentRecords.every((r) =>
  r.achievementLevel === 'silver' || r.achievementLevel === 'gold'
);
if (allSilverOrAbove && recentRecords.length === 14) { ... }

// Check Bronze level up (Bronze以上を14日連続 = Bronze or Silver or Gold)
const allBronzeOrAbove = recentRecords.every((r) =>
  r.achievementLevel === 'bronze' ||
  r.achievementLevel === 'silver' ||
  r.achievementLevel === 'gold'
);
if (allBronzeOrAbove && recentRecords.length === 14) { ... }
```

**判定の優先順位**:
1. Goldを14日連続達成 → Gold目標のレベルアップ提案
2. Silver以上を14日連続達成（かつGold14日連続ではない）→ Silver目標のレベルアップ提案
3. Bronze以上を14日連続達成（かつSilver以上14日連続ではない）→ Bronze目標のレベルアップ提案

このように、上位レベルの提案を優先して表示する。

## 実装手順

### Step 1: lib/db.tsの修正

1. `getSuggestion`関数の各レベルアップ判定ロジックを修正
2. 判定条件を「そのレベル以上」に変更
3. 判定の優先順位を維持（Gold → Silver → Bronze）

### Step 2: 動作確認

1. 開発サーバーを起動
2. ホーム画面にアクセス
3. 提案バナーが表示されることを確認
4. 表示されるメッセージが「Bronzeレベルを14日連続達成しました！」であることを確認

### Step 3: 追加テストケース

以下のデータパターンでも正しく動作することを確認：

**テストケース1**: Gold 14日連続
- 期待結果: Gold目標のレベルアップ提案

**テストケース2**: Silver 10日 + Gold 4日（合計14日でSilver以上）
- 期待結果: Silver目標のレベルアップ提案

**テストケース3**: Bronze 10日 + Silver 4日（合計14日でBronze以上）
- 期待結果: Bronze目標のレベルアップ提案

**テストケース4**: Bronze 13日 + Gold 1日（現在のDBの状態）
- 期待結果: Bronze目標のレベルアップ提案

**テストケース5**: Bronze 13日のみ（14日未満）
- 期待結果: 提案バナーなし

## 想定される影響範囲

### 影響あり
- ホーム画面の提案バナー表示ロジック
- 目標編集画面へのアクセス条件

### 影響なし
- 他の画面（記録画面、カレンダー画面、目標変遷画面、設定画面）
- データベーススキーマ
- Supabaseとの連携部分

## テスト方針

### 単体テスト（手動確認）
1. `getSuggestion`関数の戻り値を各パターンで確認
2. 上記のテストケース1〜5で動作確認

### 統合テスト（手動確認）
1. ホーム画面で提案バナーが正しく表示されることを確認
2. 提案バナーのボタンから目標編集画面に遷移できることを確認
3. 編集権限が正しく設定されていることを確認

## 備考

### 要件定義の解釈

[docs/requirements.md:63-68](docs/requirements.md#L63-L68)より：

```
#### 表示条件と編集権限
- **レベルアップ提案**:
    - **Gold を14日連続達成**: Gold目標のみ編集可能
    - **Silver を14日連続達成**: Silver目標のみ編集可能
    - **Bronze を14日連続達成**: Bronze目標のみ編集可能
```

ここで「Bronze を14日連続達成」とは、「Bronze **以上** を14日連続達成」の意味であることを、ユーザーに確認済み。

### 今後の拡張性

将来的に、各レベルごとの連続達成日数を個別に追跡する機能を追加する場合は、以下のようなロジックに変更する必要がある：

- Bronze連続達成日数: Bronze以上を連続で達成した日数
- Silver連続達成日数: Silver以上を連続で達成した日数
- Gold連続達成日数: Goldを連続で達成した日数

これにより、各レベルの進捗を独立して管理できる。
