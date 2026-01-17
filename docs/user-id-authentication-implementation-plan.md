# ユーザーID認証実装計画

## 概要

現在、`DEFAULT_USER_ID = 'test-user-001'`という非UUID形式の文字列が使用されており、データベースのUUID型カラムと型不一致でエラーが発生しています。実際のSupabase Authから取得したユーザーUUIDを使用するように変更します。

## 現状の課題

### エラー内容

```
Error code: 22P02
Message: "invalid input syntax for type uuid: \"test-user-001\""
```

### 原因

1. **`lib/db.ts`の93行目**: `DEFAULT_USER_ID = 'test-user-001'`が定義されている
2. **`lib/actions.ts`の27行目**: 同様に`DEFAULT_USER_ID = 'test-user-001'`が定義されている
3. **データベーススキーマ**: `daily_records.user_id`は`uuid`型として定義されている
4. **APIルート**: 認証チェックがなく、`undefined`が渡されるとデフォルト値が使用される

### 影響範囲

以下のファイルで`DEFAULT_USER_ID`が使用されています：

- `lib/db.ts`: 複数の関数でデフォルト値として使用
- `lib/actions.ts`: 複数の関数でデフォルト値として使用
- `app/api/daily-records/route.ts`: 認証チェックなしで`getDailyRecords(undefined, ...)`を呼び出し
- `app/api/goals/route.ts`: 認証チェックなしで`getGoals()`を呼び出し

## 実装方針

### 1. 認証ヘルパー関数の活用

既に`lib/auth/server.ts`に以下の関数が実装されています：

- `getUser()`: 現在ログイン中のユーザー情報を取得（未認証の場合は`null`）
- `requireAuth()`: 認証を必須とし、未認証の場合はログイン画面へリダイレクト

### 2. 実装アプローチ

#### アプローチA: APIルートで認証チェック（推奨）

APIルートで認証チェックを行い、取得したユーザーIDを関数に渡す方式。

**メリット**:
- 認証チェックが明確
- エラーハンドリングが統一される
- セキュリティが向上

**デメリット**:
- 各APIルートで認証チェックが必要

#### アプローチB: データベース関数内で認証情報を取得

`lib/db.ts`の関数内で認証情報を取得する方式。

**メリット**:
- 呼び出し側の変更が少ない

**デメリット**:
- 関数の責務が増える
- テストが難しくなる
- 認証不要なケースに対応できない

**結論**: **アプローチAを採用**（セキュリティと保守性の観点から）

## 実装手順

### フェーズ1: APIルートの修正

#### 1-1. `app/api/daily-records/route.ts`

**変更内容**:
1. `getUser`を`@/lib/auth/server`からインポート
2. GET/POSTメソッドの最初で認証チェックを追加
3. 取得した`user.id`を関数に渡す

**変更前**:
```typescript
export async function GET(request: NextRequest) {
  const records = await getDailyRecords(undefined, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
}
```

**変更後**:
```typescript
export async function GET(request: NextRequest) {
  // 認証チェック
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const records = await getDailyRecords(user.id, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
}
```

#### 1-2. `app/api/goals/route.ts`

**変更内容**:
1. `getUser`をインポート
2. GET/PUTメソッドで認証チェックを追加
3. `user.id`を関数に渡す

### フェーズ2: `lib/db.ts`の修正

#### 2-1. `DEFAULT_USER_ID`の削除または非推奨化

**方針**: `DEFAULT_USER_ID`を削除し、`userId`パラメータを必須にする。

**変更内容**:
1. `DEFAULT_USER_ID`定数を削除
2. 関数の`userId`パラメータからデフォルト値を削除
3. TypeScriptの型を`userId: string`に変更（`userId?: string`から）

**影響を受ける関数**:
- `getUserSettings(userId: string = DEFAULT_USER_ID)`
- `getGoals(userId: string = MOCK_USER_ID)` → `getGoals(userId: string)`
- `getDailyRecords(userId: string = DEFAULT_USER_ID, ...)`
- `getDailyRecordByDate(date: string, userId: string = DEFAULT_USER_ID)`
- `createDailyRecord(..., userId: string = DEFAULT_USER_ID)`
- `getSuggestion(userId: string = DEFAULT_USER_ID)`
- `getGoalHistorySlots(userId: string = DEFAULT_USER_ID)`
- `getCurrentGoalSlot(userId: string = DEFAULT_USER_ID)`
- `createGoalHistorySlot(..., userId: string = DEFAULT_USER_ID)`
- `updateGoal(level, description, userId: string = DEFAULT_USER_ID)`
- `getGoalByLevel(level, userId: string = DEFAULT_USER_ID)`
- `calculateStreakFromRecords(userId: string = MOCK_USER_ID)` → `calculateStreakFromRecords(userId: string)`

**注意**: 
- `MOCK_USER_ID`は`'00000000-0000-0000-0000-000000000001'`という有効なUUID形式ですが、実際のユーザーIDに置き換える必要があります
- `lib/mockData.ts`の`MOCK_USER_ID`はモックデータ用のため、本実装では使用しません

### フェーズ3: `lib/actions.ts`の修正

#### 3-1. 同様の修正を適用

`lib/db.ts`と同様に、`DEFAULT_USER_ID`を削除し、`userId`パラメータを必須にする。

### フェーズ4: Server Componentの確認

#### 4-1. 既存の実装確認

`app/page.tsx`は既に`requireAuth()`を使用して正しく実装されているため、変更不要。

#### 4-2. 他のServer Componentの確認

以下のファイルで`DEFAULT_USER_ID`や`MOCK_USER_ID`が使用されていないか確認：

- `app/record/page.tsx`
- `app/day/[date]/page.tsx`
- `app/calendar/page.tsx`
- `app/history/page.tsx`
- `app/goals/page.tsx`
- `app/settings/page.tsx`

### フェーズ5: エラーハンドリングの統一

#### 5-1. 認証エラーの統一

APIルートで認証エラーが発生した場合、以下の形式で返す：

```typescript
return NextResponse.json(
  { error: 'Unauthorized' },
  { status: 401 }
);
```

#### 5-2. ユーザーID検証

`user.id`が有効なUUID形式であることを確認（Supabase Authから取得するため、通常は問題ないが念のため）。

## 実装の優先順位

### 高優先度（エラー解決に直接関連）

1. ✅ `app/api/daily-records/route.ts` - エラーが発生している箇所
2. ✅ `lib/db.ts`の`getDailyRecords`関数 - エラーの根本原因

### 中優先度（一貫性のため）

3. `app/api/goals/route.ts`
4. `lib/db.ts`のその他の関数
5. `lib/actions.ts`

### 低優先度（確認のみ）

6. Server Componentの確認
7. その他の使用箇所の確認

## テスト計画

### 1. 単体テスト

- [ ] 認証済みユーザーでAPIが正常に動作する
- [ ] 未認証ユーザーで401エラーが返る
- [ ] ユーザーIDが正しく渡される

### 2. 統合テスト

- [ ] ホーム画面で自分の日報が表示される
- [ ] 記録作成APIで自分の記録が作成される
- [ ] 複数ユーザーでデータが混在しない

### 3. エラーケース

- [ ] 認証トークンが無効な場合
- [ ] セッションが期限切れの場合
- [ ] データベース接続エラーの場合

## 注意事項

### 1. 後方互換性

`DEFAULT_USER_ID`を削除すると、既存のコードでコンパイルエラーが発生する可能性があります。段階的に修正を進めます。

### 2. 開発環境でのテスト

開発環境で複数のユーザーアカウントを作成し、各ユーザーで正しく動作することを確認します。

### 3. データ移行

既存の`test-user-001`で作成されたデータは、実際のユーザーIDに移行する必要がある可能性があります。ただし、本実装では新規データのみを対象とします。

### 4. スクリプトファイル

`scripts/`ディレクトリ内のテストスクリプトも確認が必要です。これらは開発用のため、後回しでも問題ありません。

## 参考資料

### 既存の実装例

- `app/page.tsx`: `requireAuth()`を使用した実装例
- `app/api/goals/initial/route.ts`: `getUser()`を使用したAPIルートの実装例

### 関連ファイル

- `lib/auth/server.ts`: 認証ヘルパー関数
- `lib/supabase/server.ts`: Supabaseクライアント作成
- `docs/home-page-user-id-implementation-plan.md`: ホーム画面の実装計画（既に実装済み）

## 実装チェックリスト

### フェーズ1: APIルート

- [ ] `app/api/daily-records/route.ts`のGETメソッドに認証チェックを追加
- [ ] `app/api/daily-records/route.ts`のPOSTメソッドに認証チェックを追加
- [ ] `app/api/goals/route.ts`のGETメソッドに認証チェックを追加
- [ ] `app/api/goals/route.ts`のPUTメソッドに認証チェックを追加

### フェーズ2: lib/db.ts

- [ ] `DEFAULT_USER_ID`定数を削除
- [ ] `getUserSettings`の`userId`パラメータを必須に
- [ ] `getGoals`の`userId`パラメータを必須に（`MOCK_USER_ID`の使用を確認）
- [ ] `getDailyRecords`の`userId`パラメータを必須に
- [ ] `getDailyRecordByDate`の`userId`パラメータを必須に
- [ ] `createDailyRecord`の`userId`パラメータを必須に
- [ ] `getSuggestion`の`userId`パラメータを必須に
- [ ] `getGoalHistorySlots`の`userId`パラメータを必須に
- [ ] `getCurrentGoalSlot`の`userId`パラメータを必須に
- [ ] `createGoalHistorySlot`の`userId`パラメータを必須に
- [ ] `updateGoal`の`userId`パラメータを必須に
- [ ] `getGoalByLevel`の`userId`パラメータを必須に
- [ ] `calculateStreakFromRecords`の`userId`パラメータを確認（`MOCK_USER_ID`の使用を確認）

### フェーズ3: lib/actions.ts

- [ ] `DEFAULT_USER_ID`定数を削除
- [ ] 各関数の`userId`パラメータを必須に

### フェーズ4: その他の確認

- [ ] Server Componentで`DEFAULT_USER_ID`が使用されていないか確認
- [ ] スクリプトファイルで`DEFAULT_USER_ID`が使用されていないか確認

### フェーズ5: テスト

- [ ] 認証済みユーザーでの動作確認
- [ ] 未認証ユーザーでのエラーハンドリング確認
- [ ] 複数ユーザーでのデータ分離確認
