// Goal Levels
export type GoalLevel = 'bronze' | 'silver' | 'gold';

// Achievement Levels
export type AchievementLevel = 'none' | 'bronze' | 'silver' | 'gold';

// User Settings
export interface UserSettings {
  id: string;
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

// Daily Record
export interface DailyRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  achievementLevel: AchievementLevel;
  doText?: string;
  journalText?: string;
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
  learningItems: string[]; // ユーザー入力の学習内容（doTextから生成、最大3件）
  journalExcerpt?: string; // 日報の抜粋（100文字程度）
}

// Goal History
export type GoalChangeReason =
  | 'bronze_14days'    // Bronze 14日連続達成
  | 'silver_14days'    // Silver 14日連続達成
  | 'gold_14days'      // Gold 14日連続達成
  | '7days_4fails'     // 7日中4日未達
  | 'initial';         // 初回設定

export interface GoalHistorySlot {
  id: string;
  userId: string;
  bronzeGoal: string;
  silverGoal: string;
  goldGoal: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD、現在進行中の場合はundefined
  changeReason: GoalChangeReason;
  createdAt: Date;
  updatedAt: Date;
}

// Goal History - New UI Design (独立したカード表示用)
export type TransitionType = 'level_up' | 'level_down' | null;

export interface GoalCard {
  id: string;
  level: GoalLevel;
  content: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // nullの場合は現在進行中
  transitionType: TransitionType; // 次のカードへの遷移タイプ
  currentStreak?: number; // 現在進行中のカードのみ（各レベルで個別に管理）
}

export interface GoalHistory {
  bronze: GoalCard[];
  silver: GoalCard[];
  gold: GoalCard[];
}

