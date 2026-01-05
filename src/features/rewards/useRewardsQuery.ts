import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";

type Reward = Database["public"]["Tables"]["rewards"]["Row"];

export function useRewardsQuery() {
  return useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("is_active", true)
        .is("resgatado_por", null)
        .order("custo_pontos");

      if (error) throw error;
      return data as Reward[];
    },
  });
}

export function useRedeemedRewardsQuery(userId: string) {
  return useQuery({
    queryKey: ["rewards", "redeemed", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("resgatado_por", userId)
        .order("resgatado_em", { ascending: false });

      if (error) throw error;
      return data as Reward[];
    },
    enabled: !!userId,
  });
}
