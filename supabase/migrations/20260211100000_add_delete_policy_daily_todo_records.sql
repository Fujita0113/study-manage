-- daily_todo_records テーブルにDELETEポリシーを追加
-- DELETEポリシーが欠落していたため、RLS有効時にDELETEが0件になり
-- 再INSERT時にunique制約違反が発生していたバグを修正

CREATE POLICY "Users can delete own daily todo records" ON "public"."daily_todo_records"
    FOR DELETE USING (
        "daily_record_id" IN (SELECT "id" FROM "public"."daily_records" WHERE "user_id" = auth.uid())
    );