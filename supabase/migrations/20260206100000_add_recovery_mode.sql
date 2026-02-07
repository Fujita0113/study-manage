    -- リカバリーモード機能のためのスキーマ変更

-- 1. user_settings テーブルにRecovery関連カラムを追加
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS recovery_goal TEXT,
ADD COLUMN IF NOT EXISTS recovery_mode_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recovery_mode_activated_date DATE;

-- 2. daily_records テーブルにRecovery達成フラグを追加
ALTER TABLE daily_records
ADD COLUMN IF NOT EXISTS recovery_achieved BOOLEAN DEFAULT FALSE;

-- 3. goal_level_history テーブルにRecovery目標を追加（履歴管理用）
ALTER TABLE goal_level_history
ADD COLUMN IF NOT EXISTS recovery_goal TEXT;

-- インデックス追加（リカバリーモード状態の検索用）
CREATE INDEX IF NOT EXISTS idx_user_settings_recovery_mode
ON user_settings(id)
WHERE recovery_mode_active = TRUE;

-- daily_records のRecovery達成フラグ検索用インデックス
CREATE INDEX IF NOT EXISTS idx_daily_records_recovery
ON daily_records(user_id, date)
WHERE recovery_achieved = TRUE;

-- コメント追加
COMMENT ON COLUMN user_settings.recovery_goal IS 'リカバリーモードの目標（例：サウナに行く）';
COMMENT ON COLUMN user_settings.recovery_mode_active IS 'リカバリーモードが現在有効かどうか';
COMMENT ON COLUMN user_settings.recovery_mode_activated_date IS 'リカバリーモードが起動された日付';
COMMENT ON COLUMN daily_records.recovery_achieved IS 'リカバリーモードの目標を達成したかどうか';
COMMENT ON COLUMN goal_level_history.recovery_goal IS 'この期間のリカバリー目標';
