import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { UserBalance } from "./types";

export function useUserBalanceQuery(userId?: string, householdId?: string) {
  return useQuery({
    queryKey: ["userBalance", userId, householdId],
    queryFn: async (): Promise<UserBalance> => {
      if (!userId || !householdId) {
        return {
          owed_by_user: 0,
          owed_to_user: 0,
          net_balance: 0,
        };
      }

      const { data, error } = await supabase.rpc("get_user_balance", {
        p_user_id: userId,
        p_household_id: householdId,
      });

      if (error) throw error;

      return (
        data || {
          owed_by_user: 0,
          owed_to_user: 0,
          net_balance: 0,
        }
      );
    },
    enabled: !!userId && !!householdId,
    staleTime: 1000 * 60, // 1 minute (atualiza mais frequente)
  });
}


