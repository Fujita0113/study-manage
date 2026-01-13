/**
 * Database access functions
 * For now, these return mock data
 * Later, these will be replaced with actual Prisma queries
 */

import {
  mockUserSettings,
  mockDailyRecords,
  mockStreak,
  MOCK_USER_ID,
} from './mockData';
import {
  UserSettings,
  Goal,
  DailyRecord,
  Streak,
  GoalLevel,
  Suggestion,
  GoalHistorySlot,
  GoalChangeReason,
  AchievementLevel,
} from '@/types';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

// ==================== Supabase型定義 ====================

// Supabaseのdaily_recordsテーブルの型
type DailyRecordRow = Database['public']['Tables']['daily_records']['Row'];
type DailyRecordInsert = Database['public']['Tables']['daily_records']['Insert'];

// Supabaseのgoalsテーブルの型
type GoalRow = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];

// Supabaseのgoal_history_slotsテーブルの型
type GoalHistorySlotRow = Database['public']['Tables']['goal_history_slots']['Row'];
type GoalHistorySlotInsert = Database['public']['Tables']['goal_history_slots']['Insert'];
type GoalHistorySlotUpdate = Database['public']['Tables']['goal_history_slots']['Update'];

// ==================== 型変換ヘルパー関数 ====================

/**
 * Supabaseのsnake_case形式をTypeScriptのcamelCase形式に変換
 */
function toDailyRecord(dbRecord: DailyRecordRow): DailyRecord {
  return {
    id: dbRecord.id,
    userId: dbRecord.user_id,
    date: dbRecord.date,
    achievementLevel: dbRecord.achievement_level as AchievementLevel,
    doText: dbRecord.do_text || undefined,
    journalText: dbRecord.journal_text || undefined,
    createdAt: new Date(dbRecord.created_at),
    updatedAt: new Date(dbRecord.updated_at),
  };
}

/**
 * Supabaseのgoalsテーブル形式をTypeScript型に変換
 */
function toGoal(dbGoal: GoalRow): Goal {
  return {
    id: dbGoal.id,
    userId: dbGoal.user_id,
    level: dbGoal.level as GoalLevel,
    description: dbGoal.description,
    createdAt: new Date(dbGoal.created_at),
    updatedAt: new Date(dbGoal.updated_at),
  };
}

/**
 * Supabaseのgoal_history_slotsテーブル形式をTypeScript型に変換
 */
function toGoalHistorySlot(dbSlot: GoalHistorySlotRow): GoalHistorySlot {
  return {
    id: dbSlot.id,
    userId: dbSlot.user_id,
    bronzeGoal: dbSlot.bronze_goal,
    silverGoal: dbSlot.silver_goal,
    goldGoal: dbSlot.gold_goal,
    startDate: dbSlot.start_date,
    endDate: dbSlot.end_date || undefined,
    changeReason: dbSlot.change_reason as GoalChangeReason,
    createdAt: new Date(dbSlot.created_at),
    updatedAt: new Date(dbSlot.updated_at),
  };
}

// ==================== User Settings ====================

export async function getUserSettings(userId: string = MOCK_USER_ID): Promise<UserSettings> {
  return mockUserSettings;
}

export async function updateUserSettings(
  userId: string = MOCK_USER_ID,
  data: Partial<UserSettings>
): Promise<UserSettings> {
  return { ...mockUserSettings, ...data };
}

// ==================== Goals ====================

export async function getGoals(userId: string = MOCK_USER_ID): Promise<Goal[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('level', { ascending: true }); // bronze, silver, gold の順

  if (error) {
    console.error('Failed to fetch goals:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    return [];
  }

  return (data || []).map(toGoal);
}

export async function getGoalByLevel(
  level: GoalLevel,
  userId: string = MOCK_USER_ID
): Promise<Goal | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('level', level)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch goal by level:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    console.error('Level:', level);
    return null;
  }

  return data ? toGoal(data) : null;
}

export async function updateGoal(
  level: GoalLevel,
  description: string,
  userId: string = MOCK_USER_ID
): Promise<Goal> {
  const supabase = await createClient();

  const updateData: GoalUpdate = {
    description,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('user_id', userId)
    .eq('level', level)
    .select()
    .single();

  if (error) {
    console.error('Failed to update goal:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    console.error('Level:', level);
    console.error('Description:', description);
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  return toGoal(data);
}

// ==================== Daily Records ====================

export async function getDailyRecords(
  userId: string = MOCK_USER_ID,
  options?: { startDate?: string; endDate?: string }
): Promise<DailyRecord[]> {
  const supabase = await createClient();

  // 基本クエリ: user_idで絞り込み
  let query = supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId);

  // 日付範囲フィルタ
  if (options?.startDate) {
    query = query.gte('date', options.startDate);
  }

  if (options?.endDate) {
    query = query.lte('date', options.endDate);
  }

  // 新しい順にソート
  query = query.order('date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch daily records:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    console.error('Options:', options);
    return [];
  }

  return (data || []).map(toDailyRecord);
}

export async function getDailyRecordByDate(
  date: string,
  userId: string = MOCK_USER_ID
): Promise<DailyRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle(); // 0件または1件を取得

  if (error) {
    console.error('Failed to fetch daily record by date:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    console.error('Date:', date);
    return null;
  }

  return data ? toDailyRecord(data) : null;
}

export async function createDailyRecord(
  data: Omit<DailyRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string = MOCK_USER_ID
): Promise<DailyRecord> {
  const supabase = await createClient();

  // TypeScriptのcamelCaseをSupabaseのsnake_caseに変換
  const insertData: DailyRecordInsert = {
    user_id: userId,
    date: data.date,
    achievement_level: data.achievementLevel,
    do_text: data.doText || null,
    journal_text: data.journalText || null,
  };

  const query = supabase.from('daily_records');
  const { data: inserted, error } = await (query as any)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Failed to create daily record:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Insert data:', insertData);
    throw new Error(`Failed to create daily record: ${error.message}`);
  }

  return toDailyRecord(inserted);
}

export async function updateDailyRecord(
  recordId: string,
  data: Partial<DailyRecord>
): Promise<DailyRecord> {
  const record = mockDailyRecords.find((r) => r.id === recordId);
  if (!record) throw new Error(`Daily record not found: ${recordId}`);
  return { ...record, ...data, updatedAt: new Date() };
}

// ==================== Streak ====================

export async function getStreak(userId: string = MOCK_USER_ID): Promise<Streak> {
  return mockStreak;
}

export async function updateStreak(
  userId: string = MOCK_USER_ID,
  data: Partial<Streak>
): Promise<Streak> {
  return { ...mockStreak, ...data, updatedAt: new Date() };
}

// ==================== Suggestions ====================

export async function getSuggestion(
  userId: string = MOCK_USER_ID
): Promise<Suggestion | null> {
  // Check for level up suggestion (14 consecutive days at or above each level)
  const records = await getDailyRecords(userId);
  const recentRecords = records.slice(0, 14);

  // Check Gold level up (Gold以上を14日連続)
  const allGoldOrAbove = recentRecords.every((r) => r.achievementLevel === 'gold');
  if (allGoldOrAbove && recentRecords.length === 14) {
    return {
      type: 'level_up',
      message: 'Goldレベルを14日連続達成しました！目標をレベルアップしませんか？',
      targetLevel: 'gold',
      canEditAllGoals: false,
    };
  }

  // Check Silver level up (Silver以上を14日連続 = Silver or Gold)
  const allSilverOrAbove = recentRecords.every((r) =>
    r.achievementLevel === 'silver' || r.achievementLevel === 'gold'
  );
  if (allSilverOrAbove && recentRecords.length === 14) {
    return {
      type: 'level_up',
      message: 'Silverレベルを14日連続達成しました！目標をレベルアップしませんか？',
      targetLevel: 'silver',
      canEditAllGoals: false,
    };
  }

  // Check Bronze level up (Bronze以上を14日連続 = Bronze or Silver or Gold)
  const allBronzeOrAbove = recentRecords.every((r) =>
    r.achievementLevel === 'bronze' ||
    r.achievementLevel === 'silver' ||
    r.achievementLevel === 'gold'
  );
  if (allBronzeOrAbove && recentRecords.length === 14) {
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
  userId: string = MOCK_USER_ID
): Promise<GoalHistorySlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goal_history_slots')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false }); // 新しい順

  if (error) {
    console.error('Failed to fetch goal history slots:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    return [];
  }

  return (data || []).map(toGoalHistorySlot);
}

/**
 * 現在進行中のスロットを取得
 */
export async function getCurrentGoalSlot(
  userId: string = MOCK_USER_ID
): Promise<GoalHistorySlot | null> {
  const slots = await getGoalHistorySlots(userId);
  return slots.find(slot => !slot.endDate) || null;
}

/**
 * 新しい目標履歴スロットを作成
 * 同時に、現在進行中のスロットを終了させる
 *
 * 注意: 今日すでにスロットが作成されている場合は、既存スロットを更新する
 */
export async function createGoalHistorySlot(
  bronzeGoal: string,
  silverGoal: string,
  goldGoal: string,
  changeReason: GoalChangeReason,
  userId: string = MOCK_USER_ID
): Promise<GoalHistorySlot> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. 現在進行中のスロットを取得
  const currentSlot = await getCurrentGoalSlot(userId);

  // 2. 今日すでにスロットが作成されている場合は、既存スロットを更新
  if (currentSlot && currentSlot.startDate === today) {
    console.log('Updating existing slot created today:', currentSlot.id);

    const updateData: GoalHistorySlotUpdate = {
      bronze_goal: bronzeGoal,
      silver_goal: silverGoal,
      gold_goal: goldGoal,
      change_reason: changeReason,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('goal_history_slots')
      .update(updateData)
      .eq('id', currentSlot.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update goal history slot:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to update goal history slot: ${error.message}`);
    }

    return toGoalHistorySlot(data);
  }

  // 3. 既存のスロットを終了させる（今日作成されたものでない場合）
  if (currentSlot) {
    await endGoalHistorySlot(currentSlot.id);
  }

  // 4. 新しいスロットを作成
  const insertData: GoalHistorySlotInsert = {
    user_id: userId,
    bronze_goal: bronzeGoal,
    silver_goal: silverGoal,
    gold_goal: goldGoal,
    start_date: today,
    end_date: null,
    change_reason: changeReason,
  };

  const { data, error } = await supabase
    .from('goal_history_slots')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Failed to create goal history slot:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Insert data:', insertData);
    throw new Error(`Failed to create goal history slot: ${error.message}`);
  }

  return toGoalHistorySlot(data);
}

/**
 * スロットを終了させる（endDateを設定）
 */
export async function endGoalHistorySlot(
  slotId: string
): Promise<GoalHistorySlot> {
  const supabase = await createClient();

  // 昨日の日付をend_dateに設定（新しいスロットは今日から始まるため）
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const endDate = yesterday.toISOString().split('T')[0];

  const updateData: GoalHistorySlotUpdate = {
    end_date: endDate,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('goal_history_slots')
    .update(updateData)
    .eq('id', slotId)
    .select()
    .single();

  if (error) {
    console.error('Failed to end goal history slot:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Slot ID:', slotId);
    throw new Error(`Failed to end goal history slot: ${error.message}`);
  }

  return toGoalHistorySlot(data);
}
