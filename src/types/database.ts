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
      budgets: {
        Row: {
          budget_month: number | null
          budget_year: number | null
          category: string
          created_at: string | null
          created_by: string | null
          household_id: string
          id: string
          limit_amount: number
          updated_at: string | null
        }
        Insert: {
          budget_month?: number | null
          budget_year?: number | null
          category: string
          created_at?: string | null
          created_by?: string | null
          household_id: string
          id?: string
          limit_amount: number
          updated_at?: string | null
        }
        Update: {
          budget_month?: number | null
          budget_year?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          household_id?: string
          id?: string
          limit_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string | null
          created_by: string | null
          due_day: number | null
          household_id: string
          id: string
          interest_rate: number
          is_active: boolean | null
          minimum_payment_fixed: number | null
          minimum_payment_percentage: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          due_day?: number | null
          household_id: string
          id?: string
          interest_rate?: number
          is_active?: boolean | null
          minimum_payment_fixed?: number | null
          minimum_payment_percentage?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          due_day?: number | null
          household_id?: string
          id?: string
          interest_rate?: number
          is_active?: boolean | null
          minimum_payment_fixed?: number | null
          minimum_payment_percentage?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          expiry_date: string | null
          file_path: string
          file_type: string
          household_id: string
          id: string
          is_private: boolean
          keywords: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_path: string
          file_type: string
          household_id: string
          id?: string
          is_private?: boolean
          keywords?: string[] | null
          title: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_path?: string
          file_type?: string
          household_id?: string
          id?: string
          is_private?: boolean
          keywords?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_splits: {
        Row: {
          amount_owed: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          expense_id: string
          id: string
          paid_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_owed: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          expense_id: string
          id?: string
          paid_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_owed?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          expense_id?: string
          id?: string
          paid_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          competence_date: string | null
          created_at: string | null
          created_by: string | null
          custom_category: string | null
          debt_id: string | null
          description: string
          due_date: string | null
          household_id: string
          id: string
          is_recurring: boolean | null
          is_split: boolean | null
          maintenance_item_id: string | null
          next_occurrence_date: string | null
          paid_at: string
          paid_by: string
          priority: string | null
          receipt_url: string | null
          recurrence_day: number | null
          recurrence_frequency: string | null
          shopping_trip_id: string | null
          split_data: Json | null
          split_type: string
          split_with: string[] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          competence_date?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_category?: string | null
          debt_id?: string | null
          description: string
          due_date?: string | null
          household_id: string
          id?: string
          is_recurring?: boolean | null
          is_split?: boolean | null
          maintenance_item_id?: string | null
          next_occurrence_date?: string | null
          paid_at?: string
          paid_by: string
          priority?: string | null
          receipt_url?: string | null
          recurrence_day?: number | null
          recurrence_frequency?: string | null
          shopping_trip_id?: string | null
          split_data?: Json | null
          split_type?: string
          split_with?: string[] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          competence_date?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_category?: string | null
          debt_id?: string | null
          description?: string
          due_date?: string | null
          household_id?: string
          id?: string
          is_recurring?: boolean | null
          is_split?: boolean | null
          maintenance_item_id?: string | null
          next_occurrence_date?: string | null
          paid_at?: string
          paid_by?: string
          priority?: string | null
          receipt_url?: string | null
          recurrence_day?: number | null
          recurrence_frequency?: string | null
          shopping_trip_id?: string | null
          split_data?: Json | null
          split_type?: string
          split_with?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_settings: {
        Row: {
          alert_threshold_days: number | null
          created_at: string | null
          default_expense_priority: string | null
          enable_low_balance_alerts: boolean | null
          household_id: string
          id: string
          minimum_reserve_type: string | null
          minimum_reserve_value: number | null
          updated_at: string | null
          weekend_weight: number | null
        }
        Insert: {
          alert_threshold_days?: number | null
          created_at?: string | null
          default_expense_priority?: string | null
          enable_low_balance_alerts?: boolean | null
          household_id: string
          id?: string
          minimum_reserve_type?: string | null
          minimum_reserve_value?: number | null
          updated_at?: string | null
          weekend_weight?: number | null
        }
        Update: {
          alert_threshold_days?: number | null
          created_at?: string | null
          default_expense_priority?: string | null
          enable_low_balance_alerts?: boolean | null
          household_id?: string
          id?: string
          minimum_reserve_type?: string | null
          minimum_reserve_value?: number | null
          updated_at?: string | null
          weekend_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_settings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invite_code: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          category: string
          competence_date: string | null
          created_at: string | null
          created_by: string | null
          description: string
          household_id: string
          id: string
          is_recurring: boolean | null
          next_occurrence_date: string | null
          received_at: string | null
          received_by: string
          recurrence_day: number | null
          recurrence_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          competence_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          household_id: string
          id?: string
          is_recurring?: boolean | null
          next_occurrence_date?: string | null
          received_at?: string | null
          received_by: string
          recurrence_day?: number | null
          recurrence_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          competence_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          household_id?: string
          id?: string
          is_recurring?: boolean | null
          next_occurrence_date?: string | null
          received_at?: string | null
          received_by?: string
          recurrence_day?: number | null
          recurrence_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incomes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_history: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          household_id: string
          id: string
          location: string
          maintenance_item_id: string | null
          notes: string | null
          performed_at: string | null
          performed_by: string
          photos: string[] | null
          recurring_maintenance_id: string | null
          time_spent_minutes: number | null
          title: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          household_id: string
          id?: string
          location: string
          maintenance_item_id?: string | null
          notes?: string | null
          performed_at?: string | null
          performed_by: string
          photos?: string[] | null
          recurring_maintenance_id?: string | null
          time_spent_minutes?: number | null
          title: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          household_id?: string
          id?: string
          location?: string
          maintenance_item_id?: string | null
          notes?: string | null
          performed_at?: string | null
          performed_by?: string
          photos?: string[] | null
          recurring_maintenance_id?: string | null
          time_spent_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_history_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_history_maintenance_item_id_fkey"
            columns: ["maintenance_item_id"]
            isOneToOne: false
            referencedRelation: "maintenance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_items: {
        Row: {
          action_type: string
          actual_cost: number | null
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string | null
          estimated_cost: number | null
          expense_id: string | null
          household_id: string
          id: string
          location: string
          photos: string[] | null
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          technician_specialty: string | null
          time_spent_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_type: string
          actual_cost?: number | null
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          estimated_cost?: number | null
          expense_id?: string | null
          household_id: string
          id?: string
          location: string
          photos?: string[] | null
          priority: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          technician_specialty?: string | null
          time_spent_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          actual_cost?: number | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          estimated_cost?: number | null
          expense_id?: string | null
          household_id?: string
          id?: string
          location?: string
          photos?: string[] | null
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          technician_specialty?: string | null
          time_spent_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_items_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_updates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          maintenance_item_id: string
          update_type: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          maintenance_item_id: string
          update_type?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          maintenance_item_id?: string
          update_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_updates_maintenance_item_id_fkey"
            columns: ["maintenance_item_id"]
            isOneToOne: false
            referencedRelation: "maintenance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          household_id: string | null
          id: string
          nome: string
          role: string | null
          total_points: number
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          household_id?: string | null
          id: string
          nome: string
          role?: string | null
          total_points?: number
        }
        Update: {
          avatar?: string | null
          created_at?: string
          household_id?: string | null
          id?: string
          nome?: string
          role?: string | null
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_maintenances: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string | null
          frequency_type: string
          frequency_value: number
          helpful_links: string[] | null
          household_id: string
          id: string
          instructions: string | null
          is_active: boolean | null
          last_performed_at: string | null
          location: string
          next_due_date: string
          notification_days_before: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          frequency_type: string
          frequency_value: number
          helpful_links?: string[] | null
          household_id: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          last_performed_at?: string | null
          location: string
          next_due_date: string
          notification_days_before?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          frequency_type?: string
          frequency_value?: number
          helpful_links?: string[] | null
          household_id?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          last_performed_at?: string | null
          location?: string
          next_due_date?: string
          notification_days_before?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_maintenances_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_maintenances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_maintenances_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          custo_pontos: number
          descricao: string | null
          household_id: string | null
          id: string
          is_active: boolean
          nome: string
          resgatado_em: string | null
          resgatado_por: string | null
        }
        Insert: {
          created_at?: string
          custo_pontos: number
          descricao?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean
          nome: string
          resgatado_em?: string | null
          resgatado_por?: string | null
        }
        Update: {
          created_at?: string
          custo_pontos?: number
          descricao?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          resgatado_em?: string | null
          resgatado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_resgatado_por_fkey"
            columns: ["resgatado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          added_at: string
          added_by: string | null
          category: string | null
          created_at: string
          emoji: string | null
          household_id: string
          id: string
          is_purchased: boolean
          name: string
          notes: string | null
          purchased_at: string | null
          purchased_by: string | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          category?: string | null
          created_at?: string
          emoji?: string | null
          household_id: string
          id?: string
          is_purchased?: boolean
          name: string
          notes?: string | null
          purchased_at?: string | null
          purchased_by?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          category?: string | null
          created_at?: string
          emoji?: string | null
          household_id?: string
          id?: string
          is_purchased?: boolean
          name?: string
          notes?: string | null
          purchased_at?: string | null
          purchased_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_history: {
        Row: {
          completed_at: string
          id: string
          task_id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          id?: string
          task_id: string
          user_id: string
          xp_earned: number
        }
        Update: {
          completed_at?: string
          id?: string
          task_id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_master: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          days_of_week: number[] | null
          descricao: string | null
          household_id: string | null
          id: string
          is_active: boolean
          nome: string
          recurrence_type: string
          rotation_enabled: boolean
          xp_value: number
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          days_of_week?: number[] | null
          descricao?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean
          nome: string
          recurrence_type: string
          rotation_enabled?: boolean
          xp_value: number
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          days_of_week?: number[] | null
          descricao?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          recurrence_type?: string
          rotation_enabled?: boolean
          xp_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_master_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_master_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_contacts: {
        Row: {
          average_cost: number | null
          created_at: string | null
          created_by: string
          email: string | null
          household_id: string
          id: string
          last_called_at: string | null
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          specialty: string
          times_called: number | null
          updated_at: string | null
        }
        Insert: {
          average_cost?: number | null
          created_at?: string | null
          created_by: string
          email?: string | null
          household_id: string
          id?: string
          last_called_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          specialty: string
          times_called?: number | null
          updated_at?: string | null
        }
        Update: {
          average_cost?: number | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          household_id?: string
          id?: string
          last_called_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          specialty?: string
          times_called?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_contacts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_shopping_trip: {
        Args: { p_item_ids: string[]; p_user_id: string }
        Returns: {
          items_count: number
          xp_earned: number
        }[]
      }
      create_household_for_user: {
        Args: { p_household_name: string; p_user_id: string }
        Returns: string
      }
      generate_invite_code: { Args: never; Returns: string }
      get_budget_for_category: {
        Args: {
          p_category: string
          p_household_id: string
          p_month?: number
          p_year?: number
        }
        Returns: number
      }
      get_current_month_budgets: {
        Args: { p_household_id: string }
        Returns: {
          budget_id: string
          category: string
          limit_amount: number
        }[]
      }
      get_financial_balance: {
        Args: { p_household_id: string; p_month?: number; p_year?: number }
        Returns: {
          net_balance: number
          opening_balance: number
          projected_balance: number
          projected_expenses: number
          projected_income: number
          total_expenses: number
          total_income: number
        }[]
      }
      get_financial_timeline: {
        Args: { p_household_id: string; p_month?: number; p_year?: number }
        Returns: {
          amount: number
          category: string
          competence_date: string
          date: string
          description: string
          is_projected: boolean
          item_id: string
          real_date: string
          type: string
        }[]
      }
      get_frequent_shopping_items: {
        Args: { p_household_id: string; p_limit?: number }
        Returns: {
          category: string
          emoji: string
          name: string
          purchase_count: number
        }[]
      }
      get_household_monthly_total: {
        Args: { p_household_id: string; p_month: string }
        Returns: number
      }
      get_todays_completed_tasks: {
        Args: { user_uuid: string }
        Returns: {
          task_id: string
        }[]
      }
      get_user_balance: {
        Args: { p_household_id: string; p_user_id: string }
        Returns: {
          net_balance: number
          owed_by_user: number
          owed_to_user: number
        }[]
      }
      get_user_household_id: { Args: { user_id: string }; Returns: string }
      get_user_total_spent: {
        Args: { p_household_id: string; p_user_id: string }
        Returns: number
      }
      is_task_completed_recently: {
        Args: { p_task_id: string }
        Returns: boolean
      }
      join_household_by_code: {
        Args: { p_invite_code: string; p_user_id: string }
        Returns: string
      }
      mark_overdue_expense_splits: { Args: never; Returns: undefined }
      regenerate_invite_code: {
        Args: { p_household_id: string }
        Returns: string
      }
      remove_household_member: {
        Args: { p_admin_id: string; p_member_id: string }
        Returns: boolean
      }
      suggest_expense_priority: {
        Args: { p_category: string }
        Returns: string
      }
      undo_task_completion: {
        Args: { p_history_id: string }
        Returns: {
          task_id: string
          user_id: string
          xp_deducted: number
        }[]
      }
      validate_days_of_week: { Args: { days: number[] }; Returns: boolean }
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

