// Goal Levels
export type GoalLevel = 'bronze' | 'silver' | 'gold';

// Achievement Levels
export type AchievementLevel = 'none' | 'bronze' | 'silver' | 'gold';

// User Settings
export interface UserSettings {
  id: string;
  recoveryGoal?: string;
  recoveryModeActive?: boolean;
  recoveryModeActivatedDate?: string; // YYYY-MM-DD
  createdAt: Date;
  updatedAt: Date;
}

// Recovery Mode Status
export interface RecoveryModeStatus {
  isActive: boolean;
  goal: string | null;
  activatedDate: string | null;
}

// Goal
export interface Goal {
  id: string;
  userId: string;
  level: GoalLevel;
  description: string | null; // TODOリスト形式に移行後はnullの可能性あり
  createdAt: Date;
  updatedAt: Date;
}

// Daily Record
export interface DailyRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  achievementLevel: AchievementLevel;
  recoveryAchieved?: boolean;
  doText?: string;
  journalText?: string;
  satisfaction?: number; // 1〜5（NULL許容）
  difficultyMemo?: string; // 難易度メモ（NULL許容）
  createdAt: Date;
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

// Goal Todo
export interface GoalTodo {
  id: string;
  goalId: string;
  content: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Other Todo
export interface OtherTodo {
  id: string;
  userId: string;
  content: string;
  isArchived: boolean;
  lastAchievedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Daily Todo Record
export interface DailyTodoRecord {
  id: string;
  dailyRecordId: string;
  todoType: 'goal' | 'other' | 'routine';
  todoId: string;
  isAchieved: boolean;
  createdAt: Date;
}

// Goal History - New UI Design (独立したカード表示用)
export type TransitionType = 'level_up' | 'level_down' | null;

export interface GoalCard {
  id: string;
  level: GoalLevel;
  levelNumber: number; // レベル称号（Lv.1, Lv.2, ...）
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

// Timeline Todo
export interface TimelineTodo {
  id: string;
  userId: string;
  timeTag: string; // HH:MM
  content: string;
  isDeleted: boolean;
  deleteReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Weekly Review Summary
export interface WeeklyReviewSummary {
  currentWeekStats: {
    totalRecords: number;
    bronzeAchieved: number;
    silverAchieved: number;
    goldAchieved: number;
  };
  previousWeekStats: {
    totalRecords: number;
    bronzeAchieved: number;
    silverAchieved: number;
    goldAchieved: number;
  };
}

// Todo Analysis
export interface TodoAnalysisItem {
  todoId: string;
  content: string;
  type: 'goal' | 'routine';
  goalLevel?: GoalLevel; // goal_todoの場合のみ
  totalCount: number;
  achievedCount: number;
  achievementRate: number; // 0-100
}

// Goal Change Memo
export interface GoalChangeMemo {
  id: string;
  userId: string;
  weekStartDate: string;
  content: string;
  createdAt: Date;
}

// Weekly Review Access Log
export interface WeeklyReviewAccessLog {
  id: string;
  userId: string;
  weekStartDate: string;
  editUnlockDate: string;
  createdAt: Date;
}

// Weekly Review Status
export interface WeeklyReviewStatus {
  id: string;
  userId: string;
  weekStartDate: string;
  completedAt: Date | null;
  createdAt: Date;
}

// Goal Change Log
export interface GoalChangeLog {
  id: string;
  userId: string;
  goalType: GoalLevel;
  oldContent: string;
  newContent: string;
  changeReason: string;
  createdAt: Date;
}
