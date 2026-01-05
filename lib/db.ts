/**
 * Database access functions
 * For now, these return mock data
 * Later, these will be replaced with actual Prisma queries
 */

import {
  mockData,
  MOCK_USER_ID,
} from './mockData';
import {
  UserSettings,
  Goal,
  Effort,
  DailyRecord,
  EffortEvaluation,
  Streak,
  GitHubCommit,
  GoalLevel,
  AchievementLevel,
  DailyRecordWithDetails,
  Suggestion,
} from '@/types';

// ==================== User Settings ====================

export async function getUserSettings(userId: string = MOCK_USER_ID): Promise<UserSettings> {
  return mockData.userSettings;
}

export async function updateUserSettings(
  userId: string = MOCK_USER_ID,
  data: Partial<UserSettings>
): Promise<UserSettings> {
  return { ...mockData.userSettings, ...data };
}

// ==================== Goals ====================

export async function getGoals(userId: string = MOCK_USER_ID): Promise<Goal[]> {
  return mockData.goals;
}

export async function getGoalByLevel(
  level: GoalLevel,
  userId: string = MOCK_USER_ID
): Promise<Goal | null> {
  return mockData.goals.find((g) => g.level === level) || null;
}

export async function updateGoal(
  level: GoalLevel,
  description: string,
  userId: string = MOCK_USER_ID
): Promise<Goal> {
  const goal = mockData.goals.find((g) => g.level === level);
  if (!goal) throw new Error(`Goal not found: ${level}`);
  return { ...goal, description, updatedAt: new Date() };
}

// ==================== Efforts ====================

export async function getEfforts(
  userId: string = MOCK_USER_ID,
  options?: { status?: 'active' | 'archived'; goalLevel?: GoalLevel }
): Promise<Effort[]> {
  let efforts = mockData.efforts;

  if (options?.status) {
    efforts = efforts.filter((e) => e.status === options.status);
  }

  if (options?.goalLevel) {
    efforts = efforts.filter((e) => e.goalLevel === options.goalLevel);
  }

  return efforts;
}

export async function getEffortById(effortId: string): Promise<Effort | null> {
  return mockData.efforts.find((e) => e.id === effortId) || null;
}

export async function createEffort(
  data: Omit<Effort, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string = MOCK_USER_ID
): Promise<Effort> {
  const newEffort: Effort = {
    ...data,
    id: `effort-${Date.now()}`,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return newEffort;
}

export async function updateEffort(
  effortId: string,
  data: Partial<Effort>
): Promise<Effort> {
  const effort = mockData.efforts.find((e) => e.id === effortId);
  if (!effort) throw new Error(`Effort not found: ${effortId}`);
  return { ...effort, ...data, updatedAt: new Date() };
}

export async function archiveEffort(effortId: string): Promise<Effort> {
  return updateEffort(effortId, { status: 'archived' });
}

export async function reactivateEffort(effortId: string): Promise<Effort> {
  return updateEffort(effortId, {
    status: 'active',
    activatedAt: new Date(),
  });
}

// ==================== Daily Records ====================

export async function getDailyRecords(
  userId: string = MOCK_USER_ID,
  options?: { startDate?: string; endDate?: string }
): Promise<DailyRecord[]> {
  let records = mockData.dailyRecords;

  if (options?.startDate) {
    records = records.filter((r) => r.date >= options.startDate);
  }

  if (options?.endDate) {
    records = records.filter((r) => r.date <= options.endDate);
  }

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getDailyRecordByDate(
  date: string,
  userId: string = MOCK_USER_ID
): Promise<DailyRecord | null> {
  return mockData.dailyRecords.find((r) => r.date === date) || null;
}

export async function getDailyRecordWithDetails(
  date: string,
  userId: string = MOCK_USER_ID
): Promise<DailyRecordWithDetails | null> {
  const record = await getDailyRecordByDate(date, userId);
  if (!record) return null;

  const evaluations = mockData.effortEvaluations.filter(
    (e) => e.dailyRecordId === record.id
  );

  const effortEvaluations = evaluations.map((evaluation) => ({
    ...evaluation,
    effort: mockData.efforts.find((e) => e.id === evaluation.effortId)!,
  }));

  return {
    ...record,
    effortEvaluations,
  };
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
  const record = mockData.dailyRecords.find((r) => r.id === recordId);
  if (!record) throw new Error(`Daily record not found: ${recordId}`);
  return { ...record, ...data, updatedAt: new Date() };
}

// ==================== Effort Evaluations ====================

export async function getEffortEvaluations(
  dailyRecordId: string
): Promise<EffortEvaluation[]> {
  return mockData.effortEvaluations.filter(
    (e) => e.dailyRecordId === dailyRecordId
  );
}

export async function createEffortEvaluation(
  data: Omit<EffortEvaluation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<EffortEvaluation> {
  const newEval: EffortEvaluation = {
    ...data,
    id: `eval-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return newEval;
}

export async function updateEffortEvaluation(
  evaluationId: string,
  data: Partial<EffortEvaluation>
): Promise<EffortEvaluation> {
  const evaluation = mockData.effortEvaluations.find((e) => e.id === evaluationId);
  if (!evaluation) throw new Error(`Evaluation not found: ${evaluationId}`);
  return { ...evaluation, ...data, updatedAt: new Date() };
}

// ==================== Streak ====================

export async function getStreak(userId: string = MOCK_USER_ID): Promise<Streak> {
  return mockData.streak;
}

export async function updateStreak(
  userId: string = MOCK_USER_ID,
  data: Partial<Streak>
): Promise<Streak> {
  return { ...mockData.streak, ...data, updatedAt: new Date() };
}

// ==================== GitHub ====================

export async function getGitHubCommits(
  userId: string = MOCK_USER_ID
): Promise<GitHubCommit[]> {
  return mockData.githubCommits;
}

export async function fetchGitHubCommits(
  userId: string = MOCK_USER_ID
): Promise<GitHubCommit[]> {
  // Mock implementation - just return cached commits
  // In real implementation, this would call GitHub API
  return mockData.githubCommits;
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
