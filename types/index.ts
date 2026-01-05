// Goal Levels
export type GoalLevel = 'bronze' | 'silver' | 'gold';

// Achievement Levels
export type AchievementLevel = 'none' | 'bronze' | 'silver' | 'gold';

// Effort Status
export type EffortStatus = 'active' | 'archived';

// Effort Evaluation - Executed
export type EffortExecuted = 'yes' | 'no' | 'first_day';

// Effort Evaluation - Effectiveness
export type EffortEffectiveness = 'excellent' | 'moderate' | 'negative' | 'not_evaluated';

// Effort Evaluation - Next Action
export type EffortNextAction = 'continue' | 'improve' | 'stop';

// User Settings
export interface UserSettings {
  id: string;
  githubUsername?: string;
  githubToken?: string;
  githubRepo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Goal
export interface Goal {
  id: string;
  userId: string;
  level: GoalLevel;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Effort
export interface Effort {
  id: string;
  userId: string;
  goalLevel: GoalLevel;
  title: string;
  description?: string;
  status: EffortStatus;
  createdAt: Date;
  updatedAt: Date;
  activatedAt?: Date;
}

// Daily Record
export interface DailyRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  achievementLevel: AchievementLevel;
  planText?: string;
  doText?: string;
  checkText?: string;
  actText?: string;
  journalText?: string;
  stepUpStrategy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Effort Evaluation
export interface EffortEvaluation {
  id: string;
  dailyRecordId: string;
  effortId: string;
  executed: EffortExecuted;
  effectiveness: EffortEffectiveness;
  nextAction?: EffortNextAction;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Streak
export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastRecordedDate?: string; // YYYY-MM-DD
  updatedAt: Date;
}

// Extended types for UI

export interface EffortWithEvaluation extends Effort {
  evaluation?: EffortEvaluation;
}

export interface DailyRecordWithDetails extends DailyRecord {
  effortEvaluations: (EffortEvaluation & { effort: Effort })[];
}

// GitHub Commit Data
export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

// Suggestion Banner Types
export type SuggestionType = 'level_up' | 'level_down';

export interface Suggestion {
  type: SuggestionType;
  message: string;
  targetLevel?: GoalLevel; // レベルアップの場合、どのレベルを編集可能にするか
  canEditAllGoals: boolean; // レベルダウンの場合はtrue
}

// Daily Report Card for Home Dashboard
export interface DailyReportCard {
  date: string; // YYYY-MM-DD
  displayDate: string; // "2025年12月31日（火）" 形式
  achievementLevel: AchievementLevel;
  commits: GitHubCommit[]; // その日のコミット（最大3件）
  journalExcerpt?: string; // 日報の抜粋（100文字程度）
  hasRecord: boolean; // 記録があるかどうか
}





