import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";

type TaskUpdate = Database["public"]["Tables"]["tasks_master"]["Update"];

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string) => {
      // Soft delete: set is_active to false
      const { data, error } = await supabase
        .from("tasks_master")
        // @ts-ignore - Supabase type inference issue
        .update({ is_active: false } as TaskUpdate)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      vibrate(50);

      toast({
        title: "Tarefa removida",
        description: "A tarefa foi desativada.",
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
        title: "Erro ao remover",
        description: truncatedError,
      });
    },
  });
}
