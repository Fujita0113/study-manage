export interface AchievementData {
  date: string; // YYYY-MM-DD
  level: number; // 0=未記録, 1=Bronze, 2=Silver, 3=Gold
}

export interface LevelHistoryData {
  date: string; // YYYY-MM-DD
  bronze: number; // Lv.1, Lv.2...
  silver: number;
  gold: number;
  bronzeContent: string;
  silverContent: string;
  goldContent: string;
}

export interface GoalLevelHistoryRecord {
  id: string;
  user_id: string;
  goal_type: 'bronze' | 'silver' | 'gold';
  level: number;
  goal_content: string;
  started_at: string;
  ended_at: string | null;
  change_reason: 'initial' | 'level_up' | 'level_down';
  created_at: string;
  updated_at: string;
}
