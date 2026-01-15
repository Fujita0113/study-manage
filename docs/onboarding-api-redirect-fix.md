# Onboarding API Route リダイレクト問題の修正

## 問題の原因

API Route (`/api/goals/initial`) へのリクエストが、ミドルウェアによって `/onboarding` にリダイレクトされていました。

### 詳細

1. **ミドルウェアの動作**:
   - 認証済みユーザーで目標未設定の場合、`/onboarding` 以外のパスにアクセスすると `/onboarding` にリダイレクト
   - この処理が `/api/goals/initial` にも適用されていた

2. **結果**:
   - API RouteへのリクエストがHTML（リダイレクト先のページ）を返していた
   - `Content-Type: text/html` となっていた
   - JSONレスポンスが返されなかった

## 修正内容

### `proxy.ts` の変更

1. **API Routeの判定を追加**:
   ```typescript
   const isApiPath = request.nextUrl.pathname.startsWith('/api');
   ```

2. **目標チェックからAPI Routeを除外**:
   ```typescript
   // 修正前
   if (user && !isAuthPath) {
   
   // 修正後
   if (user && !isAuthPath && !isApiPath) {
   ```

3. **未認証ユーザーのリダイレクトからもAPI Routeを除外**:
   ```typescript
   // 修正前
   if (!user && !isAuthPath) {
   
   // 修正後
   if (!user && !isAuthPath && !isApiPath) {
   ```

## 理由

- API Routeは独自に認証チェックを行う（`getUser()`を使用）
- API RouteはJSONレスポンスを返す必要がある
- ミドルウェアのリダイレクト処理はページアクセス用であり、API Routeには適用すべきではない

## テスト

修正後、以下を確認してください：

1. **API Routeが正しく動作する**:
   - `/api/goals/initial` へのPOSTリクエストがJSONを返す
   - `Content-Type: application/json` となる

2. **目標が保存される**:
   - API Routeのログで目標が保存されたことを確認
   - 検証が成功したことを確認

3. **リダイレクトが正常に動作する**:
   - 目標保存後、ホーム画面にリダイレクトされる
   - ミドルウェアが正しく目標をチェックできる

## 関連ファイル

- `proxy.ts`: ミドルウェア（修正済み）
- `app/api/goals/initial/route.ts`: API Route（変更なし）
- `app/onboarding/page.tsx`: Onboardingページ（変更なし）
