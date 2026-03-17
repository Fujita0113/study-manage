'use server';

import { createClient } from '@/lib/supabase/server';
import type { GoalLevel, GoalChangeMemo } from '@/types';
import { addDays, parseISO, format } from 'date-fns';
import { ja } from 'date-fns/locale';

// ==================== 難易度メモ取得 ====================

export interface DifficultyMemoItem {
    date: string;
    displayDate: string;
    memo: string | null;
}

/**
 * 指定週の難易度メモ一覧を取得（月曜→日曜）
 */
export async function getDifficultyMemosAction(
    userId: string,
    weekStartDate: string
): Promise<DifficultyMemoItem[]> {
    const supabase = await createClient();
    const weekStart = parseISO(weekStartDate);
    const weekEnd = addDays(weekStart, 6);

    const { data: records } = await supabase
        .from('daily_records')
        .select('date, difficulty_memo')
        .eq('user_id', userId)
        .gte('date', weekStartDate)
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

    // 7日分のメモリストを作成（メモなしの日も含む）
    const memos: DifficultyMemoItem[] = [];
    for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const displayDate = format(date, 'M月d日（E）', { locale: ja });
        const record = records?.find(r => r.date === dateStr);

        memos.push({
            date: dateStr,
            displayDate,
            memo: (record as any)?.difficulty_memo || null,
        });
    }

    return memos;
}

// ==================== Gold妥当性アラート ====================

export interface GoldAlertItem {
    todoContent: string;
    weeksNotAchieved: number;
    type: 'not_achieved';
}

/**
 * Gold目標の妥当性チェック
 * 過去3週間にわたり一度も達成されていないGoal TodoをN週間未達成として警告する
 */
export async function getGoldValidityAlertsAction(
    userId: string
): Promise<GoldAlertItem[]> {
    const supabase = await createClient();

    // Gold目標のTodoを取得
    const { data: goals } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', userId)
        .eq('level', 'gold');

    if (!goals || goals.length === 0) return [];

    const goldGoalIds = goals.map(g => g.id);

    const { data: goldTodos } = await supabase
        .from('goal_todos')
        .select('id, content')
        .in('goal_id', goldGoalIds);

    if (!goldTodos || goldTodos.length === 0) return [];

    // 過去3週間分の日報IDを取得
    const threeWeeksAgo = format(addDays(new Date(), -21), 'yyyy-MM-dd');
    const { data: dailyRecords } = await supabase
        .from('daily_records')
        .select('id')
        .eq('user_id', userId)
        .gte('date', threeWeeksAgo);

    if (!dailyRecords || dailyRecords.length === 0) return [];

    const recordIds = dailyRecords.map(r => r.id);

    // 各Gold Todoが達成されたかチェック
    const { data: todoRecords } = await supabase
        .from('daily_todo_records')
        .select('todo_id')
        .in('daily_record_id', recordIds)
        .eq('todo_type', 'goal')
        .eq('is_achieved', true)
        .in('todo_id', goldTodos.map(t => t.id));

    const achievedTodoIds = new Set((todoRecords || []).map(r => r.todo_id));

    // 一度も達成されていないTodoをアラートに追加
    const alerts: GoldAlertItem[] = [];
    for (const todo of goldTodos) {
        if (!achievedTodoIds.has(todo.id)) {
            alerts.push({
                todoContent: todo.content,
                weeksNotAchieved: 3,
                type: 'not_achieved',
            });
        }
    }

    return alerts;
}

// ==================== Goal Change Memo (既存流用) ====================

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

    if (error || !data) return null;

    return {
        id: data.id,
        userId: data.user_id,
        weekStartDate: data.week_start_date,
        content: data.content,
        createdAt: new Date(data.created_at),
    };
}

export async function updateGoalChangeMemoAction(
    userId: string,
    weekStartDate: string,
    content: string
): Promise<GoalChangeMemo> {
    const supabase = await createClient();

    // upsert
    const { data, error } = await supabase
        .from('goal_change_memo')
        .upsert(
            {
                user_id: userId,
                week_start_date: weekStartDate,
                content,
            },
            { onConflict: 'user_id,week_start_date' }
        )
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        userId: data.user_id,
        weekStartDate: data.week_start_date,
        content: data.content,
        createdAt: new Date(data.created_at),
    };
}

// ==================== 振り返り完了 ====================

/**
 * 振り返り完了ステータスを設定
 */
export async function completeWeeklyReviewAction(
    userId: string,
    weekStartDate: string
): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('weekly_review_status')
        .upsert(
            {
                user_id: userId,
                week_start_date: weekStartDate,
                completed_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,week_start_date' }
        );

    if (error) throw error;
}

/**
 * 振り返り完了ステータスを取得
 */
export async function getWeeklyReviewStatusAction(
    userId: string,
    weekStartDate: string
): Promise<{ isCompleted: boolean; completedAt: Date | null }> {
    const supabase = await createClient();

    const { data } = await supabase
        .from('weekly_review_status')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();

    return {
        isCompleted: !!data?.completed_at,
        completedAt: data?.completed_at ? new Date(data.completed_at) : null,
    };
}

// ==================== Goal Change Log (既存流用) ====================

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
