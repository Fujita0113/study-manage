# 目標編集時のgoalsテーブル更新不具合 修正計画

## 問題の概要

`/goals?edit=bronze`で目標を編集したとき、`goal_history_slot`テーブルは正しく編集されているが、`goals`テーブルが編集されていない問題。

## 調査結果

### 原因特定

1. **APIエンドポイントの問題** ([app/api/goals/route.ts:47-58](app/api/goals/route.ts#L47-L58))
   - PUT /api/goalsエンドポイントは、常に3つの目標（bronze, silver, gold）すべてを更新しようとしている
   - 編集権限に関係なく、すべての目標に対して`updateGoal`関数を呼び出している

2. **クライアント側の実装** ([app/goals/GoalsClient.tsx:49-54](app/goals/GoalsClient.tsx#L49-L54))
   - クライアントは編集権限に関係なく、3つの目標すべての値をAPIに送信している
   - 入力フィールドはdisabledになっているが、初期値がそのまま送信される

3. **実際の挙動**
   - `updateGoal`関数自体は正常に動作している（[lib/db.ts:151-181](lib/db.ts#L151-L181)）
   - しかし、編集不可の目標も同じ値で上書きされているため、変更が反映されていないように見える
   - または、Supabaseへのクエリが失敗しているがエラーがログに出ていない可能性

### 疑問点

**ユーザーへの確認が必要：**

編集権限の仕様について、以下のどちらが正しい仕様でしょうか？

- **パターンA（部分編集）**: 編集権限のある目標のみを更新し、編集権限のない目標は変更しない
- **パターンB（全体編集）**: 編集権限のない目標も含め、すべての目標を毎回更新する（ただし、編集不可の目標は変更できないようにUIで制限）

## 修正計画

### 前提

- パターンA（部分編集）が正しい仕様と仮定して計画を立てる
- ユーザーの確認後、必要に応じて調整する

### 使用する主要モジュールとバージョン

- **Next.js**: 16.1.1
- **@supabase/supabase-js**: ^2.90.1
- **@supabase/ssr**: ^0.8.0
- **TypeScript**: ^5

### 変更が必要なファイル

1. `app/api/goals/route.ts` - PUTエンドポイントのロジック修正
2. `app/goals/GoalsClient.tsx` - クライアント側の送信データ調整
3. `lib/db.ts` - updateGoal関数のエラーハンドリング強化（必要に応じて）

### 実装手順

#### Step 1: APIエンドポイントの修正

**ファイル**: `app/api/goals/route.ts`

**変更内容**:

1. リクエストボディに`editableGoals`パラメータを追加
   - `editableGoals: GoalLevel[]` - 編集可能な目標レベルのリスト

2. 編集可能な目標のみを更新するロジックに変更
   ```typescript
   // 編集可能な目標のみ更新
   if (editableGoals.includes('bronze')) {
     await updateGoal('bronze', bronze.trim());
   }
   if (editableGoals.includes('silver')) {
     await updateGoal('silver', silver.trim());
   }
   if (editableGoals.includes('gold')) {
     await updateGoal('gold', gold.trim());
   }
   ```

3. エラーハンドリングの強化
   - 各updateGoal呼び出しをtry-catchで囲む
   - 失敗した目標レベルを明確にログ出力

#### Step 2: クライアント側の修正

**ファイル**: `app/goals/GoalsClient.tsx`

**変更内容**:

1. 編集可能な目標のリストを計算
   ```typescript
   const editableGoals: GoalLevel[] = [];
   if (canEditBronze) editableGoals.push('bronze');
   if (canEditSilver) editableGoals.push('silver');
   if (canEditGold) editableGoals.push('gold');
   ```

2. APIリクエストに`editableGoals`を含める
   ```typescript
   body: JSON.stringify({
     bronze: bronzeDesc.trim(),
     silver: silverDesc.trim(),
     gold: goldDesc.trim(),
     editableGoals,
     changeReason: determineChangeReason(editParam),
   })
   ```

#### Step 3: デバッグログの追加

**ファイル**: `lib/db.ts`

**変更内容**:

1. updateGoal関数に詳細なログを追加
   - 更新前の値
   - 更新後の値
   - Supabaseから返された結果

2. エラー時のスタックトレース出力

### 想定される影響範囲

- **直接影響**: 目標編集機能（/goals）
- **間接影響**: 目標履歴（goal_history_slots）の整合性
- **データベース**: goalsテーブルへの更新クエリの変更

### テスト方針

1. **正常系テスト**:
   - Bronze編集権限で、Bronze目標のみが更新されることを確認
   - Silver編集権限で、Silver目標のみが更新されることを確認
   - Gold編集権限で、Gold目標のみが更新されることを確認
   - all編集権限で、すべての目標が更新されることを確認

2. **異常系テスト**:
   - 編集権限のない目標が更新されないことを確認
   - Supabaseエラー時の適切なエラーメッセージ表示

3. **データ整合性テスト**:
   - goalsテーブルとgoal_history_slotsテーブルの整合性確認

### 代替案: パターンB（全体編集）の場合

もしパターンBが正しい仕様の場合：

1. 現在の実装を維持
2. デバッグログを追加して、なぜgoalsテーブルが更新されていないのかを特定
3. Supabaseクエリの失敗原因を調査
4. 必要に応じてupdateGoal関数の修正

## 次のステップ

1. **ユーザーへの確認**: パターンAとパターンBのどちらが正しい仕様か確認
2. **確認後**: 該当するパターンの修正を実装
3. **テスト**: 修正後の動作確認
