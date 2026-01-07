import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { IncomeInsert, IncomeUpdate } from "./useIncomesQuery";
import { useToast } from "@/hooks/use-toast";

interface AddIncomeData
  extends Omit<IncomeInsert, "id" | "created_at" | "updated_at"> { }

export function useAddIncome() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: AddIncomeData) => {
      const { data: income, error } = await supabase
        .from("incomes")
        .insert({
          household_id: data.household_id,
          description: data.description,
          amount: data.amount,
          category: data.category,
          received_at: data.received_at,
          received_by: data.received_by,
          is_recurring: data.is_recurring || false,
          recurrence_frequency: data.recurrence_frequency,
          recurrence_day: data.recurrence_day,
          next_occurrence_date: data.next_occurrence_date,
          created_by: data.created_by,
        })
        .select()
        .single();

      if (error) throw error;
      return income;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["incomes", variables.household_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["financialBalance", variables.household_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["financialTimeline", variables.household_id],
      });
      toast({
        title: "Receita registrada!",
        description: `${variables.description} registrada com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar receita",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: IncomeUpdate & { id: string }) => {
      const { data: income, error } = await supabase
        .from("incomes")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return income;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({
        queryKey: ["financialBalance", data.household_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["financialTimeline", data.household_id],
      });
      toast({
        title: "Receita atualizada",
        description: "Receita atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar receita",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar household_id antes de deletar para invalidar queries
      const { data: income } = await supabase
        .from("incomes")
        .select("household_id")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("incomes").delete().eq("id", id);

      if (error) throw error;
      return income?.household_id;
    },
    onSuccess: (householdId) => {
      if (householdId) {
        queryClient.invalidateQueries({ queryKey: ["incomes", householdId] });
        queryClient.invalidateQueries({
          queryKey: ["financialBalance", householdId],
        });
        queryClient.invalidateQueries({
          queryKey: ["financialTimeline", householdId],
        });
      }
      toast({
        title: "Receita removida",
        description: "Receita removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover receita",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

