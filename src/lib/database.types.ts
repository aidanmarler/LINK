export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accepted_translations: {
        Row: {
          created_at: string
          currently_accepted: boolean
          id: number
          language: Database["public"]["Enums"]["Language"]
          original_id: number
          translation_id: number
          translation_step: Database["public"]["Enums"]["TranslationStep"]
        }
        Insert: {
          created_at?: string
          currently_accepted: boolean
          id?: number
          language: Database["public"]["Enums"]["Language"]
          original_id: number
          translation_id: number
          translation_step: Database["public"]["Enums"]["TranslationStep"]
        }
        Update: {
          created_at?: string
          currently_accepted?: boolean
          id?: number
          language?: Database["public"]["Enums"]["Language"]
          original_id?: number
          translation_id?: number
          translation_step?: Database["public"]["Enums"]["TranslationStep"]
        }
        Relationships: [
          {
            foreignKeyName: "accepted_translations_original_id_fkey"
            columns: ["original_id"]
            isOneToOne: false
            referencedRelation: "original_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accepted_translations_translation_id_fkey"
            columns: ["translation_id"]
            isOneToOne: false
            referencedRelation: "forward_translations"
            referencedColumns: ["id"]
          },
        ]
      }
      answer_options: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          language: Database["public"]["Enums"]["Language"]
          segment: string
          translation: string
          user_created: string | null
          users_seen: string[] | null
          users_voted: string[] | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          language: Database["public"]["Enums"]["Language"]
          segment: string
          translation: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["Language"]
          segment?: string
          translation?: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
        }
        Relationships: []
      }
      backward_translations: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          language: Database["public"]["Enums"]["Language"]
          original_id: number
          skipped: boolean
          translation: string | null
          translation_id: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: number
          language: Database["public"]["Enums"]["Language"]
          original_id: number
          skipped?: boolean
          translation?: string | null
          translation_id: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: number
          language?: Database["public"]["Enums"]["Language"]
          original_id?: number
          skipped?: boolean
          translation?: string | null
          translation_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backward_translations_original_id_fkey"
            columns: ["original_id"]
            isOneToOne: false
            referencedRelation: "original_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backward_translations_translation_id_fkey"
            columns: ["translation_id"]
            isOneToOne: false
            referencedRelation: "forward_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backward_translations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      completion_guides: {
        Row: {
          comment: string | null
          created_at: string
          form: string
          id: string
          language: Database["public"]["Enums"]["Language"]
          section: string
          segment: string
          translation: string
          user_created: string | null
          users_seen: string[] | null
          users_voted: string[] | null
          variable_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          form: string
          id?: string
          language: Database["public"]["Enums"]["Language"]
          section: string
          segment: string
          translation: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
          variable_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          form?: string
          id?: string
          language?: Database["public"]["Enums"]["Language"]
          section?: string
          segment?: string
          translation?: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
          variable_id?: string
        }
        Relationships: []
      }
      definitions: {
        Row: {
          comment: string | null
          created_at: string
          form: string
          id: string
          language: Database["public"]["Enums"]["Language"]
          section: string
          segment: string
          translation: string
          user_created: string | null
          users_seen: string[] | null
          users_voted: string[] | null
          variable_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          form: string
          id?: string
          language: Database["public"]["Enums"]["Language"]
          section: string
          segment: string
          translation: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
          variable_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          form?: string
          id?: string
          language?: Database["public"]["Enums"]["Language"]
          section?: string
          segment?: string
          translation?: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
          variable_id?: string
        }
        Relationships: []
      }
      forms: {
        Row: {
          comment: string | null
          created_at: string
          form: string
          id: string
          language: Database["public"]["Enums"]["Language"]
          segment: string
          translation: string
          user_created: string | null
          users_seen: string[] | null
          users_voted: string[] | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          form: string
          id?: string
          language: Database["public"]["Enums"]["Language"]
          segment: string
          translation: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          form?: string
          id?: string
          language?: Database["public"]["Enums"]["Language"]
          segment?: string
          translation?: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
        }
        Relationships: []
      }
      forward_translations: {
        Row: {
          comment: string
          created_at: string
          id: number
          language: Database["public"]["Enums"]["Language"]
          original_id: number
          skipped: boolean
          translation: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: number
          language: Database["public"]["Enums"]["Language"]
          original_id: number
          skipped: boolean
          translation?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: number
          language?: Database["public"]["Enums"]["Language"]
          original_id?: number
          skipped?: boolean
          translation?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forward_translations_original_id_fkey"
            columns: ["original_id"]
            isOneToOne: false
            referencedRelation: "original_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forward_translations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          language: Database["public"]["Enums"]["Language"]
          list: string
          original: string
          sublist: string
          translation: string
          user_created: string | null
          users_seen: string[] | null
          users_voted: string[] | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          language: Database["public"]["Enums"]["Language"]
          list: string
          original: string
          sublist: string
          translation: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["Language"]
          list?: string
          original?: string
          sublist?: string
          translation?: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
        }
        Relationships: []
      }
      original_segments: {
        Row: {
          answer_options: string[] | null
          arc_versions: string[]
          created_at: string
          id: number
          location: string[] | null
          presets: string[]
          segment: string
          type: Database["public"]["Enums"]["SegmentType"]
        }
        Insert: {
          answer_options?: string[] | null
          arc_versions: string[]
          created_at?: string
          id?: number
          location?: string[] | null
          presets: string[]
          segment: string
          type: Database["public"]["Enums"]["SegmentType"]
        }
        Update: {
          answer_options?: string[] | null
          arc_versions?: string[]
          created_at?: string
          id?: number
          location?: string[] | null
          presets?: string[]
          segment?: string
          type?: Database["public"]["Enums"]["SegmentType"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clinical_expertise: boolean | null
          created_at: string
          id: string
          is_admin: boolean
          language: string | null
          name: string | null
          profession: string | null
          selected_preset: string | null
        }
        Insert: {
          clinical_expertise?: boolean | null
          created_at?: string
          id: string
          is_admin?: boolean
          language?: string | null
          name?: string | null
          profession?: string | null
          selected_preset?: string | null
        }
        Update: {
          clinical_expertise?: boolean | null
          created_at?: string
          id?: string
          is_admin?: boolean
          language?: string | null
          name?: string | null
          profession?: string | null
          selected_preset?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer_options: string[] | null
          comment: string | null
          created_at: string
          form: string
          id: string
          language: Database["public"]["Enums"]["Language"]
          section: string
          segment: string
          translation: string
          user_created: string | null
          users_seen: string[] | null
          users_voted: string[] | null
          variable_id: string
        }
        Insert: {
          answer_options?: string[] | null
          comment?: string | null
          created_at?: string
          form: string
          id?: string
          language: Database["public"]["Enums"]["Language"]
          section: string
          segment: string
          translation: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
          variable_id: string
        }
        Update: {
          answer_options?: string[] | null
          comment?: string | null
          created_at?: string
          form?: string
          id?: string
          language?: Database["public"]["Enums"]["Language"]
          section?: string
          segment?: string
          translation?: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
          variable_id?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          comment: string | null
          created_at: string
          form: string | null
          id: string
          language: Database["public"]["Enums"]["Language"]
          segment: string
          translation: string
          user_created: string | null
          users_seen: string[] | null
          users_voted: string[] | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          form?: string | null
          id?: string
          language: Database["public"]["Enums"]["Language"]
          segment: string
          translation: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          form?: string | null
          id?: string
          language?: Database["public"]["Enums"]["Language"]
          segment?: string
          translation?: string
          user_created?: string | null
          users_seen?: string[] | null
          users_voted?: string[] | null
        }
        Relationships: []
      }
      translation_progress: {
        Row: {
          admin_comments: string[] | null
          automated_comments: string[] | null
          created_at: string
          id: number
          language: Database["public"]["Enums"]["Language"]
          original_id: number
          translation_step: Database["public"]["Enums"]["TranslationStep"]
        }
        Insert: {
          admin_comments?: string[] | null
          automated_comments?: string[] | null
          created_at?: string
          id?: number
          language: Database["public"]["Enums"]["Language"]
          original_id: number
          translation_step: Database["public"]["Enums"]["TranslationStep"]
        }
        Update: {
          admin_comments?: string[] | null
          automated_comments?: string[] | null
          created_at?: string
          id?: number
          language?: Database["public"]["Enums"]["Language"]
          original_id?: number
          translation_step?: Database["public"]["Enums"]["TranslationStep"]
        }
        Relationships: [
          {
            foreignKeyName: "translation_progress_original_id_fkey"
            columns: ["original_id"]
            isOneToOne: false
            referencedRelation: "original_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_reviews: {
        Row: {
          comments: Json
          created_at: string
          id: number
          language: Database["public"]["Enums"]["Language"]
          original_id: number
          reviewer_id: string
          translation_id: number | null
        }
        Insert: {
          comments: Json
          created_at?: string
          id?: number
          language: Database["public"]["Enums"]["Language"]
          original_id: number
          reviewer_id: string
          translation_id?: number | null
        }
        Update: {
          comments?: Json
          created_at?: string
          id?: number
          language?: Database["public"]["Enums"]["Language"]
          original_id?: number
          reviewer_id?: string
          translation_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "translation_reviews_original_id_fkey"
            columns: ["original_id"]
            isOneToOne: false
            referencedRelation: "original_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_reviews_translation_id_fkey"
            columns: ["translation_id"]
            isOneToOne: false
            referencedRelation: "forward_translations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      LabelType: "form" | "section"
      Language: "spanish" | "french" | "portuguese"
      SegmentType:
        | "listItem"
        | "question"
        | "answerOption"
        | "definition"
        | "completionGuide"
        | "formLabel"
        | "sectionLabel"
      TranslationStep:
        | "forward"
        | "review"
        | "backward"
        | "adjudication"
        | "admin"
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
  public: {
    Enums: {
      LabelType: ["form", "section"],
      Language: ["spanish", "french", "portuguese"],
      SegmentType: [
        "listItem",
        "question",
        "answerOption",
        "definition",
        "completionGuide",
        "formLabel",
        "sectionLabel",
      ],
      TranslationStep: [
        "forward",
        "review",
        "backward",
        "adjudication",
        "admin",
      ],
    },
  },
} as const
