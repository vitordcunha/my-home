export type TransactionType = "income" | "expense";

export type IncomeCategory = "salario" | "freelance" | "investimento" | "presente" | "outros";
export type ExpenseCategory = "casa" | "contas" | "mercado" | "delivery" | "limpeza" | "manutencao" | "outros";

export type MatchType = "exact" | "similar" | "none";

export interface ImportedTransaction {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: IncomeCategory | ExpenseCategory;
  confidence: number;
  match_type: MatchType;
  matched_id?: string;
  // UI state
  selected?: boolean; // For user to select which transactions to import
  edited?: boolean; // If user has edited the transaction
}

export interface ImportSummary {
  total_transactions: number;
  total_income: number;
  total_expenses: number;
  matched_transactions: number;
  categories: string[];
}

export interface ProcessStatementResponse {
  transactions: ImportedTransaction[];
  summary: ImportSummary;
}

export interface ProcessStatementRequest {
  statement_text: string;
  household_id: string;
  month: number;
  year: number;
  existing_incomes?: Array<{
    id: string;
    description: string;
    amount: number;
    received_at: string;
  }>;
  existing_expenses?: Array<{
    id: string;
    description: string;
    amount: number;
    paid_at: string;
  }>;
}



