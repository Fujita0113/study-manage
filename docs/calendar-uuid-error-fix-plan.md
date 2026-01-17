# カレンダーページ UUID エラー修正計画

## エラー概要

`/calendar` ページで以下のエラーが発生しています：

```
Error code: 22P02
Message: "invalid input syntax for type uuid: \"test-user-001\""
User ID: test-user-001
```

## 問題の原因

1. **データベーススキーマ**: `daily_records.user_id` は `uuid` 型として定義されている（`supabase/migrations/20260112145145_remote_schema.sql` 78行目）
2. **認証情報**: `requireAuth()` から取得した `user.id` が `test-user-001` という非UUID形式の文字列になっている
3. **型不一致**: UUID型のカラムに非UUID形式の文字列を渡そうとしてエラーが発生

## 調査結果

### 現在の実装状況

1. **`app/calendar/page.tsx`**:
   - `requireAuth()` を使用してユーザー情報を取得（15行目）
   - `user.id` を `getDailyRecords()` に渡している（28行目）

2. **`lib/auth/server.ts`**:
   - `requireAuth()` は Supabase の `auth.getUser()` を呼び出している
   - 通常は UUID 形式の `user.id` を返すはず

3. **`lib/db.ts`**:
   - `getDailyRecords()` 関数は `userId` をそのまま Supabase クエリに渡している（352行目）

### 考えられる原因

1. **認証セッションの問題**: 
   - Supabase の認証セッションが正しく設定されていない
   - 開発環境でテストユーザーが使用されている可能性

2. **認証情報の取得失敗**:
   - `requireAuth()` が正しく動作していない
   - フォールバック値として `test-user-001` が使用されている可能性

3. **環境変数の問題**:
   - Supabase の設定が正しくない
   - 認証が正しく初期化されていない

## 修正計画

### フェーズ1: 認証情報の検証とデバッグ

#### 1-1. `requireAuth()` の動作確認

**目的**: `requireAuth()` が正しく UUID を返しているか確認

**実装**:
- `app/calendar/page.tsx` にデバッグログを追加
- `user.id` の値と型を確認
- UUID 形式の検証を追加

**変更内容**:
```typescript
export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  // 認証チェックとユーザー情報の取得
  const user = await requireAuth();
  
  // デバッグ: ユーザーIDの検証
  console.log('[Calendar] User ID:', user.id);
  console.log('[Calendar] User ID type:', typeof user.id);
  console.log('[Calendar] Is valid UUID:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id));
  
  // UUID形式でない場合はエラー
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
    console.error('[Calendar] Invalid user ID format:', user.id);
    throw new Error('Invalid user ID format');
  }
  
  // ... 以下既存のコード
}
```

#### 1-2. `lib/auth/server.ts` の確認

**目的**: `requireAuth()` と `getUser()` の実装を確認

**確認項目**:
- `getUser()` が正しく Supabase の認証情報を取得しているか
- エラーハンドリングが適切か
- フォールバック値が設定されていないか

### フェーズ2: エラーハンドリングの改善

#### 2-1. `getDailyRecords()` での UUID 検証

**目的**: データベースクエリの前に UUID 形式を検証

**実装**:
```typescript
export async function getDailyRecords(
  userId: string,
  options?: { startDate?: string; endDate?: string }
): Promise<DailyRecord[]> {
  // UUID形式の検証
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error('Invalid user ID format:', userId);
    throw new Error(`Invalid user ID format: ${userId}. Expected UUID format.`);
  }
  
  const supabase = await createClient();
  // ... 以下既存のコード
}
```

#### 2-2. エラーメッセージの改善

**目的**: より詳細なエラーメッセージを提供

**実装**:
- エラー発生時にユーザーIDの形式をログに記録
- 認証状態を確認するための情報を追加

### フェーズ3: 認証フローの確認

#### 3-1. ログインページの確認

**目的**: ログインが正しく動作しているか確認

**確認項目**:
- ログイン後に正しいセッションが作成されているか
- セッションクッキーが正しく設定されているか

#### 3-2. ミドルウェアの確認

**目的**: `proxy.ts` の認証チェックが正しく動作しているか確認

**確認項目**:
- 認証されていないユーザーが `/calendar` にアクセスできないか
- 認証済みユーザーの `user.id` が正しい形式か

### フェーズ4: 根本原因の特定と修正

#### 4-1. 認証情報の取得方法の確認

**目的**: Supabase の認証情報が正しく取得できているか確認

**確認項目**:
- 環境変数が正しく設定されているか
- Supabase クライアントが正しく初期化されているか
- セッション管理が正しく動作しているか

#### 4-2. テストユーザーの確認

**目的**: 開発環境でテストユーザーが使用されていないか確認

**確認項目**:
- データベースに `test-user-001` というユーザーが存在するか
- 認証情報が正しく設定されているか

## 実装の優先順位

### 高優先度（即座に実施）

1. ✅ **フェーズ1-1**: `app/calendar/page.tsx` にデバッグログとUUID検証を追加
2. ✅ **フェーズ2-1**: `getDailyRecords()` にUUID検証を追加

### 中優先度（根本原因の特定）

3. **フェーズ1-2**: `lib/auth/server.ts` の実装確認
4. **フェーズ3-1**: ログインページの確認
5. **フェーズ3-2**: ミドルウェアの確認

### 低優先度（長期的な改善）

6. **フェーズ4-1**: 認証情報の取得方法の確認
7. **フェーズ4-2**: テストユーザーの確認

## テスト計画

### 1. 単体テスト

- [ ] `requireAuth()` が正しく UUID を返すことを確認
- [ ] `getDailyRecords()` が UUID 形式でない場合にエラーを投げることを確認
- [ ] UUID 検証が正しく動作することを確認

### 2. 統合テスト

- [ ] 認証済みユーザーで `/calendar` にアクセスできることを確認
- [ ] 未認証ユーザーが `/calendar` にアクセスできないことを確認
- [ ] カレンダーページで日次記録が正しく表示されることを確認

### 3. エラーケース

- [ ] 無効なユーザーID形式でエラーが発生することを確認
- [ ] エラーメッセージが適切に表示されることを確認

## 注意事項

1. **後方互換性**: UUID 検証を追加しても、既存の正しい UUID 形式のユーザーIDには影響しない
2. **セキュリティ**: ユーザーIDの検証はセキュリティの観点からも重要
3. **デバッグ**: 本番環境ではデバッグログを削除または条件付きにする

## 参考資料

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [PostgreSQL UUID Type](https://www.postgresql.org/docs/current/datatype-uuid.html)
- 既存の実装計画: `docs/user-id-authentication-implementation-plan.md`
