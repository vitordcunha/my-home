import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";

interface CreateTaskParams {
  nome: string;
  descricao?: string;
  xp_value: number;
  recurrence_type: "daily" | "weekly" | "once";
  days_of_week?: number[];
  created_by: string;
  assigned_to?: string;
  household_id: string;
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (task: CreateTaskParams) => {
      const { data, error } = await supabase
        .from("tasks_master")
        // @ts-expect-error - Supabase type mismatch
        .insert({
          nome: task.nome,
          descricao: task.descricao || null,
          xp_value: task.xp_value,
          recurrence_type: task.recurrence_type,
          days_of_week: task.days_of_week || null,
          created_by: task.created_by,
          assigned_to: task.assigned_to || null,
          is_active: true,
          household_id: task.household_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      vibrate(50);

      toast({
        title: "Tarefa criada!",
        description: "A nova tarefa está disponível.",
      });

      // Invalidate queries to refetch tasks
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },

    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Tente novamente";
      const truncatedError =
        errorMessage.length > 60
          ? errorMessage.substring(0, 60) + "..."
          : errorMessage;
      toast({
        variant: "destructive",
        title: "Erro ao criar tarefa",
        description: truncatedError,
      });
    },
  });
}
