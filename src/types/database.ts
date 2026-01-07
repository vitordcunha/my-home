export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          nome: string;
          avatar: string | null;
          total_points: number;
          created_at: string;
          household_id: string | null;
          role: "admin" | "member";
        };
        Insert: {
          id: string;
          nome: string;
          avatar?: string | null;
          total_points?: number;
          created_at?: string;
          household_id?: string | null;
          role?: "admin" | "member";
        };
        Update: {
          id?: string;
          nome?: string;
          avatar?: string | null;
          total_points?: number;
          created_at?: string;
          household_id?: string | null;
          role?: "admin" | "member";
        };
        Relationships: [
          {
            foreignKeyName: "profiles_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      tasks_master: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          xp_value: number;
          recurrence_type: "daily" | "weekly" | "once";
          days_of_week: number[] | null;
          created_at: string;
          created_by: string | null;
          assigned_to: string | null;
          is_active: boolean;
          household_id: string | null;
          rotation_enabled: boolean;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          xp_value: number;
          recurrence_type: "daily" | "weekly" | "once";
          days_of_week?: number[] | null;
          created_at?: string;
          created_by?: string | null;
          assigned_to?: string | null;
          is_active?: boolean;
          household_id?: string | null;
          rotation_enabled?: boolean;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          xp_value?: number;
          recurrence_type?: "daily" | "weekly" | "once";
          days_of_week?: number[] | null;
          created_at?: string;
          created_by?: string | null;
          assigned_to?: string | null;
          is_active?: boolean;
          household_id?: string | null;
          rotation_enabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_master_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      tasks_history: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          completed_at: string;
          created_at: string;
          xp_earned: number;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          completed_at?: string;
          created_at?: string;
          xp_earned: number;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          completed_at?: string;
          created_at?: string;
          xp_earned?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_history_task_id_fkey";
            columns: ["task_id"];
            referencedRelation: "tasks_master";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_history_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      rewards: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          custo_pontos: number;
          resgatado_por: string | null;
          resgatado_em: string | null;
          household_id: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          custo_pontos: number;
          resgatado_por?: string | null;
          resgatado_em?: string | null;
          household_id?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          custo_pontos?: number;
          resgatado_por?: string | null;
          resgatado_em?: string | null;
          household_id?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "rewards_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          household_id: string;
          title: string;
          description: string | null;
          file_path: string;
          file_type: string;
          category: "bill" | "manual" | "contract" | "identity" | "other";
          keywords: string[] | null;
          expiry_date: string | null;
          is_private: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id?: string;
          household_id: string;
          title: string;
          description?: string | null;
          file_path: string;
          file_type: string;
          category: "bill" | "manual" | "contract" | "identity" | "other";
          keywords?: string[] | null;
          expiry_date?: string | null;
          is_private?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          household_id?: string;
          title?: string;
          description?: string | null;
          file_path?: string;
          file_type?: string;
          category?: "bill" | "manual" | "contract" | "identity" | "other";
          keywords?: string[] | null;
          expiry_date?: string | null;
          is_private?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "documents_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      shopping_items: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          category: "alimentos" | "limpeza" | "higiene" | "outros";
          emoji: string;
          added_by: string | null;
          added_at: string;
          is_purchased: boolean;
          purchased_by: string | null;
          purchased_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          category?: "alimentos" | "limpeza" | "higiene" | "outros";
          emoji?: string;
          added_by?: string | null;
          added_at?: string;
          is_purchased?: boolean;
          purchased_by?: string | null;
          purchased_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          category?: "alimentos" | "limpeza" | "higiene" | "outros";
          emoji?: string;
          added_by?: string | null;
          added_at?: string;
          is_purchased?: boolean;
          purchased_by?: string | null;
          purchased_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_items_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      expenses: {
        Row: {
          id: string;
          household_id: string;
          description: string;
          amount: number;
          category:
          | "casa"
          | "contas"
          | "mercado"
          | "delivery"
          | "limpeza"
          | "manutencao"
          | "custom"
          | "outros";
          custom_category: string | null;
          paid_at: string;
          paid_by: string;
          split_type: "equal" | "custom" | "percentage" | "individual";
          split_data: Json;
          is_split: boolean;
          split_with: string[] | null;
          is_recurring: boolean;
          recurrence_frequency:
          | "daily"
          | "weekly"
          | "monthly"
          | "yearly"
          | null;
          recurrence_day: number | null;
          next_occurrence_date: string | null;
          due_date: string | null;
          shopping_trip_id: string | null;
          maintenance_item_id: string | null;
          receipt_url: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          competence_date: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          description: string;
          amount: number;
          category:
          | "casa"
          | "contas"
          | "mercado"
          | "delivery"
          | "limpeza"
          | "manutencao"
          | "custom"
          | "outros";
          custom_category?: string | null;
          paid_at?: string;
          paid_by: string;
          split_type?: "equal" | "custom" | "percentage" | "individual";
          split_data?: Json;
          is_split?: boolean;
          split_with?: string[] | null;
          is_recurring?: boolean;
          recurrence_frequency?:
          | "daily"
          | "weekly"
          | "monthly"
          | "yearly"
          | null;
          recurrence_day?: number | null;
          next_occurrence_date?: string | null;
          due_date?: string | null;
          shopping_trip_id?: string | null;
          maintenance_item_id?: string | null;
          receipt_url?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          competence_date?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          description?: string;
          amount?: number;
          category?:
          | "casa"
          | "contas"
          | "mercado"
          | "delivery"
          | "limpeza"
          | "manutencao"
          | "custom"
          | "outros";
          custom_category?: string | null;
          paid_at?: string;
          paid_by?: string;
          split_type?: "equal" | "custom" | "percentage" | "individual";
          split_data?: Json;
          is_split?: boolean;
          split_with?: string[] | null;
          is_recurring?: boolean;
          recurrence_frequency?:
          | "daily"
          | "weekly"
          | "monthly"
          | "yearly"
          | null;
          recurrence_day?: number | null;
          next_occurrence_date?: string | null;
          due_date?: string | null;
          shopping_trip_id?: string | null;
          maintenance_item_id?: string | null;
          receipt_url?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          competence_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_paid_by_fkey";
            columns: ["paid_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      incomes: {
        Row: {
          id: string;
          household_id: string;
          description: string;
          amount: number;
          category: "salario" | "freelance" | "investimento" | "presente" | "outros";
          received_at: string | null;
          received_by: string;
          is_recurring: boolean;
          recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
          recurrence_day: number | null;
          next_occurrence_date: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          competence_date: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          description: string;
          amount: number;
          category: "salario" | "freelance" | "investimento" | "presente" | "outros";
          received_at?: string | null;
          received_by: string;
          is_recurring?: boolean;
          recurrence_frequency?: "daily" | "weekly" | "monthly" | "yearly" | null;
          recurrence_day?: number | null;
          next_occurrence_date?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          competence_date?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          description?: string;
          amount?: number;
          category?: "salario" | "freelance" | "investimento" | "presente" | "outros";
          received_at?: string | null;
          received_by?: string;
          is_recurring?: boolean;
          recurrence_frequency?: "daily" | "weekly" | "monthly" | "yearly" | null;
          recurrence_day?: number | null;
          next_occurrence_date?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          competence_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "incomes_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incomes_received_by_fkey";
            columns: ["received_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          amount_owed: number;
          status: "pending" | "waiting_confirmation" | "confirmed" | "overdue";
          paid_at: string | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          amount_owed: number;
          status?: "pending" | "waiting_confirmation" | "confirmed" | "overdue";
          paid_at?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          expense_id?: string;
          user_id?: string;
          amount_owed?: number;
          status?: "pending" | "waiting_confirmation" | "confirmed" | "overdue";
          paid_at?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey";
            columns: ["expense_id"];
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_splits_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      budgets: {
        Row: {
          id: string;
          household_id: string;
          category:
          | "casa"
          | "contas"
          | "mercado"
          | "delivery"
          | "limpeza"
          | "manutencao"
          | "custom"
          | "outros";
          limit_amount: number;
          budget_month: number | null;
          budget_year: number | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          category:
          | "casa"
          | "contas"
          | "mercado"
          | "delivery"
          | "limpeza"
          | "manutencao"
          | "custom"
          | "outros";
          limit_amount: number;
          budget_month?: number | null;
          budget_year?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          category?:
          | "casa"
          | "contas"
          | "mercado"
          | "delivery"
          | "limpeza"
          | "manutencao"
          | "custom"
          | "outros";
          limit_amount?: number;
          budget_month?: number | null;
          budget_year?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      maintenance_items: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          description: string | null;
          location:
          | "cozinha"
          | "sala"
          | "quarto1"
          | "quarto2"
          | "quarto3"
          | "banheiro"
          | "lavanderia"
          | "area_externa"
          | "garagem"
          | "entrada"
          | "deposito"
          | "outro";
          priority: "urgent" | "important" | "whenever";
          action_type: "call_technician" | "diy" | "waiting_parts" | "contact";
          technician_specialty: string | null;
          status: "open" | "in_progress" | "waiting" | "resolved" | "archived";
          assigned_to: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          estimated_cost: number | null;
          actual_cost: number | null;
          time_spent_minutes: number | null;
          expense_id: string | null;
          photos: string[] | null;
          created_at: string;
          created_by: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          description?: string | null;
          location:
          | "cozinha"
          | "sala"
          | "quarto1"
          | "quarto2"
          | "quarto3"
          | "banheiro"
          | "lavanderia"
          | "area_externa"
          | "garagem"
          | "entrada"
          | "deposito"
          | "outro";
          priority: "urgent" | "important" | "whenever";
          action_type: "call_technician" | "diy" | "waiting_parts" | "contact";
          technician_specialty?: string | null;
          status?: "open" | "in_progress" | "waiting" | "resolved" | "archived";
          assigned_to?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          time_spent_minutes?: number | null;
          expense_id?: string | null;
          photos?: string[] | null;
          created_at?: string;
          created_by: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          title?: string;
          description?: string | null;
          location?:
          | "cozinha"
          | "sala"
          | "quarto1"
          | "quarto2"
          | "quarto3"
          | "banheiro"
          | "lavanderia"
          | "area_externa"
          | "garagem"
          | "entrada"
          | "deposito"
          | "outro";
          priority?: "urgent" | "important" | "whenever";
          action_type?: "call_technician" | "diy" | "waiting_parts" | "contact";
          technician_specialty?: string | null;
          status?: "open" | "in_progress" | "waiting" | "resolved" | "archived";
          assigned_to?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          time_spent_minutes?: number | null;
          expense_id?: string | null;
          photos?: string[] | null;
          created_at?: string;
          created_by?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_items_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      maintenance_history: {
        Row: {
          id: string;
          household_id: string;
          maintenance_item_id: string | null;
          recurring_maintenance_id: string | null;
          title: string;
          location: string;
          performed_at: string;
          performed_by: string;
          description: string | null;
          cost: number | null;
          time_spent_minutes: number | null;
          photos: string[] | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          maintenance_item_id?: string | null;
          recurring_maintenance_id?: string | null;
          title: string;
          location: string;
          performed_at?: string;
          performed_by: string;
          description?: string | null;
          cost?: number | null;
          time_spent_minutes?: number | null;
          photos?: string[] | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          maintenance_item_id?: string | null;
          recurring_maintenance_id?: string | null;
          title?: string;
          location?: string;
          performed_at?: string;
          performed_by?: string;
          description?: string | null;
          cost?: number | null;
          time_spent_minutes?: number | null;
          photos?: string[] | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_history_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      recurring_maintenances: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          description: string | null;
          location: string;
          frequency_type: "days" | "weeks" | "months" | "years";
          frequency_value: number;
          notification_days_before: number;
          assigned_to: string | null;
          instructions: string | null;
          helpful_links: string[] | null;
          last_performed_at: string | null;
          next_due_date: string;
          is_active: boolean;
          created_at: string;
          created_by: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          description?: string | null;
          location: string;
          frequency_type: "days" | "weeks" | "months" | "years";
          frequency_value: number;
          notification_days_before?: number;
          assigned_to?: string | null;
          instructions?: string | null;
          helpful_links?: string[] | null;
          last_performed_at?: string | null;
          next_due_date: string;
          is_active?: boolean;
          created_at?: string;
          created_by: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          title?: string;
          description?: string | null;
          location?: string;
          frequency_type?: "days" | "weeks" | "months" | "years";
          frequency_value?: number;
          notification_days_before?: number;
          assigned_to?: string | null;
          instructions?: string | null;
          helpful_links?: string | null;
          last_performed_at?: string | null;
          next_due_date?: string;
          is_active?: boolean;
          created_at?: string;
          created_by?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_maintenances_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {
      get_financial_balance: {
        Args: {
          p_household_id: string;
          p_month?: number | null;
          p_year?: number | null;
        };
        Returns: Array<{
          opening_balance: number;
          total_income: number;
          total_expenses: number;
          net_balance: number;
          projected_income: number;
          projected_expenses: number;
          projected_balance: number;
        }>;
      };
      get_financial_timeline: {
        Args: {
          p_household_id: string;
          p_month?: number | null;
          p_year?: number | null;
        };
        Returns: Array<{
          date: string;
          type: string;
          description: string;
          amount: number;
          category: string;
          is_projected: boolean;
          item_id: string;
          competence_date: string | null;
          real_date: string | null;
        }>;
      };
      get_current_month_budgets: {
        Args: {
          p_household_id: string;
        };
        Returns: Array<{
          category: string;
          limit_amount: number;
        }>;
      };
      get_user_balance: {
        Args: {
          p_user_id: string;
          p_household_id: string;
        };
        Returns: {
          owed_by_user: number;
          owed_to_user: number;
          net_balance: number;
        };
      };
      undo_task_completion: {
        Args: {
          p_history_id: string;
        };
        Returns: Array<{
          task_id: string;
          user_id: string;
          xp_deducted: number;
        }>;
      };
      complete_shopping_trip: {
        Args: {
          p_item_ids: string[];
          p_user_id: string;
        };
        Returns: Array<{
          items_completed: number;
          xp_earned: number;
          user_id: string;
        }>;
      };
    };
  };
}
