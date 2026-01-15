# ログイン機能実装計画

## 目的と概要

学習管理アプリケーションに、Supabase Authを使用したメール＋パスワード認証機能を実装します。
ユーザーごとに学習記録を管理できるようにし、未認証ユーザーは自動的にログイン画面へリダイレクトされます。

## 使用する主要モジュールとバージョン

### 依存関係（package.jsonより確認）

- **Next.js**: `16.1.1`
  - App Routerを使用
  - Server ComponentとClient Componentの適切な使い分けが必要
- **@supabase/supabase-js**: `^2.90.1`
  - Supabaseクライアントライブラリ
- **@supabase/ssr**: `^0.8.0`
  - Next.js App Router対応のSSR用ライブラリ
  - Server ComponentとClient Componentで異なるクライアント作成が必要
- **React**: `19.2.3`
  - React 19の新機能に対応

### 重要な注意点

1. **Server ComponentとClient Componentの境界**
   - `lib/supabase/server.ts`はServer Component専用（`next/headers`を使用）
   - `lib/supabase/client.ts`はClient Component専用
   - Client ComponentでServer Component専用機能を直接インポートするとエラーになる

2. **認証状態の管理**
   - Server Componentでは`cookies()`経由でセッション情報を取得
   - Client Componentではブラウザのクッキーから自動取得

## 実装ファイルと変更内容

### 1. 認証用ヘルパー関数（新規作成）

#### `lib/auth/server.ts`（新規）

**目的**: Server Component用の認証ヘルパー関数

**内容**:
- `getUser()`: 現在ログイン中のユーザー情報を取得
- `requireAuth()`: 認証を必須とし、未認証の場合はリダイレクト情報を返す

**依存関係**: `lib/supabase/server.ts`を使用

#### `lib/auth/client.ts`（新規）

**目的**: Client Component用の認証ヘルパー関数

**内容**:
- `signUp()`: メールアドレスとパスワードでサインアップ
- `signIn()`: メールアドレスとパスワードでログイン
- `signOut()`: ログアウト
- `resetPassword()`: パスワードリセットメール送信
- `useAuth()`: 認証状態を管理するReact Hook

**依存関係**: `lib/supabase/client.ts`を使用

### 2. 認証画面（新規作成）

#### `app/(auth)/layout.tsx`（新規）

**目的**: 認証画面専用のレイアウト

**内容**:
- 共通のヘッダーやナビゲーションを表示しない
- 中央揃えのシンプルなレイアウト

**種別**: Server Component

#### `app/(auth)/login/page.tsx`（新規）

**目的**: ログイン画面

**内容**:
- メールアドレスとパスワードの入力フォーム
- ログインボタン
- サインアップ画面へのリンク
- パスワードリセット画面へのリンク
- エラーメッセージ表示

**種別**: Client Component（`'use client'`必須）

**API呼び出し**: Client側で直接Supabase Authを呼び出し

#### `app/(auth)/signup/page.tsx`（新規）

**目的**: サインアップ画面

**内容**:
- メールアドレス、パスワード、パスワード確認の入力フォーム
- バリデーション（メール形式、パスワード長、一致確認）
- サインアップボタン
- ログイン画面へのリンク
- 成功時のメール確認案内
- エラーメッセージ表示

**種別**: Client Component（`'use client'`必須）

**API呼び出し**: Client側で直接Supabase Authを呼び出し

#### `app/(auth)/reset-password/page.tsx`（新規）

**目的**: パスワードリセット画面

**内容**:
- メールアドレスの入力フォーム
- リセットメール送信ボタン
- ログイン画面へのリンク
- 成功・エラーメッセージ表示

**種別**: Client Component（`'use client'`必須）

**API呼び出し**: Client側で直接Supabase Authを呼び出し

### 3. 認証ミドルウェア（新規作成）

#### `middleware.ts`（新規）

**目的**: ページアクセス時の認証チェックとリダイレクト

**内容**:
- 未認証ユーザーを`/login`にリダイレクト
- 認証済みユーザーが`/login`, `/signup`にアクセスした場合は`/`にリダイレクト
- 公開パス（`/login`, `/signup`, `/reset-password`）の定義

**依存関係**: `@supabase/ssr`の`createServerClient`を使用

**注意点**: Next.js 16のミドルウェアAPI仕様に準拠

### 4. 既存ファイルの変更

#### `app/layout.tsx`（変更）

**変更内容**:
- 認証状態をチェックし、未認証の場合はログイン画面へリダイレクト
- ただし、`middleware.ts`で制御するため、layoutでの処理は不要

**変更なし**: ミドルウェアで制御するため、変更不要

#### `app/settings/SettingsPageClient.tsx`（変更）

**変更内容**:
- ログアウトボタンを追加
- ログアウト処理の実装

**依存関係**: `lib/auth/client.ts`の`signOut()`を使用

#### `lib/db.ts`（変更予定）

**変更内容**:
- 各データベース操作関数で、ユーザーIDを使用してデータをフィルタリング
- 現在は全ユーザーのデータを取得しているが、認証実装後は`user_id`でフィルタリングが必要

**注意**: この変更は別タスクとして後続で実施（今回の実装範囲外）

### 5. 環境変数の確認

#### `.env.local`

**必要な環境変数**:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase プロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名キー

**確認事項**: 既に設定済みか確認

## データベースの変更

### Supabase Authの設定

Supabase側で以下を設定する必要があります（Supabaseダッシュボードで設定）:

1. **Email Auth の有効化**
   - Authentication > Providers > Email を有効化
   - メール確認を有効化（Confirm email）

2. **メールテンプレートの設定**（オプション）
   - 確認メール、パスワードリセットメールのカスタマイズ

3. **Row Level Security (RLS) の設定**（今後の実装）
   - 各テーブル（`goals`, `daily_records`, `goal_slots`）に`user_id`カラムを追加
   - RLSポリシーを設定して、ユーザーは自分のデータのみアクセス可能にする

**注意**: RLSの設定は今回の実装範囲外（別途計画が必要）

## 実装手順

### ステップ1: 認証ヘルパー関数の作成

1. `lib/auth/server.ts`を作成
   - `getUser()`, `requireAuth()`を実装
2. `lib/auth/client.ts`を作成
   - `signUp()`, `signIn()`, `signOut()`, `resetPassword()`, `useAuth()`を実装

### ステップ2: 認証画面の作成

1. `app/(auth)/layout.tsx`を作成
2. `app/(auth)/login/page.tsx`を作成
3. `app/(auth)/signup/page.tsx`を作成
4. `app/(auth)/reset-password/page.tsx`を作成

### ステップ3: 認証ミドルウェアの実装

1. `middleware.ts`を作成
   - 未認証ユーザーのリダイレクト処理
   - 認証済みユーザーの認証画面アクセス制御

### ステップ4: 設定画面にログアウト機能追加

1. `app/settings/SettingsPageClient.tsx`を編集
   - ログアウトボタンを追加
   - `signOut()`関数を呼び出し

### ステップ5: 動作確認

1. サインアップ
   - 新規ユーザー登録が正常に動作するか
   - メール確認リンクが送信されるか
2. ログイン
   - メールアドレスとパスワードでログインできるか
   - エラーメッセージが適切に表示されるか
3. パスワードリセット
   - リセットメールが送信されるか
4. ログアウト
   - ログアウト後、ログイン画面にリダイレクトされるか
5. アクセス制御
   - 未認証ユーザーがホーム画面にアクセスしようとすると、ログイン画面にリダイレクトされるか
   - 認証済みユーザーが認証画面にアクセスしようとすると、ホーム画面にリダイレクトされるか

## 想定される影響範囲

### 直接影響を受ける画面

- 全画面: 未認証ユーザーはログイン画面へリダイレクト
- 設定画面: ログアウトボタンが追加される

### 今後対応が必要な箇所

1. **データベースのユーザー紐付け**
   - 各テーブルに`user_id`カラムを追加
   - RLSポリシーの設定
   - `lib/db.ts`の全関数を`user_id`でフィルタリングするよう変更

2. **初回ログイン時のオンボーディング**
   - 目標が未設定の場合、目標設定画面へ誘導（将来的な実装）

## テスト方針

### 手動テスト

1. **サインアップフロー**
   - 正常系: 有効なメールアドレスとパスワードでアカウント作成
   - 異常系: 無効なメールアドレス、短すぎるパスワード、パスワード不一致

2. **ログインフロー**
   - 正常系: 登録済みのメールアドレスとパスワードでログイン
   - 異常系: 未登録のメールアドレス、間違ったパスワード

3. **パスワードリセットフロー**
   - 正常系: 登録済みのメールアドレスでリセットメール送信
   - 異常系: 未登録のメールアドレス

4. **アクセス制御**
   - 未認証状態で各画面にアクセス → ログイン画面へリダイレクト
   - 認証済み状態で認証画面にアクセス → ホーム画面へリダイレクト

5. **ログアウト**
   - ログアウト後、ログイン画面へリダイレクト
   - ログアウト後、再度ホーム画面にアクセス → ログイン画面へリダイレクト

### 自動テスト（今回は実装しない）

- 将来的にはE2Eテストを追加することを推奨

## セキュリティ考慮事項

1. **パスワードの安全性**
   - 最低8文字以上を要求
   - Supabaseが自動的にハッシュ化して保存

2. **セッション管理**
   - Supabaseが自動的にJWTトークンを発行
   - HTTPOnly Cookieに保存され、XSS攻撃から保護

3. **メール確認**
   - Supabaseのメール確認機能を有効化
   - 確認済みメールアドレスのみログイン可能

4. **CSRF対策**
   - Next.jsとSupabaseが自動的に対策

5. **環境変数の管理**
   - `.env.local`はgitignoreに含まれていることを確認
   - 本番環境では適切に環境変数を設定

## 実装時の注意事項

1. **Server ComponentとClient Componentの使い分け**
   - 認証画面はフォーム入力があるため、すべてClient Component
   - ミドルウェアはサーバーサイドで実行

2. **エラーハンドリング**
   - Supabaseのエラーメッセージを適切に日本語化
   - ユーザーフレンドリーなエラーメッセージを表示

3. **リダイレクト処理**
   - ログイン成功後はホーム画面（`/`）へ
   - ログアウト後はログイン画面（`/login`）へ
   - 未認証アクセスはログイン画面へ
   - 認証済みの認証画面アクセスはホーム画面へ

4. **ローディング状態の表示**
   - ログイン、サインアップ、ログアウト処理中はボタンを無効化
   - ローディングインジケーターを表示

## 今回の実装範囲外（後続タスク）

1. **データベースのユーザー紐付け**
   - 各テーブルへの`user_id`カラム追加
   - RLSポリシーの設定
   - `lib/db.ts`の全関数の修正

2. **初回ログイン時のオンボーディング**
   - 目標設定画面への誘導

3. **プロフィール機能**
   - ユーザー名やアバターの設定

4. **メールテンプレートのカスタマイズ**
   - Supabaseダッシュボードで設定

## 参考資料

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js App Router Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [@supabase/ssr Documentation](https://github.com/supabase/ssr)
