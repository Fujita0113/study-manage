-- 既存データの移行
-- goals.description → goal_todos への移行

-- 1. 既存のgoals.descriptionをgoal_todosに移行
-- 各行を分割してTODOとして登録（改行区切りの場合は複数のTODOに分割）
-- まずは単一のTODOとして移行し、ユーザーが後で分割できるようにする
INSERT INTO goal_todos (goal_id, content, sort_order)
SELECT
    id as goal_id,
    description as content,
    0 as sort_order
FROM goals
WHERE description IS NOT NULL AND description != ''
ON CONFLICT DO NOTHING;

-- 2. daily_records.do_textの移行は複雑なため、アプリケーション側で処理
-- do_textは自由形式のテキストで、行ごとにOther Todoに変換する必要がある
-- これはスクリプト（scripts/migrate-do-text.ts）で別途実行する
