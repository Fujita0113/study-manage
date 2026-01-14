# 初期目標設定画面 実装計画（フェーズ1）

## 目的と概要

初回ログイン時に、ユーザーがBronze/Silver/Goldの3つの目標を設定できる画面を実装します。
目標が未設定の場合は、ログイン直後に自動的にこの画面へ遷移し、すべての目標を入力してから学習を開始できるようにします。

**このフェーズでは、初期目標設定画面とミドルウェアの実装のみに集中します。**
既存画面のユーザーID修正は次のフェーズで行います。

## 使用する主要モジュールとバージョン

### 依存関係（package.jsonより確認）

- **Next.js**: `16.1.1`
  - App Routerを使用
  - Server ComponentとClient Componentの適切な使い分けが必要
- **@supabase/supabase-js**: `^2.90.1`
  - Supabaseクライアントライブラリ
- **@supabase/ssr**: `^0.8.0`
  - Next.js App Router対応のSSR用ライブラリ
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

3. **ユーザーIDの取得**
   - `lib/auth/server.ts`の`getUser()`を使用してログイン中のユーザー情報を取得

## 実装ファイルと変更内容

### 1. データベース関数の追加（既存ファイル変更）

#### `lib/db.ts`（変更）

**追加する関数**:

1. **`hasGoals(userId: string): Promise<boolean>`**
   - ユーザーが目標を持っているかチェックする関数
   - `goals`テーブルから`user_id`でカウント
   - 3つ全て存在する場合は`true`、それ以外は`false`
   - ミドルウェアで使用

2. **`createInitialGoals(bronze: string, silver: string, gold: string, userId: string): Promise<void>`**
   - 3つの目標を一括で作成する関数
   - `goals`テーブルに3レコード挿入（Bronze/Silver/Gold）
   - `goal_history_slots`テーブルに初期スロット作成（変更理由: `initial`）

**実装詳細**:
```typescript
// hasGoals実装例
export async function hasGoals(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to check goals:', error);
    return false;
  }

  return data && data.length === 3;
}

// createInitialGoals実装例
export async function createInitialGoals(
  bronze: string,
  silver: string,
  gold: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  // 1. goals テーブルに3つの目標を挿入
  const goalsToInsert: GoalInsert[] = [
    { user_id: userId, level: 'bronze', description: bronze },
    { user_id: userId, level: 'silver', description: silver },
    { user_id: userId, level: 'gold', description: gold },
  ];

  const { error: goalsError } = await supabase
    .from('goals')
    .insert(goalsToInsert);

  if (goalsError) {
    throw new Error(`Failed to create goals: ${goalsError.message}`);
  }

  // 2. goal_history_slots に初期スロットを作成
  const today = new Date().toISOString().split('T')[0];
  const slotData: GoalHistorySlotInsert = {
    user_id: userId,
    bronze_goal: bronze,
    silver_goal: silver,
    gold_goal: gold,
    start_date: today,
    end_date: null,
    change_reason: 'initial',
  };

  const { error: slotError } = await supabase
    .from('goal_history_slots')
    .insert(slotData);

  if (slotError) {
    throw new Error(`Failed to create goal history slot: ${slotError.message}`);
  }
}
```

### 2. データモデルの確認と修正

#### `supabase/migrations/*.sql`（確認・修正）

**確認事項**: `goal_history_slots`テーブルの`change_reason`カラムに`initial`が含まれているか確認

**対応**:
- マイグレーションファイルを確認
- `initial`が含まれていない場合は、既存の`change_reason`の型定義を更新
- 新しいマイグレーションファイルを作成して`ALTER TYPE`で`initial`を追加

### 3. 初期目標設定画面（新規作成）

#### `app/onboarding/page.tsx`（新規）

**目的**: 初回ログイン時に3つの目標を設定する画面

**内容**:
- タイトル: 「目標を設定しましょう」
- 説明文: 「学習を続けるために、3つのレベルの目標を設定します。」
- Bronze/Silver/Goldの3つの目標入力フォーム
- 各入力欄には適切なプレースホルダーを表示
- すべての目標が入力されている場合のみ保存ボタンを有効化
- 保存ボタン押下でAPI Route経由でデータベースに保存
- 保存後、ホーム画面（`/`）へリダイレクト

**種別**: Client Component（`'use client'`必須）

**API呼び出し**: `/api/goals/initial` エンドポイントを呼び出し

**UIデザイン**:
- シンプルで分かりやすいフォーム
- 各レベルの説明を明示（最低限/計画通り/期待以上）
- バリデーションエラーの表示
- ローディング状態の表示

### 4. API Route（新規作成）

#### `app/api/goals/initial/route.ts`（新規）

**目的**: 初期目標を一括保存するAPI

**内容**:
- POSTリクエストを受け付ける
- ログイン中のユーザーIDを取得（`getUser()`）
- リクエストボディから3つの目標を取得
- バリデーション（各目標が最低1文字以上）
- `createInitialGoals()`を呼び出し
- 成功時は200レスポンス、エラー時は適切なステータスコードを返す

**種別**: Server Component（API Route）

**依存関係**:
- `lib/auth/server.ts`の`getUser()`
- `lib/db.ts`の`createInitialGoals()`

**エラーハンドリング**:
- 未認証の場合は401エラー
- バリデーションエラーの場合は400エラー
- データベースエラーの場合は500エラー

### 5. ミドルウェアの変更（既存ファイル変更）

#### `middleware.ts`（変更）

**変更内容**:
1. ログイン後、目標未設定の場合は`/onboarding`へリダイレクト
2. `/onboarding`は認証必須だが、目標未設定でもアクセス可能
3. 目標設定済みのユーザーが`/onboarding`にアクセスした場合は`/`へリダイレクト

**ロジックフロー**:
```
1. 認証チェック（既存）
   ↓
2. 未認証の場合: /login へリダイレクト（既存）
   ↓
3. 認証済みの場合:
   a. /onboarding にアクセス中の場合
      - 目標設定済み → / へリダイレクト
      - 目標未設定 → そのまま /onboarding を表示
   b. /onboarding 以外にアクセス中の場合
      - 目標未設定 → /onboarding へリダイレクト
      - 目標設定済み → そのまま表示
```

**注意**:
- リダイレクトループを防ぐため、条件分岐を慎重に設計
- `/onboarding`へのアクセス時は目標チェックを行い、設定済みなら`/`へリダイレクト
- `/onboarding`以外へのアクセス時は目標チェックを行い、未設定なら`/onboarding`へリダイレクト

## 実装手順

### ステップ1: データモデルの確認と修正

1. `goal_history_slots`テーブルの`change_reason`に`initial`が含まれているか確認
   - マイグレーションファイルを読む
2. 含まれていない場合はマイグレーションを追加
   - `ALTER TYPE`で`initial`を追加
   - `npx supabase db push`で反映

### ステップ2: データベース関数の追加

1. `lib/db.ts`に`hasGoals()`を追加
2. `lib/db.ts`に`createInitialGoals()`を追加
3. エラーハンドリングを適切に実装
4. TypeScript型定義を確認

### ステップ3: API Routeの作成

1. `app/api/goals/initial/route.ts`を作成
2. POSTハンドラーを実装
3. `getUser()`で認証チェック
4. `createInitialGoals()`を呼び出し
5. エラーハンドリングを実装

### ステップ4: 初期目標設定画面の作成

1. `app/onboarding/page.tsx`を作成
2. フォームUIを実装
3. バリデーションロジックを実装
4. API呼び出し処理を実装
5. ローディング状態を実装

### ステップ5: ミドルウェアの変更

1. `middleware.ts`を編集
2. 目標の有無チェックロジックを追加（`hasGoals()`を使用）
3. リダイレクトロジックを追加
4. リダイレクトループを防ぐ条件分岐を実装

### ステップ6: 動作確認

1. 新規ユーザーでサインアップ
2. ログイン後、`/onboarding`に自動遷移するか確認
3. 3つの目標を入力して保存
4. ホーム画面へ遷移するか確認
5. 再度ログインして、`/onboarding`に遷移しないことを確認
6. 既存ユーザー（目標設定済み）でログインして、ホーム画面に直接遷移することを確認

## 想定される影響範囲

### 直接影響を受ける画面

- **新規**: 初期目標設定画面（`/onboarding`）
- **変更**: ミドルウェア（リダイレクトロジックが追加される）

### データベースへの影響

- `goal_history_slots`テーブルの`change_reason`に`initial`が追加される可能性
- 新規ユーザーの目標データが作成される

### 既存機能への影響

- 既存のログインフローに目標チェックが追加される
- 目標未設定のユーザーは`/onboarding`へリダイレクトされる
- **既存画面（ホーム、日報など）のユーザーID問題は次のフェーズで対応**

## テスト方針

### 手動テスト

1. **初回ログインフロー**
   - 正常系: 新規ユーザーでサインアップ→ログイン→自動的に`/onboarding`へ遷移
   - 正常系: 3つの目標を入力して保存→ホーム画面へ遷移
   - 異常系: 目標を1つだけ入力した状態では保存ボタンが無効
   - 異常系: 空の目標では保存できない

2. **2回目以降のログイン**
   - 正常系: 目標設定済みのユーザーでログイン→ホーム画面へ遷移
   - 異常系: 目標設定済みのユーザーが`/onboarding`にアクセス→ホーム画面へリダイレクト

3. **エラーハンドリング**
   - 異常系: 未認証で`/onboarding`にアクセス→ログイン画面へリダイレクト
   - 異常系: API呼び出し失敗時にエラーメッセージを表示

### 確認項目

- [ ] `change_reason`に`initial`が追加されている
- [ ] `hasGoals()`が正しく動作する
- [ ] `createInitialGoals()`が3つの目標と初期スロットを作成する
- [ ] `/onboarding`画面が正しく表示される
- [ ] フォームのバリデーションが動作する
- [ ] API呼び出しが成功する
- [ ] 保存後にホーム画面へリダイレクトされる
- [ ] ミドルウェアのリダイレクトが正しく動作する
- [ ] リダイレクトループが発生しない

## セキュリティ考慮事項

1. **ユーザーIDの取得**
   - サーバーサイドで`getUser()`を使用し、クライアント側から渡されたユーザーIDは信頼しない
   - API RouteでログインチェックとユーザーID取得を実施

2. **データアクセス制御**
   - すべてのデータベースクエリで`user_id`によるフィルタリングを実施

3. **リダイレクトループの防止**
   - ミドルウェアで適切な条件分岐を実装
   - 無限ループに陥らないようテスト

## 実装時の注意事項

1. **Server ComponentとClient Componentの使い分け**
   - 初期目標設定画面はフォーム入力があるため、Client Component
   - API Routeはサーバーサイドで実行
   - ミドルウェアもサーバーサイドで実行

2. **エラーハンドリング**
   - データベースエラーを適切にキャッチしてユーザーに通知
   - エラーメッセージは日本語で分かりやすく表示

3. **リダイレクト処理**
   - ログイン成功後の遷移先を適切に制御
   - 目標未設定の場合は`/onboarding`へ
   - 目標設定済みの場合は`/`へ

4. **ローディング状態の表示**
   - 保存処理中はボタンを無効化
   - ローディングインジケーターを表示

5. **パフォーマンス**
   - ミドルウェアでのデータベースアクセスは最小限に
   - 必要な場合のみ目標の有無をチェック

## 次のフェーズ

このフェーズが完了したら、次のフェーズとして以下を実装します：

1. **ホーム画面のユーザーID修正**
   - `app/page.tsx`で`getUser()`を使用
   - 実際のユーザーIDを`lib/db.ts`の関数に渡す

2. **日報記録画面のユーザーID修正**
   - `app/record/page.tsx`で同様の修正

3. **その他の画面のユーザーID修正**
   - カレンダー、設定、目標変遷など

## 参考資料

- [docs/requirements.md](./requirements.md) - 要件定義書
- [docs/auth-implementation-plan.md](./auth-implementation-plan.md) - 認証機能実装計画
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
