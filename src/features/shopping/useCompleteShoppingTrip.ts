import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { CompleteShoppingTripResult } from "./types";

interface ExpenseData {
  amount: number;
  isSplit: boolean;
  splitWith: string[];
}

interface CompleteShoppingTripParams {
  itemIds: string[];
  userId: string;
  householdId: string;
  expenseData?: ExpenseData;
}

export function useCompleteShoppingTrip() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemIds,
      userId,
      householdId,
      expenseData,
    }: CompleteShoppingTripParams) => {
      // Complete shopping trip
      // @ts-expect-error - Supabase type mismatch with new RPC function
      const { data, error } = await supabase.rpc("complete_shopping_trip", {
        p_item_ids: itemIds,
        p_user_id: userId,
      });

      if (error) throw error;

      const result = data[0] as CompleteShoppingTripResult;

      // If expense data provided, create expense
      if (expenseData && expenseData.amount > 0) {
        const { error: expenseError } = await supabase.from("expenses").insert({
          household_id: householdId,
          description: "Compras de mercado",
          amount: expenseData.amount,
          category: "mercado",
          paid_by: userId,
          is_split: expenseData.isSplit,
          split_with:
            expenseData.isSplit && expenseData.splitWith.length > 0
              ? expenseData.splitWith
              : null,
          split_type: expenseData.isSplit ? "equal" : "individual",
          created_by: userId,
        } as any);

        if (expenseError) {
          console.error("Error creating expense:", expenseError);
          // Don't throw, just log - shopping trip was successful
        }
      }

      return result;
    },

    onMutate: async () => {
      // Vibrate for tactile feedback
      vibrate(100);
    },

    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao finalizar compras",
        description: "Não foi possível salvar as compras. Tente novamente.",
      });
      console.error("Error completing shopping trip:", error);
    },

    onSuccess: (data, variables) => {
      // Show success toast with XP earned
      if (data.items_count > 0) {
        const baseXp = data.xp_earned;
        const expenseXp = variables.expenseData ? 10 : 0;
        const totalXp = baseXp + expenseXp;

        toast({
          title: "Compras finalizadas!",
          description: `Você comprou ${data.items_count} ${
            data.items_count === 1 ? "item" : "itens"
          } e ganhou ${totalXp} pts!${
            expenseXp > 0 ? " (+10 pts pela despesa)" : ""
          }`,
          duration: 5000,
        });
      }

      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });

      // Invalidate expense queries if expense was created
      if (variables.expenseData) {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["totalSpent"] });
      }
    },
  });
}
