/**
 * Supabase データベース型定義
 * データモデル: docs/data-model.md
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GoalLevel = 'bronze' | 'silver' | 'gold';
export type AchievementLevel = 'none' | 'bronze' | 'silver' | 'gold';

export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          level: GoalLevel;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          level: GoalLevel;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          level?: GoalLevel;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_records: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          achievement_level: AchievementLevel;
          do_text: string | null;
          journal_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          achievement_level?: AchievementLevel;
          do_text?: string | null;
          journal_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          achievement_level?: AchievementLevel;
          do_text?: string | null;
          journal_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_recorded_date: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_recorded_date?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_recorded_date?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
