# バグ修正計画：日付タイムゾーン不整合

## 作成日
2026-02-22

## バグの概要

**症状:**
- 2/22 朝8:50 JST の時点で、カレンダー・日報記録・ストリークが「2/21」と表示される
- 同じ時刻に作成した 2/21 分の日報を編集画面で開くと「編集期限が過ぎています」と表示される
- この2つは矛盾している（「今日は2/21」なのに「2/21の編集期限切れ」）

---

## 根本原因

### `formatDate()` が UTC 日付を返している

[lib/utils.ts:18](../lib/utils.ts#L18) の `formatDate()` 関数：

```typescript
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // ← UTC時刻を返す
}
```

`toISOString()` は **常にUTC時刻** を返す。
JST（UTC+9）では、深夜0:00〜翌朝9:00の間、UTCは前日になるため、
この時間帯に `formatDate(new Date())` を呼び出すと **前日の日付** が返る。

**例: 2/22 08:50 JST の場合**
- UTC = 2/21 23:50
- `new Date().toISOString()` → `'2026-02-21T23:50:00.000Z'`
- `formatDate(new Date())` → **`'2026-02-21'`** ← 間違い（JSTでは2/22のはず）

### 編集期限チェックは正しくローカル時刻（JST）で比較

[app/record/RecordPageClient.tsx:108-116](../app/record/RecordPageClient.tsx#L108-L116) の編集期限チェック：

```typescript
const recordDate = new Date(existingData.record.date + 'T00:00:00'); // ローカル時刻
const now = new Date(); // ローカル時刻
const isSameDay = recordDate.toDateString() === now.toDateString(); // ローカル日付で比較
```

`toDateString()` は **ローカル時刻（JST）** を使用するため、
8:50 AM JST の 2/22 では `now.toDateString()` = `"Sun Feb 22 2026"` → 正しく2/22と判断する。

### 結果として生じる矛盾

| 機能 | 使用する時刻 | 8:50 AM JST / 2/22 での結果 |
|------|------------|---------------------------|
| 今日の日付（ホーム・カレンダー・ストリーク） | UTC (`toISOString()`) | **2/21**（誤り） |
| 編集期限チェック | ローカル時刻 JST (`toDateString()`) | 2/22（正しい）→ 2/21は期限切れ |

---

## 修正方針

`formatDate()` を JST タイムゾーンを明示的に使用するよう修正する。
標準JavaScriptの `Intl.DateTimeFormat` API を使用し、`timeZone: 'Asia/Tokyo'` を指定する。
これにより、サーバー側（Vercel/Node.js、タイムゾーン不明）でも
クライアント側（ブラウザ）でも、一貫してJSTの日付を返す。

**新しい `formatDate()` の実装:**
```typescript
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(date);
}
```

`sv-SE`（スウェーデン語）ロケールは `YYYY-MM-DD` 形式で日付を返すため、
現在の呼び出し元を変更せずに使用できる。

---

## 影響範囲の確認

### `formatDate()` を使っている箇所（修正後に自動的に正しくなる）

| ファイル | 行 | 用途 |
|----------|-----|------|
| [lib/db.ts:581](../lib/db.ts#L581) | `calculateStreakFromRecords()` 内の `todayStr` | ストリーク計算の基準日 |
| [lib/db.ts:1359](../lib/db.ts#L1359) | `getRecoveryModeStatus()` 内の `today` | リカバリーモードの日付比較 |
| [lib/db.ts:1398](../lib/db.ts#L1398) | `activateRecoveryMode()` 内の `today` | リカバリーモード起動日の記録 |
| [lib/utils.ts:125](../lib/utils.ts#L125) | `getTodayDate()` | 今日の日付取得ユーティリティ |
| [app/record/RecordPageClient.tsx:30](../app/record/RecordPageClient.tsx#L30) | `today` | 対象日の判定（クライアント側） |
| [app/page.tsx:66](../app/page.tsx#L66) | `today` | ホーム画面の今日判定 |
| [app/page.tsx:70](../app/page.tsx#L70) | 13日前の日付 | 表示期間の計算 |
| [app/calendar/page.tsx:90](../app/calendar/page.tsx#L90) | `isToday` | カレンダーの「今日」ハイライト |
| [app/api/recovery-mode/route.ts:71](../app/api/recovery-mode/route.ts#L71) | `today` | リカバリーモードAPI |

### `toISOString().split('T')[0]` を直接使っている箇所（個別修正が必要）

これらは `formatDate()` を経由していないため、別途修正が必要。

| ファイル | 行 | 関数 | 修正内容 |
|----------|-----|------|----------|
| [lib/db.ts:295](../lib/db.ts#L295) | `createInitialGoals()` | `today` の計算 | `formatDate(new Date())` に変更 |
| [lib/db.ts:766](../lib/db.ts#L766) | `createGoalHistorySlot()` | `today` の計算 | `formatDate(new Date())` に変更 |
| [lib/db.ts:842](../lib/db.ts#L842) | `endGoalHistorySlot()` | `yesterday` の日付 | `formatDate(yesterday)` に変更 |
| [lib/actions.ts:190](../lib/actions.ts#L190) | `endGoalHistorySlot()` | `yesterday` の日付 | `formatDate` をimportして使用 |
| [lib/actions.ts:240](../lib/actions.ts#L240) | `createGoalHistorySlotAction()` | `today` の計算 | `formatDate` をimportして使用 |

### アニメーション関連（今回の報告バグとは無関係・優先度低）

[lib/animation/generateFrames.ts:46,128](../lib/animation/generateFrames.ts#L46) でも
`toISOString().split('T')[0]` を使用している。
これらは歴史データの日付イテレーションに使用しており、
`new Date('YYYY-MM-DD')` 形式の文字列から生成された Dateオブジェクトの場合、
UTC midnight として扱われるため、`toISOString()` でも正しい日付を返すケースが多い。
ただし `endDate` のデフォルト値 `new Date()`（現在時刻）については UTC vs JST の問題が残る。
**今回の修正スコープ外とし、別チケットで対応する。**

---

## 修正対象ファイルと変更内容

### 1. `lib/utils.ts` （最重要）

**変更箇所:** `formatDate()` 関数（17〜19行目）

```typescript
// 変更前
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 変更後
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(date);
}
```

### 2. `lib/db.ts`

**変更箇所1:** `createInitialGoals()` の `today`（295行目付近）

```typescript
// 変更前
const today = new Date().toISOString().split('T')[0];

// 変更後
const today = formatDate(new Date());
```

**変更箇所2:** `createGoalHistorySlot()` の `today`（766行目付近）

```typescript
// 変更前
const today = new Date().toISOString().split('T')[0];

// 変更後
const today = formatDate(new Date());
```

**変更箇所3:** `endGoalHistorySlot()` の `endDate`（840〜842行目付近）

```typescript
// 変更前
const endDate = yesterday.toISOString().split('T')[0];

// 変更後
const endDate = formatDate(yesterday);
```

### 3. `lib/actions.ts`

**前提:** `formatDate` のimportを追加する

```typescript
// 追加するimport
import { formatDate } from '@/lib/utils';
```

**変更箇所1:** `endGoalHistorySlot()` の `endDate`（188〜190行目付近）

```typescript
// 変更前
const endDate = yesterday.toISOString().split('T')[0];

// 変更後
const endDate = formatDate(yesterday);
```

**変更箇所2:** `createGoalHistorySlotAction()` の `today`（240行目付近）

```typescript
// 変更前
const today = new Date().toISOString().split('T')[0];

// 変更後
const today = formatDate(new Date());
```

---

## requirements.md の更新

**更新不要。** 本修正はバグ修正（要件通りに動いていない箇所の修正）に該当する。

要件書には「記録日の当日中（23:59:59まで）」「昨日の日報が作成されていない場合」など
暗黙的に JST（日本標準時）での動作を前提とした記述があるが、
実装が誤ってUTCを使用していたことが原因。

---

## 使用するモジュールとバージョン

| モジュール | バージョン | 用途 |
|-----------|-----------|------|
| `Intl.DateTimeFormat` | 組み込みAPI（追加依存なし） | JST タイムゾーンを使った日付フォーマット |
| Next.js | 16.1.1 | フレームワーク（変更なし） |
| TypeScript | ^5 | 言語（変更なし） |

**依存関係の追加は不要。** 標準JavaScriptのAPIのみを使用する。

---

## 実装手順（ステップバイステップ）

1. `lib/utils.ts` の `formatDate()` を修正
2. `lib/db.ts` の3箇所を `formatDate()` に統一
3. `lib/actions.ts` に `formatDate` をimportし、2箇所を修正
4. ビルドを実行して型エラーがないか確認
5. 動作確認（JST の深夜0:00〜9:00の時間帯に "今日" が正しく表示されるか）

---

## 期待される修正後の動作

**修正後は全機能が JST で統一される:**

| 時刻 | 修正前の「今日」 | 修正後の「今日」 |
|------|----------------|----------------|
| 2/22 08:50 JST | 2/21（誤り） | 2/22（正しい） |
| 2/22 08:59 JST | 2/21（誤り） | 2/22（正しい） |
| 2/22 09:00 JST | 2/22（正しい） | 2/22（正しい）← 問題なし |

**矛盾の解消:**
- 2/22 08:50 JST の時点で「今日は2/22」と正しく表示
- 2/21 の日報は「編集期限が過ぎています」と表示（一貫して正しい）

---

## テスト方針

- ビルドが通ることを確認（`npm run build`）
- 以下のシナリオで動作確認を依頼：
  - 現在の JST での「今日の日付」がカレンダー・ホーム・ストリークで正しく表示されるか
  - 「当日」の日報が編集可能で、「昨日」の日報が編集不可か
