'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import type { GoalLevel, WeeklyReviewSummary, TodoAnalysisItem, GoalChangeMemo, WeeklyReviewAccessLog, GoalChangeLog } from '@/types';
import { formatDate } from '@/lib/utils';
import { subDays, parseISO, addDays } from 'date-fns';

type DailyRecordRow = Database['public']['Tables']['daily_records']['Row'];

/**
 * 年月日の文字列(YYYY-MM-DD)から前の週の開始日を取得
 */
function getPreviousWeekStartDate(weekStartDate: string): string {
    const date = parseISO(weekStartDate);
    return formatDate(subDays(date, 7));
}

/**
 * 1. 週次サマリーの取得
 */
export async function getWeeklyReviewSummaryAction(
    userId: string,
    weekStartDate: string
): Promise<WeeklyReviewSummary> {
    const supabase = await createClient();
    const prevWeekStartDate = getPreviousWeekStartDate(weekStartDate);

    // 対象週の終了日（開始日から6日後）
    const weekEndDate = formatDate(addDays(parseISO(weekStartDate), 6));
    const prevWeekEndDate = formatDate(subDays(parseISO(weekStartDate), 1));

    // Current Week Records
    const { data: currentRecords } = await supabase
        .from('daily_records')
        .select('achievement_level')
        .eq('user_id', userId)
        .gte('date', weekStartDate)
        .lte('date', weekEndDate);

    // Previous Week Records
    const { data: prevRecords } = await supabase
        .from('daily_records')
        .select('achievement_level')
        .eq('user_id', userId)
        .gte('date', prevWeekStartDate)
        .lte('date', prevWeekEndDate);

    const calculateStats = (records: any[] | null) => {
        if (!records) return { totalRecords: 0, bronzeAchieved: 0, silverAchieved: 0, goldAchieved: 0 };
        return {
            totalRecords: records.length,
            bronzeAchieved: records.filter(r => ['bronze', 'silver', 'gold'].includes(r.achievement_level)).length,
            silverAchieved: records.filter(r => ['silver', 'gold'].includes(r.achievement_level)).length,
            goldAchieved: records.filter(r => r.achievement_level === 'gold').length,
        };
    };

    return {
        currentWeekStats: calculateStats(currentRecords),
        previousWeekStats: calculateStats(prevRecords),
    };
}

/**
 * 2. TODO別達成状況分析
 */
export async function getTodoAnalysisAction(
    userId: string,
    weekStartDate: string
): Promise<TodoAnalysisItem[]> {
    const supabase = await createClient();
    const weekEndDate = formatDate(addDays(parseISO(weekStartDate), 6));

    // 1. その週のdaily_recordsを取得
    const { data: dailyRecords } = await supabase
        .from('daily_records')
        .select('id')
        .eq('user_id', userId)
        .gte('date', weekStartDate)
        .lte('date', weekEndDate);

    if (!dailyRecords || dailyRecords.length === 0) {
        return [];
    }

    const recordIds = dailyRecords.map(r => r.id);

    // 2. その週の全てに紐づく daily_todo_records を取得
    const { data: todoRecords } = await supabase
        .from('daily_todo_records')
        .select('*')
        .in('daily_record_id', recordIds);

    if (!todoRecords || todoRecords.length === 0) return [];

    // TODOマスターデータの取得
    // Goal Todos
    const { data: goalTodos } = await supabase
        .from('goal_todos')
        .select('id, content, goals(level)')
        // @ts-ignore - Supabase type inference issue with simple joins
        // We will cast it later
        ;

    // Timeline Todos (Routine)
    const { data: timelineTodos } = await supabase
        .from('timeline_todos')
        .select('id, content')
        .eq('user_id', userId);

    const goalTodoMap = new Map(goalTodos?.map((t: any) => [t.id, { content: t.content, level: t.goals?.level }]));
    const timelineTodoMap = new Map(timelineTodos?.map(t => [t.id, { content: t.content }]));

    const statsMap = new Map<string, TodoAnalysisItem>();

    todoRecords.forEach(record => {
        let content = 'Unknown Todo';
        let goalLevel: GoalLevel | undefined = undefined;
        let type: 'goal' | 'routine' = record.todo_type as 'goal' | 'routine';

        // other type is deprecated but map it to routine if exists just in case
        if (record.todo_type === 'other') type = 'routine';

        if (record.todo_type === 'goal') {
            const gTodo = goalTodoMap.get(record.todo_id);
            if (gTodo) {
                content = gTodo.content;
                goalLevel = gTodo.level as GoalLevel;
            }
        } else if (record.todo_type === 'routine' || record.todo_type === 'timeline') {
            const tTodo = timelineTodoMap.get(record.todo_id);
            if (tTodo) {
                content = tTodo.content;
            }
        }

        if (!statsMap.has(record.todo_id)) {
            statsMap.set(record.todo_id, {
                todoId: record.todo_id,
                content,
                type,
                goalLevel,
                totalCount: 0,
                achievedCount: 0,
                achievementRate: 0,
            });
        }

        const stat = statsMap.get(record.todo_id)!;
        stat.totalCount += 1;
        if (record.is_achieved) {
            stat.achievedCount += 1;
        }
    });

    const result = Array.from(statsMap.values()).map(stat => ({
        ...stat,
        achievementRate: stat.totalCount > 0 ? Math.round((stat.achievedCount / stat.totalCount) * 100) : 0
    }));

    // ソート：達成率の低い順（改善点を見つけやすくするため）
    return result.sort((a, b) => a.achievementRate - b.achievementRate);
}

/**
 * 3. Goal Change Memo 取得
 */
export async function getGoalChangeMemoAction(
    userId: string,
    weekStartDate: string
): Promise<GoalChangeMemo | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('goal_change_memo')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();

    if (error) {
        console.error('Failed to fetch goal change memo:', error);
        return null;
    }

    if (!data) return null;

    return {
        id: data.id,
        userId: data.user_id,
        weekStartDate: data.week_start_date,
        content: data.content,
        createdAt: new Date(data.created_at),
    };
}

/**
 * 4. Goal Change Memo 保存/更新
 */
export async function updateGoalChangeMemoAction(
    userId: string,
    weekStartDate: string,
    content: string
): Promise<GoalChangeMemo> {
    const supabase = await createClient();

    // 既存確認
    const existing = await getGoalChangeMemoAction(userId, weekStartDate);

    let result;
    if (existing) {
        const { data, error } = await supabase
            .from('goal_change_memo')
            .update({ content })
            .eq('id', existing.id)
            .select()
            .single();
        if (error) throw error;
        result = data;
    } else {
        const { data, error } = await supabase
            .from('goal_change_memo')
            .insert({ user_id: userId, week_start_date: weekStartDate, content })
            .select()
            .single();
        if (error) throw error;
        result = data;
    }

    return {
        id: result.id,
        userId: result.user_id,
        weekStartDate: result.week_start_date,
        content: result.content,
        createdAt: new Date(result.created_at),
    };
}

/**
 * 5. 目標編集のアクセスロック確認・作成 (Silver/Bronze用)
 */
export async function checkAndCreateAccessLogAction(
    userId: string,
    weekStartDate: string
): Promise<{ canEdit: boolean; existingLog: WeeklyReviewAccessLog | null }> {
    const supabase = await createClient();
    const today = formatDate(new Date());

    const { data: existing, error } = await supabase
        .from('weekly_review_access_log')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();

    if (error) {
        console.error('Failed to fetch access log:', error);
        return { canEdit: false, existingLog: null };
    }

    if (existing) {
        const log: WeeklyReviewAccessLog = {
            id: existing.id,
            userId: existing.user_id,
            weekStartDate: existing.week_start_date,
            editUnlockDate: existing.edit_unlock_date,
            createdAt: new Date(existing.created_at),
        };
        // 編集可能なのは、解禁日（つまり初回アクセス日）と今日が一致する場合のみ
        return {
            canEdit: log.editUnlockDate === today,
            existingLog: log
        };
    }

    // なければ作成（初回アクセス）
    const { data: newLog, error: insertError } = await supabase
        .from('weekly_review_access_log')
        .insert({
            user_id: userId,
            week_start_date: weekStartDate,
            edit_unlock_date: today,
        })
        .select()
        .single();

    if (insertError) {
        console.error('Failed to create access log:', insertError);
        return { canEdit: false, existingLog: null };
    }

    return {
        canEdit: true, // 作成したその日は編集可能
        existingLog: {
            id: newLog.id,
            userId: newLog.user_id,
            weekStartDate: newLog.week_start_date,
            editUnlockDate: newLog.edit_unlock_date,
            createdAt: new Date(newLog.created_at),
        }
    };
}

/**
 * 6. 目標変更履歴の登録
 */
export async function logGoalChangeAction(
    userId: string,
    goalType: GoalLevel,
    oldContent: string,
    newContent: string,
    changeReason: string
): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('goal_change_log')
        .insert({
            user_id: userId,
            goal_type: goalType,
            old_content: oldContent,
            new_content: newContent,
            change_reason: changeReason,
        });

    if (error) throw error;
}
