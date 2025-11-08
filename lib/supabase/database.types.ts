export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          role: 'user' | 'admin'
          cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null
          credit_balance: number
          subscription_status: 'free' | 'basic' | 'standard' | 'pro'
          subscription_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          role?: 'user' | 'admin'
          cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null
          credit_balance?: number
          subscription_status?: 'free' | 'basic' | 'standard' | 'pro'
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          role?: 'user' | 'admin'
          cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null
          credit_balance?: number
          subscription_status?: 'free' | 'basic' | 'standard' | 'pro'
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: number
          user_id: string
          name: string
          description: string | null
          parent_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          description?: string | null
          parent_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          description?: string | null
          parent_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: number
          user_id: string
          folder_id: number | null
          title: string
          author: string | null
          file_type: string
          file_url: string
          file_size: number
          cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null
          status: 'uploaded' | 'processing' | 'ready' | 'failed'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          folder_id?: number | null
          title: string
          author?: string | null
          file_type: string
          file_url: string
          file_size: number
          cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null
          status?: 'uploaded' | 'processing' | 'ready' | 'failed'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          folder_id?: number | null
          title?: string
          author?: string | null
          file_type?: string
          file_url?: string
          file_size?: number
          cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null
          status?: 'uploaded' | 'processing' | 'ready' | 'failed'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      chunks: {
        Row: {
          id: number
          material_id: number
          content: string
          chunk_index: number
          start_position: number
          end_position: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: number
          material_id: number
          content: string
          chunk_index: number
          start_position: number
          end_position: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: number
          material_id?: number
          content?: string
          chunk_index?: number
          start_position?: number
          end_position?: number
          metadata?: Json
          created_at?: string
        }
      }
      worksheets: {
        Row: {
          id: number
          material_id: number
          user_id: string
          title: string
          description: string | null
          cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null
          content: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          material_id: number
          user_id: string
          title: string
          description?: string | null
          cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null
          content: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          material_id?: number
          user_id?: string
          title?: string
          description?: string | null
          cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null
          content?: Json
          created_at?: string
          updated_at?: string
        }
      }
      learning_sessions: {
        Row: {
          id: number
          user_id: string
          worksheet_id: number
          progress: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          worksheet_id: number
          progress?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          worksheet_id?: number
          progress?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      feedback: {
        Row: {
          id: number
          user_id: string
          worksheet_id: number | null
          feedback_type: 'interpretation' | 'grammar' | 'vocabulary' | 'question'
          input_text: string
          output_text: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          worksheet_id?: number | null
          feedback_type: 'interpretation' | 'grammar' | 'vocabulary' | 'question'
          input_text: string
          output_text: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          worksheet_id?: number | null
          feedback_type?: 'interpretation' | 'grammar' | 'vocabulary' | 'question'
          input_text?: string
          output_text?: string
          metadata?: Json
          created_at?: string
        }
      }
      vocabulary: {
        Row: {
          id: number
          user_id: string
          word: string
          translation: string | null
          context: string | null
          material_id: number | null
          next_review_at: string
          review_count: number
          ease_factor: number
          interval_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          word: string
          translation?: string | null
          context?: string | null
          material_id?: number | null
          next_review_at?: string
          review_count?: number
          ease_factor?: number
          interval_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          word?: string
          translation?: string | null
          context?: string | null
          material_id?: number | null
          next_review_at?: string
          review_count?: number
          ease_factor?: number
          interval_days?: number
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: number
          user_id: string
          amount: number
          transaction_type: 'purchase' | 'usage' | 'refund' | 'subscription'
          description: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          amount: number
          transaction_type: 'purchase' | 'usage' | 'refund' | 'subscription'
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          amount?: number
          transaction_type?: 'purchase' | 'usage' | 'refund' | 'subscription'
          description?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: number
          user_id: string
          plan: 'free' | 'basic' | 'standard' | 'pro'
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          plan: 'free' | 'basic' | 'standard' | 'pro'
          status?: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          plan?: 'free' | 'basic' | 'standard' | 'pro'
          status?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
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
      user_role: 'user' | 'admin'
      subscription_status: 'free' | 'basic' | 'standard' | 'pro'
      material_status: 'uploaded' | 'processing' | 'ready' | 'failed'
      cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
      feedback_type: 'interpretation' | 'grammar' | 'vocabulary' | 'question'
      transaction_type: 'purchase' | 'usage' | 'refund' | 'subscription'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
