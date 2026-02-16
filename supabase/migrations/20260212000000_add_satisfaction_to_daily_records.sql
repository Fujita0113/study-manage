-- daily_records テーブルに満足度評価カラムを追加
-- 1〜5の整数値（NULL許容）
ALTER TABLE daily_records
  ADD COLUMN satisfaction INTEGER CHECK (satisfaction >= 1 AND satisfaction <= 5);
