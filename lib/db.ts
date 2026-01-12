/**
 * Database access functions
 * For now, these return mock data
 * Later, these will be replaced with actual Prisma queries
 */

import {
  mockUserSettings,
  mockGoals,
  mockDailyRecords,
  mockStreak,
  mockGoalHistorySlots,
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
  return mockGoals;
}

export async function getGoalByLevel(
  level: GoalLevel,
  userId: string = MOCK_USER_ID
): Promise<Goal | null> {
  return mockGoals.find((g) => g.level === level) || null;
}

export async function updateGoal(
  level: GoalLevel,
  description: string,
  userId: string = MOCK_USER_ID
): Promise<Goal> {
  const goal = mockGoals.find((g) => g.level === level);
  if (!goal) throw new Error(`Goal not found: ${level}`);
  return { ...goal, description, updatedAt: new Date() };
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
  return mockGoalHistorySlots.sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  );
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
 */
export async function createGoalHistorySlot(
  bronzeGoal: string,
  silverGoal: string,
  goldGoal: string,
  changeReason: GoalChangeReason,
  userId: string = MOCK_USER_ID
): Promise<GoalHistorySlot> {
  // 1. 現在進行中のスロットを終了させる
  const currentSlot = await getCurrentGoalSlot(userId);
  if (currentSlot) {
    await endGoalHistorySlot(currentSlot.id);
  }

  // 2. 新しいスロットを作成
  const today = new Date().toISOString().split('T')[0];
  const newSlot: GoalHistorySlot = {
    id: `slot-${Date.now()}`,
    userId,
    bronzeGoal,
    silverGoal,
    goldGoal,
    startDate: today,
    endDate: undefined,
    changeReason,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // TODO: Supabase insert
  mockGoalHistorySlots.push(newSlot);
  return newSlot;
}

/**
 * スロットを終了させる（endDateを設定）
 */
export async function endGoalHistorySlot(
  slotId: string
): Promise<GoalHistorySlot> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const endDate = yesterday.toISOString().split('T')[0];

  // TODO: Supabase update
  const slot = mockGoalHistorySlots.find(s => s.id === slotId);
  if (slot) {
    slot.endDate = endDate;
    slot.updatedAt = new Date();
  }

  return slot as GoalHistorySlot;
}
