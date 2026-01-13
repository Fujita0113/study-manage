


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_updated_at_column"() IS 'updated_atカラムを自動更新するトリガー関数';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."daily_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "achievement_level" "text" DEFAULT 'none'::"text" NOT NULL,
    "do_text" "text",
    "journal_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "daily_records_achievement_level_check" CHECK (("achievement_level" = ANY (ARRAY['none'::"text", 'bronze'::"text", 'silver'::"text", 'gold'::"text"]))),
    CONSTRAINT "daily_records_do_text_check" CHECK ((("do_text" IS NULL) OR ("char_length"("do_text") <= 5000))),
    CONSTRAINT "daily_records_journal_text_check" CHECK ((("journal_text" IS NULL) OR ("char_length"("journal_text") <= 5000)))
);


ALTER TABLE "public"."daily_records" OWNER TO "postgres";


COMMENT ON TABLE "public"."daily_records" IS '日次の学習記録';



COMMENT ON COLUMN "public"."daily_records"."id" IS '記録ID（UUID）';



COMMENT ON COLUMN "public"."daily_records"."user_id" IS 'ユーザーID（外部キー: auth.users.id）';



COMMENT ON COLUMN "public"."daily_records"."date" IS '記録日（YYYY-MM-DD形式）';



COMMENT ON COLUMN "public"."daily_records"."achievement_level" IS '達成レベル（none/bronze/silver/gold）';



COMMENT ON COLUMN "public"."daily_records"."do_text" IS '学習内容サマリー（箇条書き形式、最大5000文字）';



COMMENT ON COLUMN "public"."daily_records"."journal_text" IS '自由記述・日報（最大5000文字）';



CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "level" "text" NOT NULL,
    "description" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "goals_description_check" CHECK ((("char_length"("description") >= 1) AND ("char_length"("description") <= 500))),
    CONSTRAINT "goals_level_check" CHECK (("level" = ANY (ARRAY['bronze'::"text", 'silver'::"text", 'gold'::"text"])))
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


COMMENT ON TABLE "public"."goals" IS 'ユーザーの目標管理（Bronze/Silver/Gold）';



COMMENT ON COLUMN "public"."goals"."id" IS '目標ID（UUID）';



COMMENT ON COLUMN "public"."goals"."user_id" IS 'ユーザーID（外部キー: auth.users.id）';



COMMENT ON COLUMN "public"."goals"."level" IS '目標レベル（bronze/silver/gold）';



COMMENT ON COLUMN "public"."goals"."description" IS '目標内容（1-500文字）';



CREATE OR REPLACE VIEW "public"."daily_records_with_goals" AS
 SELECT "dr"."id",
    "dr"."user_id",
    "dr"."date",
    "dr"."achievement_level",
    "dr"."do_text",
    "dr"."journal_text",
    "dr"."created_at",
    "dr"."updated_at",
    "gb"."description" AS "bronze_goal",
    "gs"."description" AS "silver_goal",
    "gg"."description" AS "gold_goal"
   FROM ((("public"."daily_records" "dr"
     LEFT JOIN "public"."goals" "gb" ON ((("dr"."user_id" = "gb"."user_id") AND ("gb"."level" = 'bronze'::"text"))))
     LEFT JOIN "public"."goals" "gs" ON ((("dr"."user_id" = "gs"."user_id") AND ("gs"."level" = 'silver'::"text"))))
     LEFT JOIN "public"."goals" "gg" ON ((("dr"."user_id" = "gg"."user_id") AND ("gg"."level" = 'gold'::"text"))));


ALTER VIEW "public"."daily_records_with_goals" OWNER TO "postgres";


COMMENT ON VIEW "public"."daily_records_with_goals" IS '日次記録とその時点の目標を結合したビュー';



CREATE TABLE IF NOT EXISTS "public"."goal_history_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bronze_goal" "text" NOT NULL,
    "silver_goal" "text" NOT NULL,
    "gold_goal" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "change_reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "goal_history_slots_bronze_goal_check" CHECK ((("char_length"("bronze_goal") >= 1) AND ("char_length"("bronze_goal") <= 500))),
    CONSTRAINT "goal_history_slots_change_reason_check" CHECK (("change_reason" = ANY (ARRAY['initial'::"text", 'bronze_14days'::"text", 'silver_14days'::"text", 'gold_14days'::"text", 'level_down'::"text"]))),
    CONSTRAINT "goal_history_slots_gold_goal_check" CHECK ((("char_length"("gold_goal") >= 1) AND ("char_length"("gold_goal") <= 500))),
    CONSTRAINT "goal_history_slots_silver_goal_check" CHECK ((("char_length"("silver_goal") >= 1) AND ("char_length"("silver_goal") <= 500))),
    CONSTRAINT "valid_date_range" CHECK ((("end_date" IS NULL) OR ("end_date" >= "start_date")))
);


ALTER TABLE "public"."goal_history_slots" OWNER TO "postgres";


COMMENT ON TABLE "public"."goal_history_slots" IS '目標変遷履歴（レベルアップ/ダウン時の目標セット保存）';



COMMENT ON COLUMN "public"."goal_history_slots"."id" IS '履歴ID（UUID）';



COMMENT ON COLUMN "public"."goal_history_slots"."user_id" IS 'ユーザーID（外部キー: auth.users.id）';



COMMENT ON COLUMN "public"."goal_history_slots"."bronze_goal" IS 'Bronze目標の内容（1-500文字）';



COMMENT ON COLUMN "public"."goal_history_slots"."silver_goal" IS 'Silver目標の内容（1-500文字）';



COMMENT ON COLUMN "public"."goal_history_slots"."gold_goal" IS 'Gold目標の内容（1-500文字）';



COMMENT ON COLUMN "public"."goal_history_slots"."start_date" IS '目標セットの開始日';



COMMENT ON COLUMN "public"."goal_history_slots"."end_date" IS '目標セットの終了日（NULL=現在進行中）';



COMMENT ON COLUMN "public"."goal_history_slots"."change_reason" IS '変更理由（initial/bronze_14days/silver_14days/gold_14days/level_down）';



COMMENT ON CONSTRAINT "valid_date_range" ON "public"."goal_history_slots" IS '終了日は開始日以降でなければならない';



CREATE TABLE IF NOT EXISTS "public"."streaks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "longest_streak" integer DEFAULT 0 NOT NULL,
    "last_recorded_date" "date",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "streaks_current_streak_check" CHECK (("current_streak" >= 0)),
    CONSTRAINT "streaks_longest_streak_check" CHECK (("longest_streak" >= 0))
);


ALTER TABLE "public"."streaks" OWNER TO "postgres";


COMMENT ON TABLE "public"."streaks" IS 'ストリーク（連続記録日数）情報';



COMMENT ON COLUMN "public"."streaks"."id" IS 'ストリークID（UUID）';



COMMENT ON COLUMN "public"."streaks"."user_id" IS 'ユーザーID（外部キー: auth.users.id）';



COMMENT ON COLUMN "public"."streaks"."current_streak" IS '現在の連続日数（0以上）';



COMMENT ON COLUMN "public"."streaks"."longest_streak" IS '過去最高連続日数（0以上）';



COMMENT ON COLUMN "public"."streaks"."last_recorded_date" IS '最後に記録した日（YYYY-MM-DD形式）';



CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_settings" IS 'ユーザーの追加設定情報（Supabase Auth と連携）';



COMMENT ON COLUMN "public"."user_settings"."id" IS 'ユーザーID（auth.users.id への外部キー）';



COMMENT ON COLUMN "public"."user_settings"."created_at" IS 'アカウント作成日時';



COMMENT ON COLUMN "public"."user_settings"."updated_at" IS '最終更新日時';



ALTER TABLE ONLY "public"."daily_records"
    ADD CONSTRAINT "daily_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_history_slots"
    ADD CONSTRAINT "goal_history_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "streaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_records"
    ADD CONSTRAINT "unique_user_date" UNIQUE ("user_id", "date");



COMMENT ON CONSTRAINT "unique_user_date" ON "public"."daily_records" IS '1ユーザーにつき1日1レコードのみ';



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "unique_user_level" UNIQUE ("user_id", "level");



COMMENT ON CONSTRAINT "unique_user_level" ON "public"."goals" IS '1ユーザーにつき各レベル1つずつの目標';



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "unique_user_streak" UNIQUE ("user_id");



COMMENT ON CONSTRAINT "unique_user_streak" ON "public"."streaks" IS '1ユーザーにつき1つのストリーク情報';



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_daily_records_date" ON "public"."daily_records" USING "btree" ("date" DESC);



CREATE INDEX "idx_daily_records_user_date" ON "public"."daily_records" USING "btree" ("user_id", "date" DESC);



CREATE INDEX "idx_daily_records_user_id" ON "public"."daily_records" USING "btree" ("user_id");



CREATE INDEX "idx_goal_history_slots_user_dates" ON "public"."goal_history_slots" USING "btree" ("user_id", "start_date" DESC, "end_date" DESC);



CREATE INDEX "idx_goal_history_slots_user_id" ON "public"."goal_history_slots" USING "btree" ("user_id");



CREATE INDEX "idx_goals_user_id" ON "public"."goals" USING "btree" ("user_id");



CREATE INDEX "idx_goals_user_level" ON "public"."goals" USING "btree" ("user_id", "level");



CREATE INDEX "idx_streaks_user_id" ON "public"."streaks" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_daily_records_updated_at" BEFORE UPDATE ON "public"."daily_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_goal_history_slots_updated_at" BEFORE UPDATE ON "public"."goal_history_slots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_goals_updated_at" BEFORE UPDATE ON "public"."goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_streaks_updated_at" BEFORE UPDATE ON "public"."streaks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."daily_records"
    ADD CONSTRAINT "daily_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_history_slots"
    ADD CONSTRAINT "goal_history_slots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."daily_records" TO "anon";
GRANT ALL ON TABLE "public"."daily_records" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_records" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."daily_records_with_goals" TO "anon";
GRANT ALL ON TABLE "public"."daily_records_with_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_records_with_goals" TO "service_role";



GRANT ALL ON TABLE "public"."goal_history_slots" TO "anon";
GRANT ALL ON TABLE "public"."goal_history_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_history_slots" TO "service_role";



GRANT ALL ON TABLE "public"."streaks" TO "anon";
GRANT ALL ON TABLE "public"."streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."streaks" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































