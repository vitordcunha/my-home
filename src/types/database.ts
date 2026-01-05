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
        };
      };
      tasks_history: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          completed_at: string;
          xp_earned: number;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          completed_at?: string;
          xp_earned: number;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          completed_at?: string;
          xp_earned?: number;
        };
      };
      rewards: {
        Row: {
          id: string;
          nome: string;
          custo_pontos: number;
          resgatado_por: string | null;
          resgatado_em: string | null;
          household_id: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          nome: string;
          custo_pontos: number;
          resgatado_por?: string | null;
          resgatado_em?: string | null;
          household_id?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          nome?: string;
          custo_pontos?: number;
          resgatado_por?: string | null;
          resgatado_em?: string | null;
          household_id?: string | null;
          is_active?: boolean;
        };
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
            | "outros";
          paid_at: string;
          paid_by: string;
          split_type: "equal" | "custom" | "percentage" | "individual";
          split_data: Json;
          is_recurring: boolean;
          recurrence_frequency:
            | "daily"
            | "weekly"
            | "monthly"
            | "yearly"
            | null;
          recurrence_day: number | null;
          next_occurrence_date: string | null;
          shopping_trip_id: string | null;
          maintenance_item_id: string | null;
          receipt_url: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
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
            | "outros";
          paid_at?: string;
          paid_by: string;
          split_type?: "equal" | "custom" | "percentage" | "individual";
          split_data?: Json;
          is_recurring?: boolean;
          recurrence_frequency?:
            | "daily"
            | "weekly"
            | "monthly"
            | "yearly"
            | null;
          recurrence_day?: number | null;
          next_occurrence_date?: string | null;
          shopping_trip_id?: string | null;
          maintenance_item_id?: string | null;
          receipt_url?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
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
            | "outros";
          paid_at?: string;
          paid_by?: string;
          split_type?: "equal" | "custom" | "percentage" | "individual";
          split_data?: Json;
          is_recurring?: boolean;
          recurrence_frequency?:
            | "daily"
            | "weekly"
            | "monthly"
            | "yearly"
            | null;
          recurrence_day?: number | null;
          next_occurrence_date?: string | null;
          shopping_trip_id?: string | null;
          maintenance_item_id?: string | null;
          receipt_url?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
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
      };
    };
  };
}
