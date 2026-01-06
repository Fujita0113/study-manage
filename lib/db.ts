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
} from '@/types';

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
  let records = mockDailyRecords;

  if (options?.startDate) {
    records = records.filter((r) => r.date >= options.startDate!);
  }

  if (options?.endDate) {
    records = records.filter((r) => r.date <= options.endDate!);
  }

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getDailyRecordByDate(
  date: string,
  userId: string = MOCK_USER_ID
): Promise<DailyRecord | null> {
  return mockDailyRecords.find((r) => r.date === date) || null;
}

export async function createDailyRecord(
  data: Omit<DailyRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string = MOCK_USER_ID
): Promise<DailyRecord> {
  const newRecord: DailyRecord = {
    ...data,
    id: `record-${Date.now()}`,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return newRecord;
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
