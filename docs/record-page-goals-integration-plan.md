# 日報登録画面（/record）目標表示修正計画

## 作業概要

日報登録画面（/record）の「目標達成度」セクションで、現在ハードコードされているExample値（'30分だけ座る', '1機能完成', 'リファクタまで完了'）を、goalsテーブルから取得した実際の目標内容に置き換える。

## 問題点の詳細

### 現状

[app/record/page.tsx:121-125](app/record/page.tsx#L121-L125)にて、目標達成度のExampleがハードコードされている：

```typescript
const labels = {
  bronze: { main: '最低限', example: '30分だけ座る' },
  silver: { main: '計画通り', example: '1機能完成' },
  gold: { main: '期待以上', example: 'リファクタまで完了' }
};
```

### 期待される動作

- Bronze目標の「example」に、goalsテーブルのbronze_goalの値を表示
- Silver目標の「example」に、goalsテーブルのsilver_goalの値を表示
- Gold目標の「example」に、goalsテーブルのgold_goalの値を表示

## 技術調査結果

### 使用する主要モジュールとバージョン

- **Next.js**: 16.1.1
- **React**: 19.2.3
- **@supabase/supabase-js**: ^2.90.1
- **@supabase/ssr**: ^0.8.0

### 既存のデータベース構造

#### goalsテーブル

- `id`: UUID
- `user_id`: UUID（外部キー）
- `level`: 'bronze' | 'silver' | 'gold'
- `description`: string（目標内容）
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

#### daily_records_with_goalsビュー

Supabaseに既に作成されているビューで、daily_recordsとgoalsテーブルをJOINしたもの：

```sql
SELECT dr.id,
    dr.user_id,
    dr.date,
    dr.achievement_level,
    dr.do_text,
    dr.journal_text,
    dr.created_at,
    dr.updated_at,
    gb.description AS bronze_goal,
    gs.description AS silver_goal,
    gg.description AS gold_goal
FROM (((public.daily_records dr
    LEFT JOIN public.goals gb ON (((dr.user_id = gb.user_id) AND (gb.level = 'bronze'::text))))
    LEFT JOIN public.goals gs ON (((dr.user_id = gs.user_id) AND (gs.level = 'silver'::text))))
    LEFT JOIN public.goals gg ON (((dr.user_id = gg.user_id) AND (gg.level = 'gold'::text))));
```

### 既存のAPI

#### GET /api/goals

- 現在のユーザーの全目標（Bronze/Silver/Gold）を取得
- [app/api/goals/route.ts:9-20](app/api/goals/route.ts#L9-L20)で実装済み
- `lib/db.ts`の`getGoals()`関数を使用

## 実装計画

### 変更が必要なファイル

1. **[app/record/page.tsx](app/record/page.tsx)** - メインの修正対象

### 実装手順

#### ステップ1: 目標データの取得ロジックを追加

`app/record/page.tsx`の`useEffect`内で、既存の日次記録取得処理に加えて、目標データを取得する：

```typescript
// 新規追加: 目標データの状態管理
const [goals, setGoals] = useState<{
  bronze: string;
  silver: string;
  gold: string;
}>({
  bronze: '30分だけ座る', // デフォルト値（目標未設定時用）
  silver: '1機能完成',
  gold: 'リファクタまで完了'
});

// useEffect内に目標取得処理を追加
useEffect(() => {
  async function loadData() {
    try {
      // 既存の記録チェック処理...

      // 目標データを取得
      const goalsResponse = await fetch('/api/goals');
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        setGoals({
          bronze: goalsData.bronze?.description || '30分だけ座る',
          silver: goalsData.silver?.description || '1機能完成',
          gold: goalsData.gold?.description || 'リファクタまで完了'
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  }

  loadData();
}, [today, router]);
```

#### ステップ2: レンダリング部分の修正

ハードコードされたlabelsオブジェクトを、状態管理されたgoalsデータを使用するように変更：

```typescript
// Before (121-125行目)
const labels = {
  bronze: { main: '最低限', example: '30分だけ座る' },
  silver: { main: '計画通り', example: '1機能完成' },
  gold: { main: '期待以上', example: 'リファクタまで完了' }
};

// After
const labels = {
  bronze: { main: '最低限', example: goals.bronze },
  silver: { main: '計画通り', example: goals.silver },
  gold: { main: '期待以上', example: goals.gold }
};
```

### エラーハンドリング

1. **目標が設定されていない場合**: デフォルト値を表示
2. **API取得失敗時**: デフォルト値を表示し、コンソールにエラーログを出力
3. **ローディング中**: 既存のローディング表示を使用

### 影響範囲

- **変更ファイル**: [app/record/page.tsx](app/record/page.tsx)のみ
- **データベース**: 変更なし（既存のgoalsテーブルとdaily_records_with_goalsビューを使用）
- **API**: 既存の`GET /api/goals`を使用（変更なし）
- **型定義**: 既存の`Goal`型を使用（[types/index.ts](types/index.ts)）

## テスト方針

### 手動テスト項目

1. **正常系**
   - [ ] 目標が設定されている状態で/recordにアクセスし、各レベルのExampleに実際の目標内容が表示されることを確認
   - [ ] Bronze/Silver/Goldそれぞれの目標内容が正しく表示されることを確認

2. **異常系**
   - [ ] 目標が未設定の状態で/recordにアクセスし、デフォルト値が表示されることを確認
   - [ ] ネットワークエラー時にデフォルト値が表示されることを確認

3. **統合テスト**
   - [ ] 目標編集画面で目標を変更後、/recordページで新しい目標が反映されることを確認
   - [ ] ページリロード後も正しい目標が表示されることを確認

## 備考

### なぜdaily_records_with_goalsビューを使わないか

日報登録画面では「まだ記録を作成していない」段階であり、`daily_records`テーブルにレコードが存在しない。そのため、daily_recordsを起点とした`daily_records_with_goals`ビューではなく、直接`goals`テーブルから取得する必要がある。

### 既存のgetGoals関数の利用

`lib/db.ts`に既に`getGoals()`関数が実装されており、`GET /api/goals`エンドポイントで利用可能。この既存のインフラストラクチャを活用することで、実装をシンプルに保つ。
