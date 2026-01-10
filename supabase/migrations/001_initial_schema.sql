-- ====================================
-- 学習管理アプリケーション データベーススキーマ
-- ====================================
-- 作成日: 2026-01-10
-- 説明: MVP版のデータベーススキーマ定義
-- 参照: docs/data-model.md

-- ====================================
-- 1. User Settings テーブル
-- ====================================
-- Supabase Auth (auth.users) を使用するため、追加設定のみを管理
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_settings IS 'ユーザーの追加設定情報（Supabase Auth と連携）';
COMMENT ON COLUMN user_settings.id IS 'ユーザーID（auth.users.id への外部キー）';
COMMENT ON COLUMN user_settings.created_at IS 'アカウント作成日時';
COMMENT ON COLUMN user_settings.updated_at IS '最終更新日時';

-- 1. ダミーユーザーを auth.users に作成
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  'test@example.com', 
  crypt('password123', gen_salt('bf')), -- ダミーパスワード
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  'authenticated',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 2. Goals テーブル
-- ====================================
-- Bronze/Silver/Gold の3レベルの目標を管理
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('bronze', 'silver', 'gold')),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_level UNIQUE(user_id, level)
);

COMMENT ON TABLE goals IS 'ユーザーの目標管理（Bronze/Silver/Gold）';
COMMENT ON COLUMN goals.id IS '目標ID（UUID）';
COMMENT ON COLUMN goals.user_id IS 'ユーザーID（外部キー: auth.users.id）';
COMMENT ON COLUMN goals.level IS '目標レベル（bronze/silver/gold）';
COMMENT ON COLUMN goals.description IS '目標内容（1-500文字）';
COMMENT ON CONSTRAINT unique_user_level ON goals IS '1ユーザーにつき各レベル1つずつの目標';

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_level ON goals(user_id, level);

-- ====================================
-- 3. Daily Records テーブル
-- ====================================
-- 毎日の学習内容と達成レベルを記録
CREATE TABLE IF NOT EXISTS daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  achievement_level TEXT NOT NULL DEFAULT 'none' CHECK (achievement_level IN ('none', 'bronze', 'silver', 'gold')),
  do_text TEXT CHECK (do_text IS NULL OR char_length(do_text) <= 5000),
  journal_text TEXT CHECK (journal_text IS NULL OR char_length(journal_text) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE(user_id, date)
);

COMMENT ON TABLE daily_records IS '日次の学習記録';
COMMENT ON COLUMN daily_records.id IS '記録ID（UUID）';
COMMENT ON COLUMN daily_records.user_id IS 'ユーザーID（外部キー: auth.users.id）';
COMMENT ON COLUMN daily_records.date IS '記録日（YYYY-MM-DD形式）';
COMMENT ON COLUMN daily_records.achievement_level IS '達成レベル（none/bronze/silver/gold）';
COMMENT ON COLUMN daily_records.do_text IS '学習内容サマリー（箇条書き形式、最大5000文字）';
COMMENT ON COLUMN daily_records.journal_text IS '自由記述・日報（最大5000文字）';
COMMENT ON CONSTRAINT unique_user_date ON daily_records IS '1ユーザーにつき1日1レコードのみ';

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_daily_records_user_id ON daily_records(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_user_date ON daily_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date DESC);

-- ====================================
-- 4. Streaks テーブル
-- ====================================
-- 連続記録日数を管理
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_recorded_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_streak UNIQUE(user_id)
);

COMMENT ON TABLE streaks IS 'ストリーク（連続記録日数）情報';
COMMENT ON COLUMN streaks.id IS 'ストリークID（UUID）';
COMMENT ON COLUMN streaks.user_id IS 'ユーザーID（外部キー: auth.users.id）';
COMMENT ON COLUMN streaks.current_streak IS '現在の連続日数（0以上）';
COMMENT ON COLUMN streaks.longest_streak IS '過去最高連続日数（0以上）';
COMMENT ON COLUMN streaks.last_recorded_date IS '最後に記録した日（YYYY-MM-DD形式）';
COMMENT ON CONSTRAINT unique_user_streak ON streaks IS '1ユーザーにつき1つのストリーク情報';

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);

-- ====================================
-- 5. Goal History Slots テーブル
-- ====================================
-- 目標変遷履歴（レベルアップ/ダウン時の目標保存用）
CREATE TABLE IF NOT EXISTS goal_history_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bronze_goal TEXT NOT NULL CHECK (char_length(bronze_goal) BETWEEN 1 AND 500),
  silver_goal TEXT NOT NULL CHECK (char_length(silver_goal) BETWEEN 1 AND 500),
  gold_goal TEXT NOT NULL CHECK (char_length(gold_goal) BETWEEN 1 AND 500),
  start_date DATE NOT NULL,
  end_date DATE,
  change_reason TEXT NOT NULL CHECK (change_reason IN ('initial', 'bronze_14days', 'silver_14days', 'gold_14days', 'level_down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

COMMENT ON TABLE goal_history_slots IS '目標変遷履歴（レベルアップ/ダウン時の目標セット保存）';
COMMENT ON COLUMN goal_history_slots.id IS '履歴ID（UUID）';
COMMENT ON COLUMN goal_history_slots.user_id IS 'ユーザーID（外部キー: auth.users.id）';
COMMENT ON COLUMN goal_history_slots.bronze_goal IS 'Bronze目標の内容（1-500文字）';
COMMENT ON COLUMN goal_history_slots.silver_goal IS 'Silver目標の内容（1-500文字）';
COMMENT ON COLUMN goal_history_slots.gold_goal IS 'Gold目標の内容（1-500文字）';
COMMENT ON COLUMN goal_history_slots.start_date IS '目標セットの開始日';
COMMENT ON COLUMN goal_history_slots.end_date IS '目標セットの終了日（NULL=現在進行中）';
COMMENT ON COLUMN goal_history_slots.change_reason IS '変更理由（initial/bronze_14days/silver_14days/gold_14days/level_down）';
COMMENT ON CONSTRAINT valid_date_range ON goal_history_slots IS '終了日は開始日以降でなければならない';

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_goal_history_slots_user_id ON goal_history_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_history_slots_user_dates ON goal_history_slots(user_id, start_date DESC, end_date DESC);

-- ====================================
-- 6. 自動更新トリガー（updated_at）
-- ====================================
-- updated_at を自動更新する共通関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'updated_atカラムを自動更新するトリガー関数';

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_records_updated_at
  BEFORE UPDATE ON daily_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_history_slots_updated_at
  BEFORE UPDATE ON goal_history_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 7. RLS（Row Level Security）ポリシー
-- ====================================
-- 注意: MVP版では認証機能を実装していないため、一旦RLSを無効化
-- 将来的にSupabase Authを実装する際に有効化する

-- RLSを有効化（後で使用）
-- ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE goal_history_slots ENABLE ROW LEVEL SECURITY;

-- 例: 認証ユーザーのみ自分のデータにアクセス可能
-- CREATE POLICY "Users can view their own data" ON user_settings
--   FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Users can update their own data" ON user_settings
--   FOR UPDATE USING (auth.uid() = id);

-- （他のテーブルにも同様のポリシーを設定）

-- ====================================
-- 8. 初期データ挿入（開発・テスト用）
-- ====================================
-- MOCK_USER_ID用のテストデータ

-- 注意: 実際の運用では auth.users にユーザーが存在する必要があります
-- 開発時は手動でauth.usersにMOCK_USER_IDを作成するか、
-- Supabase AuthのSignup機能を使用してください

-- User Settings（MOCK_USER_ID用）
INSERT INTO user_settings (id, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, '2025-01-01 00:00:00+00', NOW())
ON CONFLICT (id) DO NOTHING;

-- Goals（Bronze/Silver/Gold）
INSERT INTO goals (id, user_id, level, description, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, 'bronze', '30分だけプログラミングする', '2025-01-01 00:00:00+00', '2025-01-01 00:00:00+00'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, 'silver', '1つの機能を完成させる', '2025-01-01 00:00:00+00', '2025-01-01 00:00:00+00'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, 'gold', 'リファクタリングまで完了させる', '2025-01-01 00:00:00+00', '2025-01-01 00:00:00+00')
ON CONFLICT (user_id, level) DO NOTHING;

-- Daily Records（過去14日分のBronze連続達成データ）
INSERT INTO daily_records (id, user_id, date, achievement_level, do_text, journal_text, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '14 days', 'bronze', 'Next.jsの基礎を30分学習
TypeScriptの型定義を復習', '30分だけだったけど、続けることが大事。', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '14 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '13 days', 'bronze', 'Reactのコンポーネント設計を学習', '少しずつ理解が深まってきた。', CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE - INTERVAL '13 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '12 days', 'bronze', 'CSSの基礎復習', 'Flexboxが少し分かってきた。', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE - INTERVAL '12 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '11 days', 'bronze', 'JavaScriptの非同期処理を学習', 'async/awaitの使い方が分かった。', CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE - INTERVAL '11 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '10 days', 'bronze', 'データベースの基礎を学習', 'SQLの基本が理解できた。', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '9 days', 'bronze', 'APIの設計について学習', 'RESTfulな設計の重要性が分かった。', CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE - INTERVAL '9 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '8 days', 'bronze', 'Git/GitHubの使い方を復習', 'ブランチの使い方が理解できた。', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '8 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '7 days', 'bronze', 'コードレビューの観点を学習', '他人のコードを読む練習になった。', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '7 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '6 days', 'bronze', 'テストコードの書き方を学習', 'Jestの基本的な使い方が分かった。', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '6 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '5 days', 'bronze', 'パフォーマンス最適化について学習', '遅延読み込みの重要性が理解できた。', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '4 days', 'bronze', 'セキュリティの基礎を学習', 'XSS対策の重要性が分かった。', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE - INTERVAL '4 days'),
  ('00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '3 days', 'bronze', 'アクセシビリティについて学習', 'WAI-ARIAの基本が理解できた。', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000013'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '2 days', 'bronze', 'デプロイ方法について学習', 'Vercelの使い方が分かった。', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '1 day', 'bronze', 'モニタリング・ログ管理について学習', '14日連続達成！少しずつ成長している。', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT (user_id, date) DO NOTHING;

-- Streak（14日連続達成中）
INSERT INTO streaks (id, user_id, current_streak, longest_streak, last_recorded_date, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000021'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 14, 14, CURRENT_DATE - INTERVAL '1 day', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Goal History Slots（目標変遷履歴の例）
INSERT INTO goal_history_slots (id, user_id, bronze_goal, silver_goal, gold_goal, start_date, end_date, change_reason, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000031'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '毎日30分プログラミングする', '1つの機能を完成させる', 'リファクタリングまで完了させる', '2026-01-01', '2026-01-14', 'initial', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  ('00000000-0000-0000-0000-000000000032'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '毎日1時間プログラミングする', '2つの機能を完成させる', 'テストコードも書く', '2026-01-15', NULL, 'bronze_14days', '2026-01-15 00:00:00+00', '2026-01-15 00:00:00+00')
ON CONFLICT DO NOTHING;

-- ====================================
-- 9. 便利なビュー（オプション）
-- ====================================
-- 日次記録と目標を結合したビュー（将来的に使用可能）
CREATE OR REPLACE VIEW daily_records_with_goals AS
SELECT
  dr.id,
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
FROM daily_records dr
LEFT JOIN goals gb ON dr.user_id = gb.user_id AND gb.level = 'bronze'
LEFT JOIN goals gs ON dr.user_id = gs.user_id AND gs.level = 'silver'
LEFT JOIN goals gg ON dr.user_id = gg.user_id AND gg.level = 'gold';

COMMENT ON VIEW daily_records_with_goals IS '日次記録とその時点の目標を結合したビュー';

-- ====================================
-- スキーマ作成完了
-- ====================================
-- 次の手順:
-- 1. Supabaseダッシュボードの SQL Editor でこのファイルを実行
-- 2. auth.users に MOCK_USER_ID を手動で追加（または Signup機能を使用）
-- 3. lib/supabase/client.ts を作成して接続設定
-- 4. lib/db.ts を Supabase対応に書き換え
