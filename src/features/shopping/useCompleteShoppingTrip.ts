import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { CompleteShoppingTripResult, ShoppingItem } from "./types";
import { ExpenseWithPaidBy } from "../expenses/types";
import { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

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

interface CompleteShoppingTripContext {
  previousItems: ShoppingItem[] | undefined;
  previousProfile: Profile | null | undefined;
  previousExpenses: ExpenseWithPaidBy[] | undefined;
}

export function useCompleteShoppingTrip() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    CompleteShoppingTripResult,
    Error,
    CompleteShoppingTripParams,
    CompleteShoppingTripContext
  >({
    mutationFn: async ({
      itemIds,
      userId,
      householdId,
      expenseData,
    }: CompleteShoppingTripParams) => {
      // Complete shopping trip
      const { data, error } = await supabase.rpc("complete_shopping_trip", {
        p_item_ids: itemIds,
        p_user_id: userId,
      });

      if (error) throw error;

      const result = (data as unknown as CompleteShoppingTripResult[])[0];

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
        });

        if (expenseError) {
          console.error("Error creating expense:", expenseError);
          // Don't throw, just log - shopping trip was successful
        }
      }

      return result;
    },

    onMutate: async ({
      itemIds,
      userId,
      householdId,
      expenseData,
    }: CompleteShoppingTripParams) => {
      // Vibrate for tactile feedback
      vibrate(100);

      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ["shopping-items", householdId],
      });
      await queryClient.cancelQueries({ queryKey: ["profile", userId] });
      if (expenseData) {
        await queryClient.cancelQueries({
          queryKey: ["expenses", householdId],
        });
      }

      // Snapshot previous values
      const previousItems = queryClient.getQueryData<ShoppingItem[]>([
        "shopping-items",
        householdId,
      ]);
      const previousProfile = queryClient.getQueryData<Profile>([
        "profile",
        userId,
      ]);
      const previousExpenses = expenseData
        ? queryClient.getQueryData<ExpenseWithPaidBy[]>([
          "expenses",
          householdId,
        ])
        : undefined;

      // Calculate expected XP (5 points per item + 10 for expense if applicable)
      const baseXp = itemIds.length * 5;
      const expenseXp = expenseData ? 10 : 0;
      const totalXp = baseXp + expenseXp;

      // Optimistic update - remove purchased items from list
      queryClient.setQueryData<ShoppingItem[]>(
        ["shopping-items", householdId],
        (old) => {
          if (!old) return [];
          return old.filter((item) => !itemIds.includes(item.id));
        }
      );

      // Optimistic update - add points to user profile
      queryClient.setQueryData<Profile>(["profile", userId], (old) => {
        if (!old) return old;
        return {
          ...old,
          total_points: old.total_points + totalXp,
        };
      });

      // Optimistic update - add expense if expenseData provided
      if (expenseData && expenseData.amount > 0) {
        queryClient.setQueryData<ExpenseWithPaidBy[]>(
          ["expenses", householdId],
          (old) => {
            const optimisticExpense: ExpenseWithPaidBy = {
              id: `temp-${Date.now()}`,
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
              paid_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              maintenance_item_id: null,
              paid_by_profile: {
                id: userId,
                nome: "Você",
                avatar: null,
              },
              split_with_profiles: [],
            } as unknown as ExpenseWithPaidBy;

            return [optimisticExpense, ...(old || [])];
          }
        );
      }

      // Show success toast
      toast({
        title: "Compras finalizadas!",
        description: `Você comprou ${itemIds.length} ${itemIds.length === 1 ? "item" : "itens"
          } e ganhou ${totalXp} pts!${expenseXp > 0 ? " (+10 pts pela despesa)" : ""
          }`,
        duration: 5000,
      });

      return { previousItems, previousProfile, previousExpenses };
    },

    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(
          ["shopping-items", variables.householdId],
          context.previousItems
        );
      }
      if (context?.previousProfile && variables.userId) {
        queryClient.setQueryData(
          ["profile", variables.userId],
          context.previousProfile
        );
      }
      if (context?.previousExpenses !== undefined && variables.expenseData) {
        queryClient.setQueryData(
          ["expenses", variables.householdId],
          context.previousExpenses
        );
      }

      // Vibração de erro será feita pelo hook useHaptic nos componentes

      toast({
        variant: "destructive",
        title: "Erro ao finalizar compras",
        description: "Não foi possível salvar as compras. Tente novamente.",
      });
      console.error("Error completing shopping trip:", error);
    },

    onSuccess: (_data, variables) => {
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
