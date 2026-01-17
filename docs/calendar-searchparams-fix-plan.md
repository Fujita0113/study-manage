# カレンダーページ searchParams エラー修正計画

## エラー概要

`/calendar` ページで以下のエラーが発生しています：

```
Error: Route "/calendar" used `searchParams.year`. `searchParams` is a Promise and must be unwrapped with `await` or `React.use()` before accessing its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
    at CalendarPage (app\calendar\page.tsx:19:23)
  17 |   // URLパラメータから年月を取得（デフォルトは 今月）
  18 |   const now = new Date();
> 19 |   const currentYear = searchParams?.year ? parseInt(searchParams.year) : now.getFullYear();
     |                       ^
  20 |   const currentMonth = searchParams?.month ? parseInt(searchParams.month) : now.getMonth() + 1;
```

## 問題の原因

### Next.js 15 以降の変更点

Next.js 15（および一部の Next.js 16 バージョン）では、Server Component の `searchParams` プロップが **Promise** になりました。これにより、`searchParams` に直接アクセスする前に `await` でアンラップする必要があります。

### 現在の実装の問題

**`app/calendar/page.tsx`** (19-20行目):
```typescript
const currentYear = searchParams?.year ? parseInt(searchParams.year) : now.getFullYear();
const currentMonth = searchParams?.month ? parseInt(searchParams.month) : now.getMonth() + 1;
```

このコードは `searchParams` を Promise として扱っていないため、エラーが発生しています。

### 正しい実装例

**`app/goals/page.tsx`** では正しく実装されています：
```typescript
interface GoalsPageProps {
  searchParams?: Promise<{ edit?: string }>;
}

async function GoalsPageContent({ searchParams }: GoalsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const editParam = resolvedSearchParams.edit || null;
  // ...
}
```

## 修正計画

### フェーズ1: 型定義の修正

#### 1-1. `CalendarPageProps` インターフェースの更新

**目的**: `searchParams` を Promise 型として定義

**変更内容**:
```typescript
interface CalendarPageProps {
  searchParams?: Promise<{ year?: string; month?: string }>;
}
```

**変更箇所**: `app/calendar/page.tsx` 9-11行目

### フェーズ2: searchParams のアンラップ

#### 2-1. `searchParams` の await 処理

**目的**: Promise をアンラップしてからプロパティにアクセス

**変更内容**:
```typescript
export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  // 認証チェックとユーザー情報の取得
  const user = await requireAuth();

  // URLパラメータから年月を取得（デフォルトは今月）
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const now = new Date();
  const currentYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : now.getFullYear();
  const currentMonth = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : now.getMonth() + 1;
  
  // ... 以下既存のコード
}
```

**変更箇所**: `app/calendar/page.tsx` 13-20行目

## 実装手順

### ステップ1: 型定義の更新

1. `CalendarPageProps` インターフェースの `searchParams` を `Promise<{ year?: string; month?: string }>` に変更

### ステップ2: searchParams のアンラップ

1. `searchParams` を `await` でアンラップ
2. アンラップした結果を `resolvedSearchParams` に格納
3. `resolvedSearchParams` から `year` と `month` を取得

### ステップ3: 動作確認

1. `/calendar` にアクセスしてエラーが解消されているか確認
2. `/calendar?year=2025&month=12` にアクセスしてパラメータが正しく取得できるか確認
3. パラメータなしでアクセスした場合にデフォルト値（今月）が使用されるか確認

## 修正後のコード

```typescript
interface CalendarPageProps {
  searchParams?: Promise<{ year?: string; month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  // 認証チェックとユーザー情報の取得
  const user = await requireAuth();

  // URLパラメータから年月を取得（デフォルトは今月）
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const now = new Date();
  const currentYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : now.getFullYear();
  const currentMonth = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : now.getMonth() + 1;

  // ... 以下既存のコード
}
```

## テスト計画

### 1. 基本動作確認

- [ ] `/calendar` にアクセスしてエラーが発生しないことを確認
- [ ] パラメータなしでアクセスした場合、今月のカレンダーが表示されることを確認

### 2. パラメータ付きアクセスの確認

- [ ] `/calendar?year=2025&month=12` にアクセスして、2025年12月のカレンダーが表示されることを確認
- [ ] `/calendar?year=2024&month=1` にアクセスして、2024年1月のカレンダーが表示されることを確認

### 3. 前月・次月リンクの確認

- [ ] 前月リンクをクリックして正しい年月に遷移することを確認
- [ ] 次月リンクをクリックして正しい年月に遷移することを確認
- [ ] 年をまたぐ遷移（12月→1月、1月→12月）が正しく動作することを確認

### 4. エッジケース

- [ ] 無効な年月パラメータ（例: `month=13`）が渡された場合の動作を確認
- [ ] 負の値や文字列が渡された場合の動作を確認

## 影響範囲

### 変更が必要なファイル

- ✅ `app/calendar/page.tsx` - メインの修正対象

### 影響を受けないファイル

- `app/goals/page.tsx` - 既に正しく実装済み
- `app/day/[date]/page.tsx` - `params` を使用（別の対応が必要な場合あり）
- その他のページコンポーネント

## 注意事項

1. **Next.js バージョン**: この修正は Next.js 15 以降の変更に対応するものです。現在のプロジェクトは Next.js 16.1.1 を使用しているため、この修正が必要です。

2. **後方互換性**: この修正は既存の機能に影響を与えません。単に Promise をアンラップするだけです。

3. **パフォーマンス**: `await searchParams` は非同期処理ですが、既に Server Component 内で実行されているため、追加のオーバーヘッドは最小限です。

4. **型安全性**: TypeScript の型定義を更新することで、コンパイル時にエラーを検出できるようになります。

## 参考資料

- [Next.js Documentation - Dynamic APIs](https://nextjs.org/docs/messages/sync-dynamic-apis)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- 既存の実装例: `app/goals/page.tsx`
