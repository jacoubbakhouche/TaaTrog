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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checker_requests: {
        Row: {
          admin_notes: string | null
          age: number
          created_at: string
          display_name: string
          experience: string | null
          gender: string
          id: string
          languages: string[] | null
          social_media: Json | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          age: number
          created_at?: string
          display_name: string
          experience?: string | null
          gender: string
          id?: string
          languages?: string[] | null
          social_media?: Json | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          age?: number
          created_at?: string
          display_name?: string
          experience?: string | null
          gender?: string
          id?: string
          languages?: string[] | null
          social_media?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checkers: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string
          description: string | null
          display_name: string
          gallery_images: string[] | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_online: boolean | null
          languages: string[] | null
          price: number | null
          rating: number | null
          reviews_count: number | null
          social_media: Json | null
          tests_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          gallery_images?: string[] | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_online?: boolean | null
          languages?: string[] | null
          price?: number | null
          rating?: number | null
          reviews_count?: number | null
          social_media?: Json | null
          tests_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          gallery_images?: string[] | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_online?: boolean | null
          languages?: string[] | null
          price?: number | null
          rating?: number | null
          reviews_count?: number | null
          social_media?: Json | null
          tests_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          checker_id: string
          status: "pending_approval" | "approved" | "rejected" | "payment_pending" | "paid" | "completed" | "cancelled"
          price: number
          receipt_url?: string | null
          created_at: string
          updated_at: string
          id: string
          loyalty_test_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          client_id: string
          checker_id: string
          status?: "pending_approval" | "approved" | "rejected" | "payment_pending" | "paid" | "completed" | "cancelled"
          price: number
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
          loyalty_test_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          client_id?: string
          checker_id?: string
          status?: "pending_approval" | "approved" | "rejected" | "payment_pending" | "paid" | "completed" | "cancelled"
          price?: number
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
          loyalty_test_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_checker_id_fkey"
            columns: ["checker_id"]
            isOneToOne: false
            referencedRelation: "checkers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_loyalty_test_id_fkey"
            columns: ["loyalty_test_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tests: {
        Row: {
          checker_id: string | null
          contact_method: string
          created_at: string
          id: string
          notes: string | null
          report: string | null
          report_files: string[] | null
          status: string | null
          target_contact: string
          target_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checker_id?: string | null
          contact_method: string
          created_at?: string
          id?: string
          notes?: string | null
          report?: string | null
          report_files?: string[] | null
          status?: string | null
          target_contact: string
          target_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checker_id?: string | null
          contact_method?: string
          created_at?: string
          id?: string
          notes?: string | null
          report?: string | null
          report_files?: string[] | null
          status?: string | null
          target_contact?: string
          target_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_tests_checker_id_fkey"
            columns: ["checker_id"]
            isOneToOne: false
            referencedRelation: "checkers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          loyalty_test_id: string
          payment_method: string
          proof_image_url: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          loyalty_test_id: string
          payment_method: string
          proof_image_url?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          loyalty_test_id?: string
          payment_method?: string
          proof_image_url?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_loyalty_test_id_fkey"
            columns: ["loyalty_test_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          birthdate: string | null
          created_at: string
          full_name: string | null
          gender: string | null
          id: string
          phone: string | null
          referral_source: string | null
          role: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          birthdate?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          referral_source?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          birthdate?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          referral_source?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "checker"
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
      app_role: ["admin", "moderator", "user", "checker"],
    },
  },
} as const
