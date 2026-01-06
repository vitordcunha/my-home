import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";

export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];
export type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"];

export function useBudgetsQuery(householdId?: string) {
  return useQuery({
    queryKey: ["budgets", householdId],
    queryFn: async (): Promise<Budget[]> => {
      if (!householdId) return [];

      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("household_id", householdId)
        .order("category", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook para buscar orçamentos do mês atual
export function useCurrentMonthBudgetsQuery(householdId?: string) {
  return useQuery({
    queryKey: ["budgets", "current-month", householdId],
    queryFn: async (): Promise<Array<{ category: string; limit_amount: number }>> => {
      if (!householdId) return [];

      const { data, error } = await supabase.rpc("get_current_month_budgets", {
        p_household_id: householdId,
      });

      if (error) throw error;
      return (
        data?.map((b: any) => ({
          category: b.category,
          limit_amount: Number(b.limit_amount),
        })) || []
      );
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

