-- goals.descriptionをNULL許可に変更
-- TODO形式に移行後は、description はnullになる可能性がある
ALTER TABLE "public"."goals" ALTER COLUMN "description" DROP NOT NULL;

-- descriptionのCHECK制約を更新（NULL許可）
ALTER TABLE "public"."goals" DROP CONSTRAINT IF EXISTS "goals_description_check";
ALTER TABLE "public"."goals" ADD CONSTRAINT "goals_description_check"
    CHECK (("description" IS NULL) OR (("char_length"("description") >= 1) AND ("char_length"("description") <= 500)));
