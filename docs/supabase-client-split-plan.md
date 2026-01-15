# Supabaseクライアント分割実装計画

## 問題の概要

Client Componentから`next/headers`を使用するServer Component専用のSupabaseクライアントをインポートしているため、ビルドエラーが発生している。

## エラーの原因

```
app/record/page.tsx ('use client')
  → lib/db.ts
    → lib/supabase/client.ts
      → next/headers (Server Component専用)
```

## 解決策

Supabaseクライアントを以下の2つに分割：

1. **Server Component用**: `lib/supabase/server.ts`（`next/headers`使用）
2. **Client Component用**: `lib/supabase/client.ts`（ブラウザ用、`next/headers`不使用）

## 実装手順

### 1. Server Component用クライアントの作成

**ファイル**: `lib/supabase/server.ts`

- 既存の`lib/supabase/client.ts`の内容をコピー
- `next/headers`を使用したServer Component専用実装
- `createClient()`関数をエクスポート

### 2. Client Component用クライアントの更新

**ファイル**: `lib/supabase/client.ts`

- ブラウザ用のSupabaseクライアントに変更
- `@supabase/ssr`の`createBrowserClient`を使用
- `next/headers`への依存を削除
- `createClient()`関数をエクスポート（ただし、ブラウザ用実装）

### 3. db.tsの修正

**ファイル**: `lib/db.ts`

- Server Component用の関数から`@/lib/supabase/server`をインポート
- `getDailyRecords()`関数でServer用クライアントを使用

### 4. Client Componentでのdb.ts使用の見直し

**問題**: `app/record/page.tsx`（Client Component）から`getDailyRecords()`を呼び出せない
- `getDailyRecords()`はServer Component用のSupabaseクライアントを使用
- Client Componentから直接呼び出すことができない

**解決策の選択肢**:

#### 選択肢A: API Routeを作成（推奨）
- `/api/daily-records`エンドポイントを作成
- Server側で`getDailyRecords()`を呼び出し
- Client Componentからfetchで取得

#### 選択肢B: getDailyRecordsをクライアント用に複製
- `lib/db-client.ts`を作成
- Client Component用のSupabaseクライアントを使用

#### 選択肢C: recordページをServer Componentに変更
- `'use client'`を削除
- Server Componentとして実装し直す

## 影響範囲

### 変更が必要なファイル

1. `lib/supabase/client.ts` - Client Component用に変更
2. `lib/supabase/server.ts` - 新規作成（Server Component用）
3. `lib/db.ts` - インポート元を変更
4. `app/record/page.tsx` - データ取得方法を変更（選択肢に応じて）

### 潜在的な影響

- 他のClient Componentで`lib/db.ts`を使用している箇所も同様の問題が発生する可能性
- 全体的なデータ取得パターンの見直しが必要になる可能性

## 次のステップ

1. ユーザーに選択肢（A/B/C）を確認
2. 承認後、実装を開始
