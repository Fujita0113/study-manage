# ストリーク表示修正 実装計画

## 目的と概要

ヘッダーのストリーク表示を修正し、**当日の日報記録がまだない場合でも、昨日までの連続達成日数を表示する**ようにします。

## 変更理由

現在の実装では、当日の記録がない場合、ストリークが0日と表示されてしまいます。しかし、ユーザーの期待では、昨日まで14日連続達成していた場合、今日まだ記録していなくても「14日」と表示されるべきです。

## 使用モジュールとバージョン

- `date-fns`: ^4.1.0 - 日付操作ライブラリ
- `@supabase/supabase-js`: ^2.90.1 - Supabaseクライアント
- `next`: 16.1.1 - Next.jsフレームワーク

## 現在の問題点

### 現在の `calculateStreakFromRecords` の動作（lib/db.ts:321-351）

```typescript
export async function calculateStreakFromRecords(
  userId: string = MOCK_USER_ID
): Promise<number> {
  const records = await getDailyRecords(userId);

  // Bronze以上の連続日数をカウント
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedDateStr = formatDate(expectedDate);

    // 日付が連続していない場合は終了
    if (record.date !== expectedDateStr) {
      break; // ← ここで当日の記録がない場合、即座にbreak（streak = 0）
    }

    // Bronze以上なら連続
    if (['bronze', 'silver', 'gold'].includes(record.achievementLevel)) {
      streak++;
    } else {
      // noneが出たら連続終了
      break;
    }
  }

  return streak;
}
```

**問題**:
- ループの最初（i=0）で今日の記録をチェックする
- 今日の記録がない場合、`record.date !== expectedDateStr` で即座にbreakし、streak = 0が返される

## 修正方針

### 新しい動作仕様

1. **今日の記録がある場合**: 今日を含めて連続達成日数をカウント
2. **今日の記録がない場合**: 昨日から遡って連続達成日数をカウント（今日を除外）

### 具体例

**ケース1**: 昨日まで14日連続達成、今日はまだ記録なし
- 現在の実装: 0日と表示
- 修正後: 14日と表示（昨日までの連続日数）

**ケース2**: 今日も記録済み、15日連続達成中
- 現在の実装: 15日と表示
- 修正後: 15日と表示（変更なし）

**ケース3**: 昨日記録なし、今日記録あり
- 現在の実装: 1日と表示
- 修正後: 1日と表示（変更なし）

## 実装手順

### ステップ1: `calculateStreakFromRecords` 関数を修正

**ファイル**: [lib/db.ts](../lib/db.ts)

**修正内容**:

1. 今日の記録があるかどうかを最初にチェック
2. 今日の記録がない場合は、昨日（i=1）からカウントを開始
3. 今日の記録がある場合は、今日（i=0）からカウントを開始

**修正後のロジック**:

```typescript
export async function calculateStreakFromRecords(
  userId: string = MOCK_USER_ID
): Promise<number> {
  const records = await getDailyRecords(userId);

  if (records.length === 0) {
    return 0;
  }

  let streak = 0;
  const today = new Date();
  const todayStr = formatDate(today);

  // 今日の記録があるかチェック
  const hasTodayRecord = records[0]?.date === todayStr;

  // 今日の記録がない場合は、昨日（i=1）から開始
  // 今日の記録がある場合は、今日（i=0）から開始
  const startIndex = hasTodayRecord ? 0 : 1;

  for (let i = startIndex; i < records.length + startIndex; i++) {
    const recordIndex = i - startIndex;
    if (recordIndex >= records.length) break;

    const record = records[recordIndex];
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedDateStr = formatDate(expectedDate);

    // 日付が連続していない場合は終了
    if (record.date !== expectedDateStr) {
      break;
    }

    // Bronze以上なら連続
    if (['bronze', 'silver', 'gold'].includes(record.achievementLevel)) {
      streak++;
    } else {
      // noneが出たら連続終了
      break;
    }
  }

  return streak;
}
```

### ステップ2: 動作確認

以下のシナリオで動作確認を行います:

1. **今日の記録なし、昨日まで連続達成**: 昨日までの連続日数が表示されること
2. **今日の記録あり、連続達成中**: 今日を含めた連続日数が表示されること
3. **記録が1件もない**: 0日と表示されること
4. **昨日記録なし**: 今日の記録があっても1日と表示されること

## 影響範囲

### 変更が必要なファイル

1. **[lib/db.ts](../lib/db.ts)**: `calculateStreakFromRecords` 関数の修正

### 影響を受けるファイル（変更不要）

以下のファイルは `calculateStreakFromRecords` を呼び出していますが、関数のシグネチャは変わらないため、変更不要です:

- [app/page.tsx](../app/page.tsx): ホーム画面
- [app/goals/page.tsx](../app/goals/page.tsx): 目標編集画面
- [app/settings/page.tsx](../app/settings/page.tsx): 設定画面
- [app/record/page.tsx](../app/record/page.tsx): 記録画面
- [app/history/page.tsx](../app/history/page.tsx): 目標変遷画面
- [app/day/[date]/page.tsx](../app/day/[date]/page.tsx): 日詳細画面
- [app/calendar/page.tsx](../app/calendar/page.tsx): カレンダー画面

### 依存関係の注意点

- `getDailyRecords` は新しい順（降順）で記録を返すため、`records[0]` が最新の記録です
- `formatDate` 関数（lib/utils.ts）は既存のものをそのまま使用します

## テスト方針

### 手動テスト

1. **初期状態の確認**:
   - ブラウザでアプリを開き、現在のストリーク表示を確認

2. **当日記録なしのケース**:
   - 昨日までの記録がある状態で、今日の記録を削除（またはまだ記録していない状態）
   - ヘッダーに昨日までの連続日数が表示されることを確認

3. **当日記録ありのケース**:
   - 今日の記録を追加
   - ヘッダーに今日を含めた連続日数が表示されることを確認

4. **記録が途切れたケース**:
   - 昨日の記録がない（またはnone）状態で、今日の記録がある場合
   - ヘッダーに「1日」と表示されることを確認

### ビルド確認

```bash
npm run build
```

エラーが発生しないことを確認します。

## 想定される課題と対処法

### 課題1: タイムゾーンの問題

**問題**: サーバーとクライアントのタイムゾーンが異なる場合、「今日」の判定がずれる可能性

**対処**: 現在の実装では `formatDate` 関数がローカルタイムゾーンで日付を生成しているため、問題は発生しにくい。ただし、将来的にタイムゾーン対応が必要になる可能性がある。

### 課題2: データベースの日付フォーマット

**問題**: Supabaseのdateカラムは「YYYY-MM-DD」形式で保存されているが、`formatDate` の出力形式と一致する必要がある

**対処**: 現在の実装では `formatDate` 関数が「YYYY-MM-DD」形式を返しているため、問題なし。

## 完了条件

- [ ] `calculateStreakFromRecords` 関数が修正され、当日の記録がない場合に昨日までの連続日数を返すようになる
- [ ] ビルドが成功する（`npm run build` でエラーなし）
- [ ] ヘッダーのストリーク表示が、当日の記録がない場合でも昨日までの連続日数を表示する
- [ ] 既存の機能（記録画面、ホーム画面など）が正常に動作する

## 参照ドキュメント

- [requirements.md](./requirements.md): ストリーク表示の仕様（11行目）
- [data-model.md](./data-model.md): DailyRecordテーブルの定義
