# Bronze未達成でも自由記述のみで記録可能にする実装計画

## 概要

日報記録画面でBronzeのtodoを達成していなくても、自由記述のみで日報を記録できるようにする。

## 背景

- 失敗した日の振り返りを次の日に行えるようにしたい
- 振り返りを記録すること自体に価値があるため、ストリークに含める

## 使用モジュールとバージョン

| モジュール | バージョン | 用途 |
|-----------|-----------|------|
| React | 19.2.3 | UIコンポーネント |
| Next.js | 16.1.1 | フレームワーク |
| @supabase/supabase-js | 2.90.1 | データベースアクセス |

※依存関係に関する特別な注意点はなし。既存のコードパターンに従って実装する。

## 変更が必要なファイル

### 1. `app/record/RecordPageClient.tsx`
日報記録画面のクライアントコンポーネント

### 2. `lib/db.ts`
ストリーク計算ロジック

## 各ファイルでの具体的な変更内容

### 1. `app/record/RecordPageClient.tsx`

#### 変更箇所1: 記録ボタンの有効条件を変更

**現在の実装（359行目付近）：**
```tsx
disabled={achievementLevel === 'none' || saving}
```

**変更後：**
```tsx
// 記録可能条件: Bronze達成 OR 自由記述が入力されている
const canRecord = achievementLevel !== 'none' || journal.trim().length > 0;

disabled={!canRecord || saving}
```

#### 変更箇所2: 保存時のバリデーションを変更

**現在の実装（186-189行目）：**
```tsx
if (achievementLevel === 'none') {
  alert('少なくともBronze目標を全て達成してから記録してください');
  return;
}
```

**変更後：**
```tsx
// Bronze未達成の場合、自由記述が必須
if (achievementLevel === 'none' && journal.trim().length === 0) {
  alert('Bronze目標が未達成の場合、自由記述を入力してください');
  return;
}
```

#### 変更箇所3: 警告メッセージの変更

**現在の実装（370-374行目）：**
```tsx
{achievementLevel === 'none' && (
  <p className="text-sm text-center text-amber-600">
    ※ Bronze目標を全て達成すると記録できるようになります
  </p>
)}
```

**変更後：**
```tsx
{achievementLevel === 'none' && journal.trim().length === 0 && (
  <p className="text-sm text-center text-amber-600">
    ※ Bronze目標を達成するか、自由記述を入力すると記録できます
  </p>
)}
```

### 2. `lib/db.ts`

#### 変更箇所: ストリーク計算ロジックの変更

**現在の実装（579-585行目）：**
```typescript
// Bronze以上なら連続
if (['bronze', 'silver', 'gold'].includes(record.achievementLevel)) {
  streak++;
} else {
  // noneが出たら連続終了
  break;
}
```

**変更後：**
```typescript
// 日報があればストリークとしてカウント（達成レベルは問わない）
streak++;
```

## 実装手順

1. `app/record/RecordPageClient.tsx`の変更
   - 記録可能条件の追加（`canRecord`変数）
   - 保存時バリデーションの変更
   - ボタンのdisabled条件の変更
   - 警告メッセージの変更

2. `lib/db.ts`の変更
   - `calculateStreakFromRecords`関数のストリーク計算ロジックを変更

3. 動作確認
   - Bronze未達成・自由記述なし → 記録ボタン非活性
   - Bronze未達成・自由記述あり → 記録ボタン活性、記録可能
   - Bronze達成・自由記述なし → 記録ボタン活性、記録可能（従来通り）
   - ストリークが日報の有無でカウントされることを確認

## 想定される影響範囲

- **日報記録画面**: ボタンの有効条件が変わる
- **ストリーク表示**: 計算ロジックが変わる（Bronze未達成でもカウント）
- **提案バナー**: 変更なし（連続達成日数のカウントは既存ロジックのまま）

## テスト方針

1. **記録画面のテスト**
   - Bronze TODO全て未チェック + 自由記述なし → 記録ボタン非活性
   - Bronze TODO全て未チェック + 自由記述あり → 記録ボタン活性、記録成功
   - Bronze TODO全てチェック + 自由記述なし → 記録ボタン活性、記録成功

2. **ストリークのテスト**
   - 自由記述のみの日報を作成後、ストリークがカウントされることを確認
