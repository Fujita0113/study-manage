-- Goal Change Memo テーブル
CREATE TABLE IF NOT EXISTS public.goal_change_memo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goal_change_memo_user_week ON public.goal_change_memo(user_id, week_start_date);

-- Weekly Review Access Log テーブル
CREATE TABLE IF NOT EXISTS public.weekly_review_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  edit_unlock_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_review_access_log_user ON public.weekly_review_access_log(user_id);

-- Goal Change Log テーブル
CREATE TABLE IF NOT EXISTS public.goal_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('bronze', 'silver', 'gold')),
  old_content TEXT NOT NULL,
  new_content TEXT NOT NULL,
  change_reason TEXT NOT NULL CHECK (char_length(change_reason) >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goal_change_log_user_type ON public.goal_change_log(user_id, goal_type);

-- RLSの有効化
ALTER TABLE public.goal_change_memo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_review_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_change_log ENABLE ROW LEVEL SECURITY;

-- goal_change_memo ポリシー
CREATE POLICY "Users can manage their own goal change memos"
  ON public.goal_change_memo
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- weekly_review_access_log ポリシー
CREATE POLICY "Users can manage their own weekly review access logs"
  ON public.weekly_review_access_log
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- goal_change_log ポリシー
CREATE POLICY "Users can manage their own goal change logs"
  ON public.goal_change_log
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
