import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ExpenseUpdate } from "./types";
import { useToast } from "@/hooks/use-toast";

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: ExpenseUpdate & { id: string }) => {
      const { data: expense, error } = await supabase
        .from("expenses")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return expense;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({
        queryKey: ["financialBalance", data.household_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["financialTimeline", data.household_id],
      });
      toast({
        title: "Despesa atualizada",
        description: "Despesa atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar despesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar household_id antes de deletar para invalidar queries
      const { data: expense } = await supabase
        .from("expenses")
        .select("household_id")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("expenses").delete().eq("id", id);

      if (error) throw error;
      return expense?.household_id;
    },
    onSuccess: (householdId) => {
      if (householdId) {
        queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
        queryClient.invalidateQueries({
          queryKey: ["financialBalance", householdId],
        });
        queryClient.invalidateQueries({
          queryKey: ["financialTimeline", householdId],
        });
      }
      toast({
        title: "Despesa removida",
        description: "Despesa removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover despesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

