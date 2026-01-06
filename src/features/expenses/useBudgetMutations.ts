import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { BudgetInsert, BudgetUpdate } from "./useBudgetsQuery";
import { useToast } from "@/hooks/use-toast";

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: BudgetInsert) => {
      const { data: budget, error } = await supabase
        .from("budgets")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Orçamento criado",
        description: "Orçamento configurado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: BudgetUpdate & { id: string }) => {
      const { data: budget, error } = await supabase
        .from("budgets")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Orçamento atualizado",
        description: "Orçamento atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Orçamento removido",
        description: "Orçamento removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

