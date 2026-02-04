export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      daily_records: {
        Row: {
          achievement_level: string
          created_at: string
          date: string
          do_text: string | null
          id: string
          journal_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_level?: string
          created_at?: string
          date: string
          do_text?: string | null
          id?: string
          journal_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_level?: string
          created_at?: string
          date?: string
          do_text?: string | null
          id?: string
          journal_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_todo_records: {
        Row: {
          id: string
          daily_record_id: string
          todo_type: string
          todo_id: string
          is_achieved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          daily_record_id: string
          todo_type: string
          todo_id: string
          is_achieved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          daily_record_id?: string
          todo_type?: string
          todo_id?: string
          is_achieved?: boolean
          created_at?: string
        }
        Relationships: []
      }
      goal_history_slots: {
        Row: {
          bronze_goal: string
          change_reason: string
          created_at: string
          end_date: string | null
          gold_goal: string
          id: string
          silver_goal: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bronze_goal: string
          change_reason: string
          created_at?: string
          end_date?: string | null
          gold_goal: string
          id?: string
          silver_goal: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bronze_goal?: string
          change_reason?: string
          created_at?: string
          end_date?: string | null
          gold_goal?: string
          id?: string
          silver_goal?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_level_history: {
        Row: {
          id: string
          user_id: string
          goal_type: string
          level: number
          goal_content: string
          started_at: string
          ended_at: string | null
          change_reason: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: string
          level: number
          goal_content: string
          started_at: string
          ended_at?: string | null
          change_reason: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: string
          level?: number
          goal_content?: string
          started_at?: string
          ended_at?: string | null
          change_reason?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      goal_todos: {
        Row: {
          id: string
          goal_id: string
          content: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          content: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          content?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
          change_reason: string
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
          change_reason: string
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
          change_reason?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level: 'bronze' | 'silver' | 'gold'
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level: 'bronze' | 'silver' | 'gold'
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level?: 'bronze' | 'silver' | 'gold'
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      other_todos: {
        Row: {
          id: string
          user_id: string
          content: string
          is_archived: boolean
          last_achieved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          is_archived?: boolean
          last_achieved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          is_archived?: boolean
          last_achieved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number
          id: string
          last_recorded_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_recorded_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_recorded_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suggestion_display_log: {
        Row: {
          created_at: string
          display_date: string
          id: string
          suggestion_type: string
          target_level: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_date: string
          id?: string
          suggestion_type: string
          target_level?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_date?: string
          id?: string
          suggestion_type?: string
          target_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      daily_records_with_goals: {
        Row: {
          achievement_level: string | null
          bronze_goal: string | null
          created_at: string | null
          date: string | null
          do_text: string | null
          gold_goal: string | null
          id: string | null
          journal_text: string | null
          silver_goal: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

