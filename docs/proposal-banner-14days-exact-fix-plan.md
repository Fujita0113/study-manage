# 提案バナー表示条件修正計画 - ちょうど14日連続達成のみ表示

## 問題の概要

**現状の問題:**
- 15日以上連続達成している場合でも、提案バナーが表示され続ける
- ユーザーの意図：ちょうど14日連続達成した日のみ表示し、15日目以降は非表示にする

**原因:**
[lib/db.ts:414-487](lib/db.ts#L414-L487) の `getSuggestion()` 関数が「最近14件の記録」しかチェックしておらず、「ちょうど14日連続」か「15日以上連続」かを区別していない。

## 要件の明確化

### 正しい仕様

- **14日目**: 提案バナーを表示（条件：ちょうど14日連続達成 & 当日未表示）
- **15日目以降**: 提案バナーを非表示（連続達成は継続しているが、14日目ではないため）
- **28日目**: 再度提案バナーを表示（14日連続×2回目）
- **42日目**: 再度提案バナーを表示（14日連続×3回目）

### 具体例

| 日数 | Bronze連続 | 提案バナー表示 | 理由 |
|-----|-----------|-------------|------|
| 13日目 | 13日連続 | ❌ 非表示 | まだ14日連続達成していない |
| **14日目** | **14日連続** | **✅ 表示** | **ちょうど14日連続達成** |
| 15日目 | 15日連続 | ❌ 非表示 | 14日目ではない（14の倍数ではない） |
| 16日目 | 16日連続 | ❌ 非表示 | 14日目ではない |
| ... | ... | ❌ 非表示 | ... |
| 27日目 | 27日連続 | ❌ 非表示 | 14日目ではない |
| **28日目** | **28日連続** | **✅ 表示** | **ちょうど14日連続×2回目（28 ÷ 14 = 2）** |
| 29日目 | 29日連続 | ❌ 非表示 | 14日目ではない |

### 表示条件の数式

```
連続日数 % 14 === 0 かつ 連続日数 >= 14
```

つまり、連続日数が14の倍数（14, 28, 42, ...）の場合のみ提案バナーを表示。

---

## 現在の実装の問題点

### 問題のコード（lib/db.ts:414-487）

```typescript
export async function getSuggestion(
  userId: string = MOCK_USER_ID
): Promise<Suggestion | null> {
  const today = formatDate(new Date());
  const records = await getDailyRecords(userId);
  const recentRecords = records.slice(0, 14); // ← 最近14件のみ取得

  // Bronze以上を14日連続でチェック
  const allBronzeOrAbove = recentRecords.every((r) =>
    r.achievementLevel === 'bronze' ||
    r.achievementLevel === 'silver' ||
    r.achievementLevel === 'gold'
  );
  if (allBronzeOrAbove && recentRecords.length === 14) {
    // ← 問題: 14件あればOKと判定（15日目以降も常にtrue）
    const alreadyDisplayed = await hasSuggestionBeenDisplayedToday('level_up', today, 'bronze', userId);
    if (!alreadyDisplayed) {
      return {
        type: 'level_up',
        message: 'Bronzeレベルを14日連続達成しました！目標をレベルアップしませんか？',
        targetLevel: 'bronze',
        canEditAllGoals: false,
      };
    }
  }

  // ... Silver, Gold も同様の問題
}
```

### 問題点の詳細

1. **最近14件の記録を取得**: `recentRecords.slice(0, 14)`
   - 15日連続でも、最近14件は全てBronze以上を達成している
   - 16日連続でも、最近14件は全てBronze以上を達成している
   - つまり、14日目以降は常に条件を満たしてしまう

2. **連続日数のカウントをしていない**
   - 実際の連続日数が何日なのかを計算していない
   - 「ちょうど14日目」か「15日目以降」かを判定できない

3. **当日限り表示ロジックの併用**
   - `hasSuggestionBeenDisplayedToday()` で同日の再表示は防いでいる
   - しかし、翌日になると再びバナーが表示されてしまう（15日目、16日目...）

---

## 修正方針

### アプローチ1: 連続日数を正確にカウントして14の倍数かチェック

最もシンプルで正確な方法です。

#### 実装ステップ

1. **連続日数のカウント関数を作成**
   - 各レベル（Bronze以上、Silver以上、Gold）の連続達成日数を計算
   - 最新の記録から過去に遡り、連続達成が途切れるまでカウント

2. **`getSuggestion()` を修正**
   - 連続日数を取得
   - `連続日数 % 14 === 0 かつ 連続日数 >= 14` の場合のみ提案を返す
   - 当日限り表示ロジック（`hasSuggestionBeenDisplayedToday`）は維持

#### 実装コード案

```typescript
/**
 * 指定したレベル以上の連続達成日数をカウント
 *
 * @param records - 新しい順に並んだ日報記録（getDailyRecords の結果）
 * @param minLevel - 最低達成レベル ('bronze' | 'silver' | 'gold')
 * @returns 連続達成日数
 */
function countConsecutiveDays(
  records: DailyRecord[],
  minLevel: 'bronze' | 'silver' | 'gold'
): number {
  let count = 0;

  for (const record of records) {
    // レベルの判定
    const meetsLevel =
      minLevel === 'bronze'
        ? ['bronze', 'silver', 'gold'].includes(record.achievementLevel)
        : minLevel === 'silver'
        ? ['silver', 'gold'].includes(record.achievementLevel)
        : record.achievementLevel === 'gold';

    if (meetsLevel) {
      count++;
    } else {
      // 連続が途切れた
      break;
    }
  }

  return count;
}

export async function getSuggestion(
  userId: string = MOCK_USER_ID
): Promise<Suggestion | null> {
  const today = formatDate(new Date());
  const records = await getDailyRecords(userId);

  // Gold連続日数をチェック
  const goldStreak = countConsecutiveDays(records, 'gold');
  if (goldStreak >= 14 && goldStreak % 14 === 0) {
    const alreadyDisplayed = await hasSuggestionBeenDisplayedToday('level_up', today, 'gold', userId);
    if (!alreadyDisplayed) {
      return {
        type: 'level_up',
        message: 'Goldレベルを14日連続達成しました！目標をレベルアップしませんか？',
        targetLevel: 'gold',
        canEditAllGoals: false,
      };
    }
  }

  // Silver連続日数をチェック
  const silverStreak = countConsecutiveDays(records, 'silver');
  if (silverStreak >= 14 && silverStreak % 14 === 0) {
    const alreadyDisplayed = await hasSuggestionBeenDisplayedToday('level_up', today, 'silver', userId);
    if (!alreadyDisplayed) {
      return {
        type: 'level_up',
        message: 'Silverレベルを14日連続達成しました！目標をレベルアップしませんか？',
        targetLevel: 'silver',
        canEditAllGoals: false,
      };
    }
  }

  // Bronze連続日数をチェック
  const bronzeStreak = countConsecutiveDays(records, 'bronze');
  if (bronzeStreak >= 14 && bronzeStreak % 14 === 0) {
    const alreadyDisplayed = await hasSuggestionBeenDisplayedToday('level_up', today, 'bronze', userId);
    if (!alreadyDisplayed) {
      return {
        type: 'level_up',
        message: 'Bronzeレベルを14日連続達成しました！目標をレベルアップしませんか？',
        targetLevel: 'bronze',
        canEditAllGoals: false,
      };
    }
  }

  // レベルダウン提案（既存ロジックのまま）
  const lastWeek = records.slice(0, 7);
  const failedDays = lastWeek.filter((r) => r.achievementLevel === 'none').length;
  if (failedDays >= 4) {
    const alreadyDisplayed = await hasSuggestionBeenDisplayedToday('level_down', today, undefined, userId);
    if (!alreadyDisplayed) {
      return {
        type: 'level_down',
        message: '目標をレベルダウンしませんか？無理のないペースで続けることが大切です。',
        canEditAllGoals: true,
      };
    }
  }

  return null;
}
```

---

## 変更が必要なファイル

### 修正するファイル

1. **[lib/db.ts](lib/db.ts)** — `getSuggestion()` 関数と新しい `countConsecutiveDays()` 関数

### 修正不要なファイル

- [components/SuggestionBanner.tsx](components/SuggestionBanner.tsx) — 変更なし
- [app/page.tsx](app/page.tsx) — 変更なし
- [app/api/suggestions/display/route.ts](app/api/suggestions/display/route.ts) — 変更なし
- データベーススキーマ — 変更なし
- 型定義 — 変更なし

---

## 実装手順

### ステップ1: requirements.mdの更新

まず、要件を明確化します。

**変更内容:**
- [docs/requirements.md](docs/requirements.md) の「提案バナー」セクションに、以下を追記：
  - 「14日連続達成」は「ちょうど14日目、28日目、42日目...（14の倍数日）」を意味する
  - 15日目、16日目など、14の倍数でない日は提案バナーを表示しない

### ステップ2: `countConsecutiveDays()` 関数の実装

[lib/db.ts](lib/db.ts) に新しいヘルパー関数を追加します。

**配置場所:**
- `getSuggestion()` 関数の直前（行410付近）

**テスト方法:**
- 手動確認（開発サーバーで実際の連続日数を確認）

### ステップ3: `getSuggestion()` 関数の修正

[lib/db.ts:414-487](lib/db.ts#L414-L487) を上記の実装コード案に置き換えます。

**変更点:**
- ❌ 削除: `const recentRecords = records.slice(0, 14);`
- ❌ 削除: `recentRecords.every(...)` の判定ロジック
- ✅ 追加: `countConsecutiveDays()` の呼び出し
- ✅ 追加: `連続日数 % 14 === 0` の判定

### ステップ4: 動作確認

開発サーバーで以下をテストします：

#### テストケース1: 14日連続達成
- **条件**: Bronze以上を14日連続達成
- **期待結果**: 14日目に提案バナーが表示される
- **確認方法**: ホーム画面で提案バナーが表示されることを確認

#### テストケース2: 15日連続達成
- **条件**: Bronze以上を15日連続達成（既存のデータ状態）
- **期待結果**: 15日目は提案バナーが**非表示**
- **確認方法**: ホーム画面で提案バナーが表示されないことを確認

#### テストケース3: 28日連続達成
- **条件**: Bronze以上を28日連続達成
- **期待結果**: 28日目に再度提案バナーが表示される
- **確認方法**: データを追加して確認（手動または日付操作）

#### テストケース4: 当日限り表示ロジック
- **条件**: 14日目に提案バナーを×ボタンで閉じる
- **期待結果**: 同日中はページをリロードしても再表示されない
- **確認方法**: 既存の `hasSuggestionBeenDisplayedToday()` が正常動作していることを確認

#### テストケース5: レベルダウン提案
- **条件**: 7日中4日以上未達成
- **期待結果**: レベルダウン提案バナーが表示される（既存動作のまま）
- **確認方法**: データを調整して確認

---

## リスクと対策

### リスク1: 連続日数のカウントロジックにバグがある

**想定される問題:**
- 日付の並び順が正しくない場合、連続日数が誤ってカウントされる
- 記録のない日があった場合の処理

**対策:**
- `getDailyRecords()` は新しい順（降順）でソートされていることを確認
- 記録のない日は `achievementLevel: 'none'` として処理されることを確認
- テストケースで複数パターンを確認

### リスク2: 既存のレベルダウン提案に影響する

**想定される問題:**
- レベルダウン提案のロジックを誤って変更してしまう

**対策:**
- レベルダウン提案のコードは変更しない（既存ロジックを維持）
- テストケース5で動作確認

### リスク3: 当日限り表示ロジックとの競合

**想定される問題:**
- `hasSuggestionBeenDisplayedToday()` との併用で意図しない動作になる

**対策:**
- 既存の当日限り表示ロジックは維持（変更なし）
- 両方のロジックを組み合わせた動作をテストケースで確認

---

## 想定される影響範囲

### コード

- **修正**: [lib/db.ts](lib/db.ts) のみ
- **影響なし**: コンポーネント、APIエンドポイント、型定義、データベース

### データベース

- **影響なし**: スキーマ変更なし、マイグレーション不要

### パフォーマンス

- **影響最小**: `getDailyRecords()` の結果を全件走査するが、通常数百件程度のため影響なし
- 既存の `slice(0, 14)` と比較して、最悪ケースでも全記録（数百件）を走査するだけ

### ユーザー体験

- **改善**: 15日目以降に不要な提案バナーが表示されなくなる
- **改善**: 28日目、42日目にも再度提案が表示されるようになる

---

## 完了条件

以下の全てが満たされたら、実装完了とします：

1. ✅ requirements.mdが更新されている（「14日連続 = 14の倍数日」と明記）
2. ✅ `countConsecutiveDays()` 関数が実装されている
3. ✅ `getSuggestion()` 関数が修正されている
4. ✅ TypeScriptのビルドが成功する（エラーなし）
5. ✅ テストケース1〜5が全て成功する
6. ✅ 15日連続達成の状態で提案バナーが**非表示**になる（ユーザーの要望）

---

## まとめ

### 問題の原因

- 現在の `getSuggestion()` は「最近14件の記録」しか見ていない
- 連続日数が何日なのかを計算していないため、15日目以降も常に条件を満たしてしまう

### 解決策

- 連続日数を正確にカウントする `countConsecutiveDays()` 関数を追加
- `連続日数 % 14 === 0 かつ 連続日数 >= 14` の条件で提案を表示
- 既存の当日限り表示ロジックは維持

### 変更ファイル

- [lib/db.ts](lib/db.ts) のみ修正
- データベース、コンポーネント、APIエンドポイントは変更なし

この修正により、ユーザーの要望通り「15日以上連続達成している場合は提案バナーを非表示にする」ことができます。
