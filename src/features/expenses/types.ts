import { Database } from "@/types/database";

export type Expense = Database["public"]["Tables"]["expenses"]["Row"] & { debt_id?: string | null };
export type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"] & { debt_id?: string | null };
export type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"] & { debt_id?: string | null };

export type ExpenseSplit = Database["public"]["Tables"]["expense_splits"]["Row"];
export type ExpenseSplitInsert = Database["public"]["Tables"]["expense_splits"]["Insert"];
export type ExpenseSplitUpdate = Database["public"]["Tables"]["expense_splits"]["Update"];

export type ExpenseCategory =
  | "casa"
  | "contas"
  | "mercado"
  | "delivery"
  | "limpeza"
  | "manutencao"
  | "custom"
  | "outros";

export type SplitType = "equal" | "custom" | "percentage" | "individual";

export type ExpenseSplitStatus =
  | "pending"
  | "waiting_confirmation"
  | "confirmed"
  | "overdue";

export type ExpensePriority = "P1" | "P2" | "P3" | "P4";

// Labels para prioridades
export const EXPENSE_PRIORITY_LABELS: Record<ExpensePriority, string> = {
  P1: "Essencial",
  P2: "Importante",
  P3: "Desejável",
  P4: "Opcional",
};

// Descrições para prioridades
export const EXPENSE_PRIORITY_DESCRIPTIONS: Record<ExpensePriority, string> = {
  P1: "Aluguel, contas básicas (luz, água, internet)",
  P2: "Mercado, transporte, saúde",
  P3: "Lazer, assinaturas, delivery",
  P4: "Compras não-essenciais",
};

// Configurações financeiras
export interface FinancialSettings {
  id: string;
  household_id: string;
  minimum_reserve_type: "fixed" | "percentage";
  minimum_reserve_value: number;
  weekend_weight: number;
  default_expense_priority: ExpensePriority;
  receive_daily_alert?: boolean;
  alert_low_balance_threshold?: number;
  created_at?: string;
  updated_at?: string;
}

// Helper type para quando queremos expense com informações do pagador
export type ExpenseWithPaidBy = Expense & {
  paid_by_profile?: {
    id: string;
    nome: string;
    avatar: string | null;
  };
  split_with_profiles?: {
    id: string;
    nome: string;
    avatar: string | null;
  }[];
};

// Helper type para expense com seus splits
export type ExpenseWithSplits = Expense & {
  splits: ExpenseSplit[];
};

// Type para o balance retornado pela função get_user_balance
export interface UserBalance {
  owed_by_user: number; // Quanto o usuário deve
  owed_to_user: number; // Quanto devem ao usuário
  net_balance: number; // Saldo líquido (positivo = recebe, negativo = deve)
}

// Type para sugestão de equalização
export interface SettlementTransaction {
  from: string; // user_id
  to: string; // user_id
  amount: number;
  from_profile?: {
    nome: string;
    avatar: string | null;
  };
  to_profile?: {
    nome: string;
    avatar: string | null;
  };
}

// Quick actions categories
export const EXPENSE_QUICK_ACTIONS = [
  { category: "contas" as ExpenseCategory, emoji: "⚡", label: "Luz" },
  { category: "contas" as ExpenseCategory, emoji: "💧", label: "Água" },
  { category: "contas" as ExpenseCategory, emoji: "🌐", label: "Internet" },
  { category: "contas" as ExpenseCategory, emoji: "🔥", label: "Gás" },
  { category: "mercado" as ExpenseCategory, emoji: "🛒", label: "Mercado" },
  { category: "delivery" as ExpenseCategory, emoji: "🍽️", label: "Delivery" },
] as const;

// Category labels
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  casa: "Casa",
  contas: "Contas",
  mercado: "Mercado",
  delivery: "Delivery",
  limpeza: "Limpeza",
  manutencao: "Manutenção",
  custom: "Personalizado",
  outros: "Outros",
};

// Category emojis
export const EXPENSE_CATEGORY_EMOJIS: Record<ExpenseCategory, string> = {
  casa: "🏠",
  contas: "⚡",
  mercado: "🛒",
  delivery: "🍽️",
  limpeza: "🧹",
  manutencao: "🔧",
  custom: "✏️",
  outros: "📦",
};

// Type para agrupar despesas por mês
export interface MonthlyExpenses {
  month: string; // formato: "YYYY-MM"
  monthLabel: string; // formato: "Janeiro 2026"
  total: number;
  expenses: ExpenseWithPaidBy[];
}


