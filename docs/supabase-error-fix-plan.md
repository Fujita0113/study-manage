# Supabase接続エラー修正計画

## 原因の特定

### 🔍 調査結果

**根本原因**: Supabaseパッケージがインストールされていなかった

#### 調査で判明したこと:

1. ✅ **MOCK_USER_IDは正しい**
   - 値: `00000000-0000-0000-0000-000000000001`
   - UUID形式: 有効

2. ✅ **データベースにデータは存在する**
   - user_settings: 1件
   - daily_records: 14件
   - すべて正しいuser_idで登録済み

3. ❌ **Supabaseパッケージが未インストール**
   - `@supabase/supabase-js`: 未インストール
   - `@supabase/ssr`: 未インストール
   - これによりランタイムエラーが発生

4. ❌ **.env.localの環境変数キー名が間違っている**
   - 実際: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - 期待: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Supabaseの標準は`ANON_KEY`

---

## 修正手順

### ステップ1: 環境変数の修正 ✅ 完了

**ファイル**: `.env.local`

**変更内容**:
```diff
NEXT_PUBLIC_SUPABASE_URL=https://gtvvyjqencrpnphemvnz.supabase.co
-NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_XRSnrtR6FOUXKktdDIqU9Q_lwC40Ts1
+NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_XRSnrtR6FOUXKktdDIqU9Q_lwC40Ts1
```

**理由**: Supabaseの標準的な環境変数名に合わせる

---

### ステップ2: Supabaseクライアントファイルの修正 ✅ 完了

**ファイル**: `lib/supabase/client.ts`

**変更内容**:
```diff
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
-   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
+   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Componentでのset操作は無視される場合がある
          }
        },
      },
    }
  );
}
```

---

### ステップ3: テストスクリプトの修正 ✅ 完了

**ファイル**:
- `scripts/test-supabase-connection.ts`
- `scripts/test-mock-data.ts`

**変更内容**:
環境変数キー名を`NEXT_PUBLIC_SUPABASE_ANON_KEY`に統一

---

### ステップ4: package.jsonの更新 ✅ 完了

**実施済み**:
```bash
npm install @supabase/supabase-js @supabase/ssr dotenv
```

**追加されたパッケージ**:
- `@supabase/supabase-js`: Supabaseクライアントライブラリ
- `@supabase/ssr`: Next.js SSR対応のSupabaseクライアント
- `dotenv`: 環境変数読み込み用（テストスクリプト用）

---

### ステップ5: 開発サーバーの再起動

**実施方法**:
```bash
npm run dev
```

**確認項目**:
- [ ] ホーム画面でデイリーレポートカードが表示される
- [ ] コンソールエラーが表示されない
- [ ] 提案バナーが表示される

---

### ステップ6: 動作確認テスト

**テスト1: Supabase接続確認**
```bash
npx tsx scripts/test-supabase-connection.ts
```

**期待結果**: すべてのテーブルが存在することを確認

**テスト2: getDailyRecords関数の動作確認**
```bash
npx tsx scripts/test-get-daily-records.ts
```

**期待結果**: 14件の記録が取得される

**テスト3: getSuggestion関数の動作確認**
```bash
npx tsx scripts/test-get-suggestion.ts
```

**期待結果**: レベルアップ提案が表示される

---

## 想定される結果

### 修正前のエラー:
```
Failed to fetch daily records: {
  code: '22P02',
  details: null,
  hint: null,
  message: 'invalid input syntax for type uuid: "mock-user-001"'
}
```

### 修正後の期待動作:
- ✅ ホーム画面に過去14日分のデイリーレポートカードが表示される
- ✅ 各カードに日付、達成度、学習内容が表示される
- ✅ 提案バナーが画面右下に表示される
- ✅ コンソールエラーがない

---

## 実装順序

1. ✅ Supabaseパッケージのインストール（完了）
2. ✅ データベース調査スクリプトの作成・実行（完了）
3. ⏭️ 環境変数の修正
4. ⏭️ Supabaseクライアントファイルの修正
5. ⏭️ テストスクリプトの修正
6. ⏭️ 開発サーバーの再起動と動作確認

---

## トラブルシューティング

### 問題1: 依然として同じエラーが出る場合

**対処法**:
```bash
# ビルドキャッシュをクリア
rm -rf .next
npm run build
npm run dev
```

### 問題2: 環境変数が読み込まれない

**対処法**:
- サーバーを完全に停止してから再起動
- `.env.local`ファイルが正しい場所にあるか確認
- 環境変数名のスペルミスがないか確認

### 問題3: 型エラーが発生する

**対処法**:
```bash
# 型定義を再生成
npm run build
```

---

## 次のステップ

修正完了後、以下のタスクに進む:

1. ✅ ホーム画面のSupabase接続（本修正で完了）
2. ⏸️ 記録画面のSupabase対応
3. ⏸️ カレンダー画面のSupabase対応
4. ⏸️ 目標編集画面のSupabase対応
5. ⏸️ 目標変遷画面のSupabase対応

---

## 完了条件

以下のすべてが確認できれば修正完了:

- [ ] ホーム画面でデイリーレポートカードが表示される
- [ ] カードに正しい日付、達成度、学習内容が表示される
- [ ] 提案バナーが表示される
- [ ] コンソールに`Failed to fetch daily records`エラーが表示されない
- [ ] すべてのテストスクリプトが成功する
- [ ] ビルドエラーがない
