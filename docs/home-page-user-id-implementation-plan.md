# ホーム画面のユーザーID実装計画

## 概要

ホーム画面（`app/page.tsx`）で日報を表示する際に、現在モックユーザーID（`MOCK_USER_ID`）を使用している箇所を、実際にログインしているユーザーのIDを取得して使用するように変更する。

## 現状の課題

### 現在の実装

`app/page.tsx`では以下の2箇所で`MOCK_USER_ID`を使用している：

1. **43行目**: `getDailyRecords(MOCK_USER_ID, { startDate, endDate })` - 過去14日分の日報記録を取得
2. **71行目**: `calculateStreakFromRecords(MOCK_USER_ID)` - ストリーク日数を計算

```typescript
// 現在のコード
import { MOCK_USER_ID } from '@/lib/mockData';

export default async function HomePage() {
  const records = await getDailyRecords(MOCK_USER_ID, { startDate, endDate });
  const streakDays = await calculateStreakFromRecords(MOCK_USER_ID);
  // ...
}
```

### 問題点

- すべてのユーザーが同じモックユーザーのデータを見てしまう
- 実際のログインユーザーのデータが表示されない
- マルチユーザー環境で正しく動作しない

## 実装方針

### 1. 認証ヘルパー関数の使用

`lib/auth/server.ts`に既に以下の関数が実装されている：

- `getUser()`: 現在ログイン中のユーザー情報を取得（未認証の場合は`null`）
- `requireAuth()`: 認証を必須とし、未認証の場合はログイン画面へリダイレクト

### 2. 実装アプローチ

ホーム画面は認証必須ページとして扱うため、`requireAuth()`を使用する。

**理由**:
- ホーム画面は個人の日報を表示するページ
- 未認証ユーザーがアクセスする必要がない
- 既存のミドルウェア（`proxy.ts`）でも認証チェックが行われている

### 3. 変更箇所

#### `app/page.tsx`

1. `MOCK_USER_ID`のインポートを削除
2. `requireAuth`を`@/lib/auth/server`からインポート
3. コンポーネントの最初で`requireAuth()`を呼び出してユーザー情報を取得
4. `MOCK_USER_ID`を`user.id`に置き換え

## 実装手順

### ステップ1: インポートの変更

```typescript
// 削除
import { MOCK_USER_ID } from '@/lib/mockData';

// 追加
import { requireAuth } from '@/lib/auth/server';
```

### ステップ2: ユーザーIDの取得

```typescript
export default async function HomePage() {
  // 認証チェックとユーザー情報の取得
  const user = await requireAuth();
  
  // 以降、user.idを使用
  const records = await getDailyRecords(user.id, { startDate, endDate });
  const streakDays = await calculateStreakFromRecords(user.id);
  // ...
}
```

### ステップ3: エラーハンドリング

`requireAuth()`は内部で未認証の場合に`redirect('/login')`を実行するため、追加のエラーハンドリングは不要。

ただし、念のため以下の点を確認：
- `user.id`が`string`型であること（Supabaseの`User`型では`id`は`string`）
- `user.id`が有効なUUID形式であること（Supabaseの仕様）

## 影響範囲

### 変更が必要なファイル

- `app/page.tsx` - メインの変更ファイル

### 影響を受ける可能性のあるファイル

- なし（他のファイルへの影響はない）

### テストが必要な項目

1. **認証済みユーザーでのアクセス**
   - ホーム画面にアクセスできること
   - 自分の日報が正しく表示されること
   - ストリーク日数が正しく表示されること

2. **未認証ユーザーでのアクセス**
   - ホーム画面にアクセスしようとするとログイン画面にリダイレクトされること

3. **複数ユーザーでの動作確認**
   - ユーザーAでログインした場合、ユーザーAの日報が表示されること
   - ユーザーBでログインした場合、ユーザーBの日報が表示されること
   - ユーザー間でデータが混在しないこと

## 実装後の確認事項

### 1. 動作確認

- [ ] 認証済みユーザーでホーム画面にアクセスできる
- [ ] 自分の日報が正しく表示される
- [ ] ストリーク日数が正しく表示される
- [ ] 未認証ユーザーはログイン画面にリダイレクトされる

### 2. コードレビュー

- [ ] `MOCK_USER_ID`のインポートが削除されている
- [ ] `requireAuth()`が正しく使用されている
- [ ] `user.id`が正しく使用されている
- [ ] 不要なコードが残っていない

### 3. パフォーマンス

- [ ] 認証チェックによる追加のオーバーヘッドが許容範囲内であること
- [ ] データ取得が正常に動作すること

## 参考資料

### 関連ファイル

- `app/page.tsx` - ホーム画面の実装
- `lib/auth/server.ts` - 認証ヘルパー関数
- `lib/db.ts` - データベースアクセス関数
- `app/api/goals/initial/route.ts` - `getUser()`の使用例

### 既存の実装パターン

`app/api/goals/initial/route.ts`では以下のように`getUser()`を使用している：

```typescript
import { getUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  // user.idを使用
}
```

ホーム画面では`requireAuth()`を使用することで、未認証の場合は自動的にリダイレクトされるため、より簡潔に実装できる。

## 次のステップ

この実装が完了したら、以下のページでも同様の修正を検討する：

1. `app/record/page.tsx` - 記録・日報画面
2. `app/day/[date]/page.tsx` - 日詳細画面
3. `app/calendar/page.tsx` - カレンダー画面
4. `app/history/page.tsx` - 履歴画面
5. その他のユーザー固有データを表示する画面

## 注意事項

1. **SupabaseのユーザーID形式**
   - Supabaseの`user.id`はUUID形式（例: `550e8400-e29b-41d4-a716-446655440000`）
   - `MOCK_USER_ID`は`'00000000-0000-0000-0000-000000000001'`という固定値
   - データベースの`user_id`カラムがUUID型であることを確認

2. **データ移行**
   - 既存のモックデータが特定のユーザーIDに紐づいている場合、実際のユーザーIDに移行する必要がある可能性がある
   - ただし、本実装では既存データの移行は行わない（新規実装のみ）

3. **開発環境でのテスト**
   - 開発環境で複数のユーザーアカウントを作成してテストする
   - 各ユーザーで異なる日報データが表示されることを確認
