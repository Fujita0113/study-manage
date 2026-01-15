drop extension if exists "pg_net";

drop trigger if exists "update_daily_records_updated_at" on "public"."daily_records";

drop trigger if exists "update_goal_history_slots_updated_at" on "public"."goal_history_slots";

drop trigger if exists "update_goals_updated_at" on "public"."goals";

drop trigger if exists "update_streaks_updated_at" on "public"."streaks";

drop trigger if exists "update_user_settings_updated_at" on "public"."user_settings";

create or replace view "public"."daily_records_with_goals" as  SELECT dr.id,
    dr.user_id,
    dr.date,
    dr.achievement_level,
    dr.do_text,
    dr.journal_text,
    dr.created_at,
    dr.updated_at,
    gb.description AS bronze_goal,
    gs.description AS silver_goal,
    gg.description AS gold_goal
   FROM (((public.daily_records dr
     LEFT JOIN public.goals gb ON (((dr.user_id = gb.user_id) AND (gb.level = 'bronze'::text))))
     LEFT JOIN public.goals gs ON (((dr.user_id = gs.user_id) AND (gs.level = 'silver'::text))))
     LEFT JOIN public.goals gg ON (((dr.user_id = gg.user_id) AND (gg.level = 'gold'::text))));


CREATE TRIGGER update_daily_records_updated_at BEFORE UPDATE ON public.daily_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goal_history_slots_updated_at BEFORE UPDATE ON public.goal_history_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON public.streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


