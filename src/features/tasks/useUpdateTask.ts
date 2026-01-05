import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";

type TaskUpdate = Database["public"]["Tables"]["tasks_master"]["Update"];

interface UpdateTaskParams {
  id: string;
  nome: string;
  descricao?: string;
  xp_value: number;
  recurrence_type: "daily" | "weekly" | "once";
  days_of_week?: number[];
  assigned_to?: string;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTaskParams) => {
      const { data, error } = await supabase
        .from("tasks_master")
        // @ts-ignore - Supabase type inference issue
        .update({
          nome: updates.nome,
          descricao: updates.descricao || null,
          xp_value: updates.xp_value,
          recurrence_type: updates.recurrence_type,
          days_of_week: updates.days_of_week || null,
          assigned_to: updates.assigned_to || null,
        } as TaskUpdate)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      vibrate(50);

      toast({
        title: "✅ Tarefa atualizada!",
        description: "As alterações foram salvas.",
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
        title: "❌ Erro ao atualizar",
        description: truncatedError,
      });
    },
  });
}
