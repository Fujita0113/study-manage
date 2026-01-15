-- streaksテーブルを削除

-- 関連するトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS update_streaks_updated_at ON public.streaks;

-- テーブルを削除
DROP TABLE IF EXISTS public.streaks;
