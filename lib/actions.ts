/**
 * Server Actions
 * Client Componentから呼び出されるデータベース操作
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import type {
  Goal,
  GoalLevel,
  GoalChangeReason,
  DailyRecord,
  GoalHistorySlot,
} from '@/types';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];
type DailyRecordRow = Database['public']['Tables']['daily_records']['Row'];
type DailyRecordInsert = Database['public']['Tables']['daily_records']['Insert'];
type GoalHistoryRow = Database['public']['Tables']['goal_history']['Row'];
type GoalHistoryInsert = Database['public']['Tables']['goal_history']['Insert'];
type GoalHistoryUpdate = Database['public']['Tables']['goal_history']['Update'];

// ==================== Goals ====================

export async function getGoalsAction(userId: string): Promise<Goal[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('level', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map((row: GoalRow) => ({
    id: row.id,
    userId: row.user_id,
    level: row.level as GoalLevel,
    description: row.description || null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export async function updateGoalAction(
  level: GoalLevel,
  description: string,
  userId: string
): Promise<Goal> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .update({
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('level', level)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error(`Goal not found: ${level}`);

  const row = data as GoalRow;
  return {
    id: row.id,
    userId: row.user_id,
    level: row.level as GoalLevel,
    description: row.description || null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ==================== Daily Records ====================

export async function getDailyRecordByDateAction(
  date: string,
  userId: string
): Promise<DailyRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as DailyRecordRow;
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    achievementLevel: row.achievement_level,
    doText: row.do_text || undefined,
    journalText: row.journal_text || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function createDailyRecordAction(
  recordData: Omit<DailyRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<DailyRecord> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('daily_records')
    .insert({
      user_id: userId,
      date: recordData.date,
      achievement_level: recordData.achievementLevel,
      do_text: recordData.doText || null,
      journal_text: recordData.journalText || null,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create daily record');

  const row = data as DailyRecordRow;
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    achievementLevel: row.achievement_level,
    doText: row.do_text || undefined,
    journalText: row.journal_text || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ==================== Goal History Slots ====================

/**
 * 現在進行中のスロットを取得
 */
export async function getCurrentGoalSlotAction(
  userId: string
): Promise<GoalHistorySlot | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goal_history')
    .select('*')
    .eq('user_id', userId)
    .is('end_date', null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as GoalHistoryRow;
  return {
    id: row.id,
    userId: row.user_id,
    bronzeGoal: row.bronze_goal,
    silverGoal: row.silver_goal,
    goldGoal: row.gold_goal,
    startDate: row.start_date,
    endDate: row.end_date || undefined,
    changeReason: row.change_reason as GoalChangeReason,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * スロットを終了させる（endDateを設定）
 */
async function endGoalHistorySlot(slotId: string): Promise<GoalHistorySlot> {
  const supabase = await createClient();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const endDate = yesterday.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('goal_history')
    .update({
      end_date: endDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', slotId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error(`Goal history slot not found: ${slotId}`);

  const row = data as GoalHistoryRow;
  return {
    id: row.id,
    userId: row.user_id,
    bronzeGoal: row.bronze_goal,
    silverGoal: row.silver_goal,
    goldGoal: row.gold_goal,
    startDate: row.start_date,
    endDate: row.end_date || undefined,
    changeReason: row.change_reason as GoalChangeReason,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * 新しい目標履歴スロットを作成
 * 同時に、現在進行中のスロットを終了させる
 */
export async function createGoalHistorySlotAction(
  bronzeGoal: string,
  silverGoal: string,
  goldGoal: string,
  changeReason: GoalChangeReason,
  userId: string
): Promise<GoalHistorySlot> {
  const supabase = await createClient();

  // 1. 現在進行中のスロットを終了させる
  const currentSlot = await getCurrentGoalSlotAction(userId);
  if (currentSlot) {
    await endGoalHistorySlot(currentSlot.id);
  }

  // 2. 新しいスロットを作成
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('goal_history')
    .insert({
      user_id: userId,
      bronze_goal: bronzeGoal,
      silver_goal: silverGoal,
      gold_goal: goldGoal,
      start_date: today,
      end_date: null,
      change_reason: changeReason,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create goal history slot');

  const row = data as GoalHistoryRow;
  return {
    id: row.id,
    userId: row.user_id,
    bronzeGoal: row.bronze_goal,
    silverGoal: row.silver_goal,
    goldGoal: row.gold_goal,
    startDate: row.start_date,
    endDate: row.end_date || undefined,
    changeReason: row.change_reason as GoalChangeReason,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
