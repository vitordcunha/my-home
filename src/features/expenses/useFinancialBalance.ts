import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface FinancialBalance {
  opening_balance: number;
  total_income: number;
  total_expenses: number;
  net_balance: number;
  projected_income: number;
  projected_expenses: number;
  projected_balance: number;
}

export function useFinancialBalance(
  householdId?: string,
  month?: number,
  year?: number
) {
  return useQuery({
    queryKey: ["financialBalance", householdId, month, year],
    queryFn: async (): Promise<FinancialBalance> => {
      if (!householdId) {
        return {
          opening_balance: 0,
          total_income: 0,
          total_expenses: 0,
          net_balance: 0,
          projected_income: 0,
          projected_expenses: 0,
          projected_balance: 0,
        };
      }

      const { data, error } = await supabase.rpc("get_financial_balance", {
        p_household_id: householdId,
        p_month: month || null,
        p_year: year || null,
      });

      if (error) throw error;

      return {
        opening_balance: Number(data?.[0]?.opening_balance || 0),
        total_income: Number(data?.[0]?.total_income || 0),
        total_expenses: Number(data?.[0]?.total_expenses || 0),
        net_balance: Number(data?.[0]?.net_balance || 0),
        projected_income: Number(data?.[0]?.projected_income || 0),
        projected_expenses: Number(data?.[0]?.projected_expenses || 0),
        projected_balance: Number(data?.[0]?.projected_balance || 0),
      };
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export interface TimelineItem {
  date: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: string;
  is_projected: boolean;
  item_id: string;
  competence_date: string | null;
  real_date: string | null;
}

export function useFinancialTimeline(
  householdId?: string,
  month?: number,
  year?: number
) {
  return useQuery({
    queryKey: ["financialTimeline", householdId, month, year],
    queryFn: async (): Promise<TimelineItem[]> => {
      if (!householdId) return [];

      const { data, error } = await supabase.rpc("get_financial_timeline", {
        p_household_id: householdId,
        p_month: month || null,
        p_year: year || null,
      });

      if (error) throw error;
      return (data || []).map((item: any) => ({
        date: item.date,
        type: item.type,
        description: item.description,
        amount: Number(item.amount),
        category: item.category,
        is_projected: item.is_projected,
        item_id: item.item_id,
        competence_date: item.competence_date,
        real_date: item.real_date,
      }));
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

