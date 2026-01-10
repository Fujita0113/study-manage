# Supabase統合実装計画 - ホーム画面編

## 作業の目的と概要

現在モックデータで動作しているホーム画面を、Supabaseの実際のデータベースから取得したデータで動作するように置き換えます。

### 対象機能
- ホーム画面のデイリーレポートカード表示
- ヘッダーのストリーク表示
- 提案バナーの表示判定

### 実装方針
- **認証**: 一旦MOCK_USER_IDを継続使用（認証機能は後回し）
- **データ取得**: Next.js 16のServer Componentsから`@supabase/ssr`経由でSupabaseに接続
- **段階的移行**: ホーム画面に必要なデータのみを先行実装

---

## 前提条件の確認

### 実装前に必要な作業
- [x] `.env.local`にSupabaseの接続情報が設定済み
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- [ ] **Supabaseのデータベーステーブル作成（実装前に必要）**
  - `user_settings`
  - `goals`
  - `daily_records`
  - `streaks`
  - `goal_history_slots`（目標変遷履歴用、今回は使用しないが将来用に作成）

---

## 必要なパッケージのインストール

### インストールするパッケージ
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 各パッケージの役割
- `@supabase/supabase-js`: Supabaseクライアントのコア機能
- `@supabase/ssr`: Next.js Server Components対応のSSR用ラッパー

---

## 実装手順

### ステップ1: データベースマイグレーション用SQLファイルの作成

#### 作成ファイル
- `supabase/migrations/001_initial_schema.sql`

#### 内容
[data-model.md](./data-model.md)のSQL定義を元に、以下のテーブルを作成：
- `user_settings`
- `goals`
- `daily_records`
- `streaks`
- `goal_history_slots`
- 自動更新トリガー（`updated_at`フィールド用）

#### RLS（Row Level Security）ポリシー
- 今回は認証を実装しないため、一旦すべて無効化または全ユーザー許可
- 将来的に認証実装時に適切なポリシーを追加

#### 初期データ
- MOCK_USER_IDユーザーのデータを挿入（テスト用）
- 目標（Bronze/Silver/Gold）の初期値
- 直近14日分のデイリーレコード（モックデータと同等のもの）
- ストリーク情報

---

### ステップ2: Supabaseクライアントのセットアップ

#### 作成ファイル
- `lib/supabase/client.ts` - Server Component用クライアント
- `lib/supabase/types.ts` - Supabaseから自動生成される型定義（手動で作成）

#### `lib/supabase/client.ts`の役割
- Server ComponentsからSupabaseに接続するための関数を提供
- Next.js 16の新しいキャッシュ戦略に対応
- 環境変数からSupabase接続情報を読み込み

#### 主な関数
```typescript
// Server Component用のSupabaseクライアントを作成
export function createClient()

// データベースの型定義（将来的にSupabase CLIで自動生成可能）
export type Database = { ... }
```

---

### ステップ3: `lib/db.ts`の書き換え

#### 変更内容
現在のモックデータ返却関数を、実際のSupabaseクエリに置き換えます。

#### 対象関数（ホーム画面で使用するもののみ）
1. **`getDailyRecords()`**
   - モック: `mockDailyRecords`配列をフィルタして返す
   - 実装: Supabaseの`daily_records`テーブルから取得
   - クエリ条件: `user_id`, `startDate`, `endDate`でフィルタ

2. **`getStreak()`**
   - モック: `mockStreak`を返す
   - 実装: Supabaseの`streaks`テーブルから取得
   - クエリ条件: `user_id`で検索

3. **`getSuggestion()`**
   - モック: `getDailyRecords()`の結果を使って判定ロジックを実行
   - 実装: 同じロジックだが、データソースがSupabaseに変わる
   - ビジネスロジックは変更なし

#### 保持する関数（今回は未実装）
- `getUserSettings()`, `updateUserSettings()`
- `getGoals()`, `getGoalByLevel()`, `updateGoal()`
- `createDailyRecord()`, `updateDailyRecord()`
- `updateStreak()`
- `getGoalHistorySlots()`, `getCurrentGoalSlot()`, `createGoalHistorySlot()`, `endGoalHistorySlot()`

これらは将来的に他の画面（記録画面、目標変遷画面など）で実装します。

---

### ステップ4: ホーム画面（`app/page.tsx`）の動作確認

#### 確認内容
- デイリーレポートカードが正しく表示されるか
- 日付、達成度バッジ、学習内容、日報抜粋が正しく表示されるか
- カードクリックで日詳細画面に遷移できるか
- 提案バナーが正しい条件で表示されるか

#### データがない場合の表示
- 初回ユーザー向けに「まだ記録がありません」などのメッセージを表示
- 記録ボタンへの誘導を明確にする

---

### ステップ5: ヘッダーのストリーク表示の動作確認

#### 対象ファイル
- `components/layout/Header.tsx`

#### 確認内容
- `useAppState().getStreakDays()`が正しくSupabaseのデータを取得しているか
- ストリーク数が正しく表示されるか

#### 注意点
`Header.tsx`は現在Client Component（`lib/store.tsx`のContextを使用）なので：
- Server Componentから取得したストリークデータをClient Componentに渡す方法を検討
- または、`Header.tsx`を一時的にServer Componentに変更する

**推奨アプローチ**: Layoutから`streakDays`をpropsで渡す

---

### ステップ6: エラーハンドリングの実装

#### 実装内容
- Supabase接続エラーのハンドリング
- データ取得失敗時のフォールバック処理
- エラーメッセージの表示

#### エラーの種類
1. **接続エラー**: Supabaseに接続できない
2. **クエリエラー**: SQLクエリが失敗
3. **データ不整合エラー**: 期待するデータ構造と異なる

#### フォールバック処理
- エラー時は空配列を返す
- ユーザーには「データの取得に失敗しました」と表示
- 開発環境ではコンソールにエラー詳細を出力

---

## 変更が必要なファイル一覧

### 新規作成
1. `supabase/migrations/001_initial_schema.sql` - データベーススキーマ定義
2. `lib/supabase/client.ts` - Supabaseクライアント設定
3. `lib/supabase/types.ts` - データベース型定義（手動作成版）

### 変更
1. `lib/db.ts` - モックデータからSupabaseクエリに置き換え
   - `getDailyRecords()`
   - `getStreak()`
   - `getSuggestion()`（内部で`getDailyRecords()`を使用）

2. `app/page.tsx` - ホーム画面（動作確認のみ、コード変更なし）

3. `components/layout/Header.tsx` - ストリーク表示の修正
   - propsでstreakDaysを受け取るように変更

4. `app/layout.tsx` - Headerにストリークデータを渡す
   - Server ComponentからStreakを取得してHeaderに渡す

5. `lib/store.tsx` - Context変更
   - `getStreakDays()`を削除または、propsから受け取るように変更

6. `package.json` - 依存パッケージ追加
   - `@supabase/supabase-js`
   - `@supabase/ssr`

### 保持（変更なし）
- `lib/mockData.ts` - 他の画面用に保持
- `types/index.ts` - 型定義は変更なし

---

## 想定される影響範囲

### 直接影響のある画面
- ✅ ホーム画面（`app/page.tsx`） - データ取得元がSupabaseに変更
- ✅ ヘッダー（`components/layout/Header.tsx`） - ストリーク表示の変更

### 今回影響のない画面（将来実装）
- ⏸️ 記録画面（`app/record/page.tsx`） - まだモックデータを使用
- ⏸️ カレンダー画面（`app/calendar/page.tsx`） - まだモックデータを使用
- ⏸️ 目標編集画面（`app/goals/page.tsx`） - まだモックデータを使用
- ⏸️ 目標変遷画面（`app/history/page.tsx`） - まだモックデータを使用
- ⏸️ 日詳細画面（`app/day/[date]/page.tsx`） - まだモックデータを使用

---

## テスト方針

### 手動テスト項目
1. ホーム画面が正しくデータを表示するか
2. デイリーレポートカードが正しく表示されるか
3. ストリーク数が正しく表示されるか
4. 提案バナーが正しい条件で表示されるか
5. エラー時にフォールバック処理が動作するか

### 確認する境界条件
- データが0件の場合
- データが大量にある場合
- 日付範囲の境界（startDate, endDate）
- Supabase接続エラー時の挙動

---

## 実装後の確認事項

### 動作確認
- [ ] ホーム画面が正しく表示される
- [ ] デイリーレポートカードがSupabaseのデータを表示する
- [ ] ストリーク数がSupabaseのデータを表示する
- [ ] 提案バナーが正しい条件で表示される
- [ ] カードクリックで日詳細画面に遷移する（データはまだモック）

### パフォーマンス確認
- [ ] ページ読み込み速度が許容範囲内
- [ ] Supabaseクエリのレスポンスタイムが適切

### エラーハンドリング確認
- [ ] Supabase接続エラー時に適切なメッセージが表示される
- [ ] データ取得失敗時にフォールバック処理が動作する

---

## 今後の展開

### 次に実装する画面
1. **記録画面** - DailyRecord の作成・更新
2. **カレンダー画面** - 月次のDailyRecord取得
3. **目標編集画面** - Goal の更新、GoalHistorySlot の作成
4. **目標変遷画面** - GoalHistorySlot の取得・表示

### 認証機能の追加
- Supabase Authを使った認証実装
- MOCK_USER_IDの置き換え
- RLSポリシーの有効化

---

## 備考

### Supabase CLI（オプション）
将来的にSupabase CLIを導入すると：
- マイグレーションファイルの自動生成
- TypeScript型定義の自動生成（`supabase gen types typescript`）
- ローカル開発環境のセットアップ

現時点では手動で実装しますが、プロジェクトが大きくなったら導入を検討します。

### キャッシュ戦略
Next.js 16のServer Componentsでは、デフォルトでデータがキャッシュされます。
開発中は`cache: 'no-store'`オプションを使用して、常に最新データを取得します。

```typescript
// 例: キャッシュを無効化
const { data } = await supabase
  .from('daily_records')
  .select('*')
  .eq('user_id', userId)
  // Next.js 16のfetchオプション
  // キャッシュはSupabaseクライアント設定で制御
```

実際には、Supabaseクライアント作成時に適切なキャッシュ設定を行います。
