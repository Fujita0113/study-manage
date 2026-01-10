export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          level: 'bronze' | 'silver' | 'gold'
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          level: 'bronze' | 'silver' | 'gold'
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          level?: 'bronze' | 'silver' | 'gold'
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      daily_records: {
        Row: {
          id: string
          user_id: string
          date: string
          achievement_level: 'none' | 'bronze' | 'silver' | 'gold'
          do_text: string | null
          journal_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          achievement_level: 'none' | 'bronze' | 'silver' | 'gold'
          do_text?: string | null
          journal_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          achievement_level?: 'none' | 'bronze' | 'silver' | 'gold'
          do_text?: string | null
          journal_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_recorded_date: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_recorded_date?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          last_recorded_date?: string | null
          updated_at?: string
        }
      }
      goal_history: {
        Row: {
          id: string
          user_id: string
          bronze_goal: string
          silver_goal: string
          gold_goal: string
          start_date: string
          end_date: string | null
          change_reason: 'bronze_14days' | 'silver_14days' | 'gold_14days' | '7days_4fails' | 'initial'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bronze_goal: string
          silver_goal: string
          gold_goal: string
          start_date: string
          end_date?: string | null
          change_reason: 'bronze_14days' | 'silver_14days' | 'gold_14days' | '7days_4fails' | 'initial'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bronze_goal?: string
          silver_goal?: string
          gold_goal?: string
          start_date?: string
          end_date?: string | null
          change_reason?: 'bronze_14days' | 'silver_14days' | 'gold_14days' | '7days_4fails' | 'initial'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
