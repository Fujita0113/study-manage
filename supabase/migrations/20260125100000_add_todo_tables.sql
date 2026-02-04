-- Goal Todos テーブル
-- 各目標(Bronze/Silver/Gold)に紐づくTODOリスト
CREATE TABLE IF NOT EXISTS "public"."goal_todos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "goal_todos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "goal_todos_content_check" CHECK (("char_length"("content") >= 1) AND ("char_length"("content") <= 500)),
    CONSTRAINT "goal_todos_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE
);

COMMENT ON TABLE "public"."goal_todos" IS '目標に紐づくTODOリスト';
COMMENT ON COLUMN "public"."goal_todos"."id" IS 'TODO ID（UUID）';
COMMENT ON COLUMN "public"."goal_todos"."goal_id" IS '目標ID（外部キー: goals.id）';
COMMENT ON COLUMN "public"."goal_todos"."content" IS 'TODO内容（1-500文字）';
COMMENT ON COLUMN "public"."goal_todos"."sort_order" IS '表示順序（0から開始）';

CREATE INDEX "idx_goal_todos_goal_id" ON "public"."goal_todos" USING "btree" ("goal_id");

-- Other Todos テーブル
-- ユーザーの「その他」TODOリスト
CREATE TABLE IF NOT EXISTS "public"."other_todos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_archived" boolean NOT NULL DEFAULT FALSE,
    "last_achieved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "other_todos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "other_todos_content_check" CHECK (("char_length"("content") >= 1) AND ("char_length"("content") <= 500)),
    CONSTRAINT "other_todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

COMMENT ON TABLE "public"."other_todos" IS 'ユーザーのその他TODOリスト';
COMMENT ON COLUMN "public"."other_todos"."id" IS 'TODO ID（UUID）';
COMMENT ON COLUMN "public"."other_todos"."user_id" IS 'ユーザーID（外部キー: auth.users.id）';
COMMENT ON COLUMN "public"."other_todos"."content" IS 'TODO内容（1-500文字）';
COMMENT ON COLUMN "public"."other_todos"."is_archived" IS 'アーカイブ済みフラグ';
COMMENT ON COLUMN "public"."other_todos"."last_achieved_at" IS '最後に達成した日時';

CREATE INDEX "idx_other_todos_user_id" ON "public"."other_todos" USING "btree" ("user_id");
CREATE INDEX "idx_other_todos_user_archived" ON "public"."other_todos" USING "btree" ("user_id", "is_archived");

-- Daily Todo Records テーブル
-- 日次の各TODO達成状況を記録
CREATE TABLE IF NOT EXISTS "public"."daily_todo_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "daily_record_id" "uuid" NOT NULL,
    "todo_type" "text" NOT NULL,
    "todo_id" "uuid" NOT NULL,
    "is_achieved" boolean NOT NULL DEFAULT FALSE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "daily_todo_records_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "daily_todo_records_todo_type_check" CHECK ("todo_type" IN ('goal', 'other')),
    CONSTRAINT "daily_todo_records_unique" UNIQUE ("daily_record_id", "todo_type", "todo_id"),
    CONSTRAINT "daily_todo_records_daily_record_id_fkey" FOREIGN KEY ("daily_record_id") REFERENCES "public"."daily_records"("id") ON DELETE CASCADE
);

COMMENT ON TABLE "public"."daily_todo_records" IS '日次のTODO達成記録';
COMMENT ON COLUMN "public"."daily_todo_records"."id" IS '記録ID（UUID）';
COMMENT ON COLUMN "public"."daily_todo_records"."daily_record_id" IS '日報ID（外部キー: daily_records.id）';
COMMENT ON COLUMN "public"."daily_todo_records"."todo_type" IS 'TODOタイプ（goal/other）';
COMMENT ON COLUMN "public"."daily_todo_records"."todo_id" IS 'TODO ID（goal_todos.idまたはother_todos.id）';
COMMENT ON COLUMN "public"."daily_todo_records"."is_achieved" IS '達成フラグ';

CREATE INDEX "idx_daily_todo_records_daily_record_id" ON "public"."daily_todo_records" USING "btree" ("daily_record_id");

-- updated_atトリガー
CREATE OR REPLACE TRIGGER "update_goal_todos_updated_at"
    BEFORE UPDATE ON "public"."goal_todos"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_other_todos_updated_at"
    BEFORE UPDATE ON "public"."other_todos"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- 権限設定
GRANT ALL ON TABLE "public"."goal_todos" TO "anon";
GRANT ALL ON TABLE "public"."goal_todos" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_todos" TO "service_role";

GRANT ALL ON TABLE "public"."other_todos" TO "anon";
GRANT ALL ON TABLE "public"."other_todos" TO "authenticated";
GRANT ALL ON TABLE "public"."other_todos" TO "service_role";

GRANT ALL ON TABLE "public"."daily_todo_records" TO "anon";
GRANT ALL ON TABLE "public"."daily_todo_records" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_todo_records" TO "service_role";
