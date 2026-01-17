-- goal_level_historyテーブルの作成
CREATE TABLE IF NOT EXISTS public.goal_level_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('bronze', 'silver', 'gold')),
  level INTEGER NOT NULL CHECK (level >= 1),
  goal_content TEXT NOT NULL CHECK (char_length(goal_content) >= 1 AND char_length(goal_content) <= 500),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  change_reason TEXT NOT NULL CHECK (change_reason IN ('initial', 'level_up', 'level_down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT valid_date_range CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX idx_goal_level_history_user_id ON public.goal_level_history(user_id);
CREATE INDEX idx_goal_level_history_dates ON public.goal_level_history(user_id, started_at, ended_at);

-- RLS（Row Level Security）の有効化
ALTER TABLE public.goal_level_history ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分のデータのみ閲覧可能
CREATE POLICY "Users can view their own goal level history"
  ON public.goal_level_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のデータのみ挿入可能
CREATE POLICY "Users can insert their own goal level history"
  ON public.goal_level_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のデータのみ更新可能
CREATE POLICY "Users can update their own goal level history"
  ON public.goal_level_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- トリガー: updated_atの自動更新
CREATE TRIGGER update_goal_level_history_updated_at
  BEFORE UPDATE ON public.goal_level_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- テーブルコメント
COMMENT ON TABLE public.goal_level_history IS '目標レベルの履歴（レベルアップ・ダウンの記録）';
COMMENT ON COLUMN public.goal_level_history.id IS '履歴ID（UUID）';
COMMENT ON COLUMN public.goal_level_history.user_id IS 'ユーザーID（外部キー: auth.users.id）';
COMMENT ON COLUMN public.goal_level_history.goal_type IS '目標タイプ（bronze/silver/gold）';
COMMENT ON COLUMN public.goal_level_history.level IS '目標レベル（Lv.1, Lv.2...）';
COMMENT ON COLUMN public.goal_level_history.goal_content IS '目標内容（1-500文字）';
COMMENT ON COLUMN public.goal_level_history.started_at IS 'この目標レベルが開始された日時';
COMMENT ON COLUMN public.goal_level_history.ended_at IS 'この目標レベルが終了した日時（NULL=現在も継続中）';
COMMENT ON COLUMN public.goal_level_history.change_reason IS '変更理由（initial/level_up/level_down）';
