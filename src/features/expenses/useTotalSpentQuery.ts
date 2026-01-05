import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useTotalSpentQuery(householdId?: string) {
  return useQuery({
    queryKey: ["totalSpent", householdId],
    queryFn: async (): Promise<number> => {
      if (!householdId) return 0;

      const { data, error } = await supabase
        .from("expenses")
        .select("amount")
        .eq("household_id", householdId);

      if (error) throw error;

      const total = (data || []).reduce((sum, expense) => sum + Number(expense.amount), 0);
      return total;
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

