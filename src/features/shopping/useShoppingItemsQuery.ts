import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ShoppingItem } from "./types";

export function useShoppingItemsQuery(householdId?: string) {
  return useQuery({
    queryKey: ["shopping-items", householdId],
    queryFn: async () => {
      if (!householdId) {
        return [];
      }

      const { data, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("household_id", householdId)
        .eq("is_purchased", false)
        .order("added_at", { ascending: false });

      if (error) throw error;

      return data as ShoppingItem[];
    },
    enabled: !!householdId,
  });
}



