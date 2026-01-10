/**
 * Database access functions
 * Using Supabase for data persistence
 */

import { createClient } from '@/lib/supabase/server';
import {
  UserSettings,
  Goal,
  DailyRecord,
  Streak,
  GoalLevel,
  Suggestion,
  GoalHistorySlot,
  GoalChangeReason,
} from '@/types';

// デバッグ用: ユーザーIDを固定
const DEFAULT_USER_ID = 'test-user-001';

// ==================== User Settings ====================

export async function getUserSettings(userId: string = DEFAULT_USER_ID): Promise<UserSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('User settings not found');

  return {
    id: data.id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function updateUserSettings(
  userId: string = DEFAULT_USER_ID,
  updates: Partial<UserSettings>
): Promise<UserSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_settings')
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to update user settings');

  return {
    id: data.id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// ==================== Goals ====================

export async function getGoals(userId: string = DEFAULT_USER_ID): Promise<Goal[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('level', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    level: row.level as GoalLevel,
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export async function getGoalByLevel(
  level: GoalLevel,
  userId: string = DEFAULT_USER_ID
): Promise<Goal | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('level', level)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    level: data.level as GoalLevel,
    description: data.description,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function updateGoal(
  level: GoalLevel,
  description: string,
  userId: string = DEFAULT_USER_ID
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

  return {
    id: data.id,
    userId: data.user_id,
    level: data.level as GoalLevel,
    description: data.description,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// ==================== Daily Records ====================

export async function getDailyRecords(
  userId: string = DEFAULT_USER_ID,
  options?: { startDate?: string; endDate?: string }
): Promise<DailyRecord[]> {
  const supabase = await createClient();

  let query = supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (options?.startDate) {
    query = query.gte('date', options.startDate);
  }

  if (options?.endDate) {
    query = query.lte('date', options.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    achievementLevel: row.achievement_level,
    doText: row.do_text || undefined,
    journalText: row.journal_text || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export async function getDailyRecordByDate(
  date: string,
  userId: string = DEFAULT_USER_ID
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

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    achievementLevel: data.achievement_level,
    doText: data.do_text || undefined,
    journalText: data.journal_text || undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function createDailyRecord(
  recordData: Omit<DailyRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string = DEFAULT_USER_ID
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

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    achievementLevel: data.achievement_level,
    doText: data.do_text || undefined,
    journalText: data.journal_text || undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function updateDailyRecord(
  recordId: string,
  updates: Partial<DailyRecord>
): Promise<DailyRecord> {
  const supabase = await createClient();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.achievementLevel !== undefined) {
    updateData.achievement_level = updates.achievementLevel;
  }
  if (updates.doText !== undefined) {
    updateData.do_text = updates.doText || null;
  }
  if (updates.journalText !== undefined) {
    updateData.journal_text = updates.journalText || null;
  }

  const { data, error } = await supabase
    .from('daily_records')
    .update(updateData)
    .eq('id', recordId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error(`Daily record not found: ${recordId}`);

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    achievementLevel: data.achievement_level,
    doText: data.do_text || undefined,
    journalText: data.journal_text || undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// ==================== Streak ====================

export async function getStreak(userId: string = DEFAULT_USER_ID): Promise<Streak> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Streak not found');

  return {
    id: data.id,
    userId: data.user_id,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastRecordedDate: data.last_recorded_date || undefined,
    updatedAt: new Date(data.updated_at),
  };
}

export async function updateStreak(
  userId: string = DEFAULT_USER_ID,
  updates: Partial<Streak>
): Promise<Streak> {
  const supabase = await createClient();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.currentStreak !== undefined) {
    updateData.current_streak = updates.currentStreak;
  }
  if (updates.longestStreak !== undefined) {
    updateData.longest_streak = updates.longestStreak;
  }
  if (updates.lastRecordedDate !== undefined) {
    updateData.last_recorded_date = updates.lastRecordedDate || null;
  }

  const { data, error } = await supabase
    .from('streaks')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to update streak');

  return {
    id: data.id,
    userId: data.user_id,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastRecordedDate: data.last_recorded_date || undefined,
    updatedAt: new Date(data.updated_at),
  };
}

// ==================== Suggestions ====================

export async function getSuggestion(
  userId: string = DEFAULT_USER_ID
): Promise<Suggestion | null> {
  // Check for level up suggestion (14 consecutive days at same level)
  const records = await getDailyRecords(userId);
  const recentRecords = records.slice(0, 14);

  // Check Gold level up
  const allGold = recentRecords.every((r) => r.achievementLevel === 'gold');
  if (allGold && recentRecords.length === 14) {
    return {
      type: 'level_up',
      message: 'Goldレベルを14日連続達成しました！目標をレベルアップしませんか？',
      targetLevel: 'gold',
      canEditAllGoals: false,
    };
  }

  // Check Silver level up
  const allSilver = recentRecords.every((r) => r.achievementLevel === 'silver');
  if (allSilver && recentRecords.length === 14) {
    return {
      type: 'level_up',
      message: 'Silverレベルを14日連続達成しました！目標をレベルアップしませんか？',
      targetLevel: 'silver',
      canEditAllGoals: false,
    };
  }

  // Check Bronze level up
  const allBronze = recentRecords.every((r) => r.achievementLevel === 'bronze');
  if (allBronze && recentRecords.length === 14) {
    return {
      type: 'level_up',
      message: 'Bronzeレベルを14日連続達成しました！目標をレベルアップしませんか？',
      targetLevel: 'bronze',
      canEditAllGoals: false,
    };
  }

  // Check level down suggestion (failed to achieve Bronze 4+ days in a week)
  const lastWeek = records.slice(0, 7);
  const failedDays = lastWeek.filter((r) => r.achievementLevel === 'none').length;
  if (failedDays >= 4) {
    return {
      type: 'level_down',
      message: '目標をレベルダウンしませんか？無理のないペースで続けることが大切です。',
      canEditAllGoals: true,
    };
  }

  return null;
}

// ==================== Goal History Slots ====================

/**
 * 目標履歴スロットを全て取得（新しい順）
 */
export async function getGoalHistorySlots(
  userId: string = DEFAULT_USER_ID
): Promise<GoalHistorySlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goal_history')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map(row => ({
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
  }));
}

/**
 * 現在進行中のスロットを取得
 */
export async function getCurrentGoalSlot(
  userId: string = DEFAULT_USER_ID
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

  return {
    id: data.id,
    userId: data.user_id,
    bronzeGoal: data.bronze_goal,
    silverGoal: data.silver_goal,
    goldGoal: data.gold_goal,
    startDate: data.start_date,
    endDate: data.end_date || undefined,
    changeReason: data.change_reason as GoalChangeReason,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * 新しい目標履歴スロットを作成
 * 同時に、現在進行中のスロットを終了させる
 */
export async function createGoalHistorySlot(
  bronzeGoal: string,
  silverGoal: string,
  goldGoal: string,
  changeReason: GoalChangeReason,
  userId: string = DEFAULT_USER_ID
): Promise<GoalHistorySlot> {
  const supabase = await createClient();

  // 1. 現在進行中のスロットを終了させる
  const currentSlot = await getCurrentGoalSlot(userId);
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

  return {
    id: data.id,
    userId: data.user_id,
    bronzeGoal: data.bronze_goal,
    silverGoal: data.silver_goal,
    goldGoal: data.gold_goal,
    startDate: data.start_date,
    endDate: data.end_date || undefined,
    changeReason: data.change_reason as GoalChangeReason,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * スロットを終了させる（endDateを設定）
 */
export async function endGoalHistorySlot(
  slotId: string
): Promise<GoalHistorySlot> {
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

  return {
    id: data.id,
    userId: data.user_id,
    bronzeGoal: data.bronze_goal,
    silverGoal: data.silver_goal,
    goldGoal: data.gold_goal,
    startDate: data.start_date,
    endDate: data.end_date || undefined,
    changeReason: data.change_reason as GoalChangeReason,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}
