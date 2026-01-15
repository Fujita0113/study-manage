/**
 * Database access functions
 * Using Supabase for data persistence
 */

import {
  mockUserSettings,
  mockDailyRecords,
} from './mockData';
import {
  UserSettings,
  Goal,
  DailyRecord,
  GoalLevel,
  Suggestion,
  SuggestionType,
  GoalHistorySlot,
  GoalChangeReason,
  AchievementLevel,
} from '@/types';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import { formatDate } from './utils';

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

export async function getUserSettings(userId: string): Promise<UserSettings> {
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
  userId: string,
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

export async function getGoals(userId: string): Promise<Goal[]> {
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

/**
 * ユーザーが3つの目標（Bronze/Silver/Gold）を持っているかチェック
 */
export async function hasGoals(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to check goals:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    return false;
  }

  // 3つ全ての目標が存在する場合にのみtrueを返す
  return data && data.length === 3;
}

/**
 * 初期目標を一括作成
 * goalsテーブルに3レコード挿入 + goal_history_slotsテーブルに初期スロット作成
 */
export async function createInitialGoals(
  bronze: string,
  silver: string,
  gold: string,
  userId: string
): Promise<void> {
  const startTime = Date.now();
  console.log('[DB] createInitialGoals: Start', { userId, timestamp: new Date().toISOString() });
  
  const supabase = await createClient();

  // 1. goals テーブルに3つの目標を挿入
  const goalsToInsert: GoalInsert[] = [
    { user_id: userId, level: 'bronze', description: bronze },
    { user_id: userId, level: 'silver', description: silver },
    { user_id: userId, level: 'gold', description: gold },
  ];

  console.log('[DB] Inserting goals:', goalsToInsert.map(g => ({ level: g.level, description: g.description?.substring(0, 50) })));
  
  const insertStartTime = Date.now();
  const { data: insertedGoals, error: goalsError } = await supabase
    .from('goals')
    .insert(goalsToInsert)
    .select('id, level, created_at');

  const insertTime = Date.now() - insertStartTime;
  console.log(`[DB] Insert completed (took ${insertTime}ms)`);

  if (goalsError) {
    console.error('[DB] Failed to create goals:', goalsError);
    console.error('[DB] Error details:', JSON.stringify(goalsError, null, 2));
    console.error('[DB] Goals to insert:', goalsToInsert);
    throw new Error(`Failed to create goals: ${goalsError.message}`);
  }

  console.log('[DB] Goals inserted successfully:', insertedGoals?.map(g => ({ id: g.id, level: g.level, created_at: g.created_at })));

  // 2. goal_history_slots に初期スロットを作成
  const today = new Date().toISOString().split('T')[0];
  const slotData: GoalHistorySlotInsert = {
    user_id: userId,
    bronze_goal: bronze,
    silver_goal: silver,
    gold_goal: gold,
    start_date: today,
    end_date: null,
    change_reason: 'initial',
  };

  console.log('[DB] Inserting goal history slot:', { start_date: slotData.start_date, change_reason: slotData.change_reason });
  
  const slotInsertStartTime = Date.now();
  const { data: insertedSlot, error: slotError } = await supabase
    .from('goal_history_slots')
    .insert(slotData)
    .select('id, start_date, created_at');

  const slotInsertTime = Date.now() - slotInsertStartTime;
  console.log(`[DB] Slot insert completed (took ${slotInsertTime}ms)`);

  if (slotError) {
    console.error('[DB] Failed to create goal history slot:', slotError);
    console.error('[DB] Error details:', JSON.stringify(slotError, null, 2));
    console.error('[DB] Slot data:', slotData);
    throw new Error(`Failed to create goal history slot: ${slotError.message}`);
  }

  console.log('[DB] Goal history slot inserted successfully:', insertedSlot?.[0] ? { id: insertedSlot[0].id, start_date: insertedSlot[0].start_date } : null);
  
  const totalTime = Date.now() - startTime;
  console.log(`[DB] createInitialGoals: Complete (total time: ${totalTime}ms)`);
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
  userId: string
): Promise<Goal> {
  const supabase = await createClient();

  console.log('=== updateGoal: Start ===');
  console.log('Level:', level);
  console.log('User ID:', userId);
  console.log('New description:', description);

  // 更新前の値を取得
  const { data: currentGoal } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('level', level)
    .maybeSingle();

  if (currentGoal) {
    console.log('Current description:', currentGoal.description);
  } else {
    console.warn('No current goal found for level:', level);
  }

  const updateData: GoalUpdate = {
    description,
    updated_at: new Date().toISOString(),
  };

  console.log('Update data:', updateData);

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
    console.error('Error code:', error.code);
    console.error('Error hint:', error.hint);
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  console.log('Updated goal:', data);
  console.log('=== updateGoal: Success ===');

  return toGoal(data);
}

// ==================== Daily Records ====================

export async function getDailyRecords(
  userId: string,
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
  userId: string = DEFAULT_USER_ID
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
  recordData: Omit<DailyRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<DailyRecord> {
  const supabase = await createClient();

  // TypeScriptのcamelCaseをSupabaseのsnake_caseに変換
  const insertData: DailyRecordInsert = {
    user_id: userId,
    date: recordData.date,
    achievement_level: recordData.achievementLevel,
    do_text: recordData.doText || null,
    journal_text: recordData.journalText || null,
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

/**
 * daily_recordsからストリークを計算
 * Bronze以上の連続達成日数をカウント
 * 当日の記録がまだない場合は、昨日までの連続達成日数を表示する
 *
 * @param userId - ユーザーID
 * @returns 現在の連続日数
 */
export async function calculateStreakFromRecords(
  userId: string
): Promise<number> {
  const records = await getDailyRecords(userId);

  if (records.length === 0) {
    return 0;
  }

  let streak = 0;
  const today = new Date();
  const todayStr = formatDate(today);

  // 今日の記録があるかチェック
  const hasTodayRecord = records[0]?.date === todayStr;

  // 今日の記録がない場合は、昨日（i=1）から開始
  // 今日の記録がある場合は、今日（i=0）から開始
  const startIndex = hasTodayRecord ? 0 : 1;

  for (let i = startIndex; i < records.length + startIndex; i++) {
    const recordIndex = i - startIndex;
    if (recordIndex >= records.length) break;

    const record = records[recordIndex];
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedDateStr = formatDate(expectedDate);

    // 日付が連続していない場合は終了
    if (record.date !== expectedDateStr) {
      break;
    }

    // Bronze以上なら連続
    if (['bronze', 'silver', 'gold'].includes(record.achievementLevel)) {
      streak++;
    } else {
      // noneが出たら連続終了
      break;
    }
  }

  return streak;
}

// ==================== Suggestion Display Log ====================

// ==================== Suggestions ====================

/**
 * 指定したレベル以上の連続達成日数をカウント
 *
 * @param records - 新しい順に並んだ日報記録（getDailyRecords の結果）
 * @param minLevel - 最低達成レベル ('bronze' | 'silver' | 'gold')
 * @returns 連続達成日数
 */
function countConsecutiveDays(
  records: DailyRecord[],
  minLevel: 'bronze' | 'silver' | 'gold'
): number {
  let count = 0;

  for (const record of records) {
    // レベルの判定
    const meetsLevel =
      minLevel === 'bronze'
        ? ['bronze', 'silver', 'gold'].includes(record.achievementLevel)
        : minLevel === 'silver'
        ? ['silver', 'gold'].includes(record.achievementLevel)
        : record.achievementLevel === 'gold';

    if (meetsLevel) {
      count++;
    } else {
      // 連続が途切れた
      break;
    }
  }

  return count;
}

export async function getSuggestion(
  userId: string
): Promise<Suggestion | null> {
  // Check for level up suggestion (exactly 14, 28, 42... consecutive days at or above each level)
  const records = await getDailyRecords(userId);

  // Check Gold level up (Gold連続日数が14の倍数かつ14日以上)
  const goldStreak = countConsecutiveDays(records, 'gold');
  if (goldStreak >= 14 && goldStreak % 14 === 0) {
    return {
      type: 'level_up',
      message: 'Goldレベルを14日連続達成しました！目標をレベルアップしませんか？',
      targetLevel: 'gold',
      canEditAllGoals: false,
    };
  }

  // Check Silver level up (Silver以上連続日数が14の倍数かつ14日以上)
  const silverStreak = countConsecutiveDays(records, 'silver');
  if (silverStreak >= 14 && silverStreak % 14 === 0) {
    return {
      type: 'level_up',
      message: 'Silverレベルを14日連続達成しました！目標をレベルアップしませんか？',
      targetLevel: 'silver',
      canEditAllGoals: false,
    };
  }

  // Check Bronze level up (Bronze以上連続日数が14の倍数かつ14日以上)
  const bronzeStreak = countConsecutiveDays(records, 'bronze');
  if (bronzeStreak >= 14 && bronzeStreak % 14 === 0) {
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
  userId: string
): Promise<GoalHistorySlot | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goal_history_slots')
    .select('*')
    .eq('user_id', userId)
    .is('end_date', null)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch current goal slot:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    return null;
  }

  return data ? toGoalHistorySlot(data) : null;
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
  userId: string
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
