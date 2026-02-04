-- RLS (Row Level Security) ポリシー追加

-- goal_todos
ALTER TABLE "public"."goal_todos" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goal todos" ON "public"."goal_todos"
    FOR SELECT USING (
        "goal_id" IN (SELECT "id" FROM "public"."goals" WHERE "user_id" = auth.uid())
    );

CREATE POLICY "Users can insert own goal todos" ON "public"."goal_todos"
    FOR INSERT WITH CHECK (
        "goal_id" IN (SELECT "id" FROM "public"."goals" WHERE "user_id" = auth.uid())
    );

CREATE POLICY "Users can update own goal todos" ON "public"."goal_todos"
    FOR UPDATE USING (
        "goal_id" IN (SELECT "id" FROM "public"."goals" WHERE "user_id" = auth.uid())
    );

CREATE POLICY "Users can delete own goal todos" ON "public"."goal_todos"
    FOR DELETE USING (
        "goal_id" IN (SELECT "id" FROM "public"."goals" WHERE "user_id" = auth.uid())
    );

-- other_todos
ALTER TABLE "public"."other_todos" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own other todos" ON "public"."other_todos"
    FOR SELECT USING ("user_id" = auth.uid());

CREATE POLICY "Users can insert own other todos" ON "public"."other_todos"
    FOR INSERT WITH CHECK ("user_id" = auth.uid());

CREATE POLICY "Users can update own other todos" ON "public"."other_todos"
    FOR UPDATE USING ("user_id" = auth.uid());

CREATE POLICY "Users can delete own other todos" ON "public"."other_todos"
    FOR DELETE USING ("user_id" = auth.uid());

-- daily_todo_records
ALTER TABLE "public"."daily_todo_records" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily todo records" ON "public"."daily_todo_records"
    FOR SELECT USING (
        "daily_record_id" IN (SELECT "id" FROM "public"."daily_records" WHERE "user_id" = auth.uid())
    );

CREATE POLICY "Users can insert own daily todo records" ON "public"."daily_todo_records"
    FOR INSERT WITH CHECK (
        "daily_record_id" IN (SELECT "id" FROM "public"."daily_records" WHERE "user_id" = auth.uid())
    );

CREATE POLICY "Users can update own daily todo records" ON "public"."daily_todo_records"
    FOR UPDATE USING (
        "daily_record_id" IN (SELECT "id" FROM "public"."daily_records" WHERE "user_id" = auth.uid())
    );
