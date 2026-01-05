import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ExpenseInsert } from "./types";
import { toast } from "@/hooks/use-toast";

interface AddExpenseData
  extends Omit<ExpenseInsert, "id" | "created_at" | "updated_at"> {}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddExpenseData) => {
      const { data: expense, error } = await supabase
        .from("expenses")
        .insert({
          household_id: data.household_id,
          description: data.description,
          amount: data.amount,
          category: data.category,
          custom_category: data.custom_category,
          paid_at: data.paid_at,
          paid_by: data.paid_by,
          is_split: data.is_split || false,
          split_with: data.split_with || [],
          split_type: data.split_type || "equal",
          split_data: data.split_data || {},
          is_recurring: data.is_recurring || false,
          recurrence_frequency: data.recurrence_frequency,
          recurrence_day: data.recurrence_day,
          shopping_trip_id: data.shopping_trip_id,
          maintenance_item_id: data.maintenance_item_id,
          receipt_url: data.receipt_url,
          created_by: data.created_by,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return expense;
    },
    onMutate: async (newExpense) => {
      // Vibração ao adicionar
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["expenses", newExpense.household_id],
      });

      // Snapshot do estado anterior
      const previousExpenses = queryClient.getQueryData([
        "expenses",
        newExpense.household_id,
      ]);

      // Optimistic update
      queryClient.setQueryData(
        ["expenses", newExpense.household_id],
        (old: any) => {
          const optimisticExpense = {
            ...newExpense,
            id: `temp-${Date.now()}`,
            paid_at: newExpense.paid_at || new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            paid_by_profile: {
              id: newExpense.paid_by,
              nome: "Você",
              avatar: null,
            },
          };
          return [optimisticExpense, ...(old || [])];
        }
      );

      return { previousExpenses };
    },
    onError: (err, newExpense, context) => {
      // Rollback
      if (context?.previousExpenses) {
        queryClient.setQueryData(
          ["expenses", newExpense.household_id],
          context.previousExpenses
        );
      }

      // Vibração de erro
      if (navigator.vibrate) {
        navigator.vibrate([100, 30, 100]);
      }

      toast({
        variant: "destructive",
        title: "Erro ao adicionar despesa",
        description: err instanceof Error ? err.message : "Tente novamente",
      });
    },
    onSuccess: (_data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ["expenses", variables.household_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["userBalance", variables.paid_by, variables.household_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["totalSpent", variables.household_id],
      });

      // Toast de sucesso
      toast({
        title: "✅ Despesa registrada!",
        description: `${variables.description} • +10 pts`,
      });
    },
  });
}
