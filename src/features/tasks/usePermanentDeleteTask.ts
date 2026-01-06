import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";

type Task = Database["public"]["Tables"]["tasks_master"]["Row"];

export function usePermanentDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks_master")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    },
    onMutate: async (taskId: string) => {
      // Vibrate for tactile feedback
      vibrate(50);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["tasks", "archived"] });

      // Snapshot previous values
      const previousArchivedTasks = queryClient.getQueryData<Task[]>([
        "tasks",
        "archived",
      ]);

      // Optimistic update - remove task from archived list
      queryClient.setQueryData<Task[]>(["tasks", "archived"], (old) => {
        if (!old) return [];
        return old.filter((task) => task.id !== taskId);
      });

      // Show success toast
      toast({
        title: "Tarefa excluída permanentemente!",
        description: "A tarefa foi removida definitivamente.",
      });

      return { previousArchivedTasks };
    },
    onError: (error: Error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousArchivedTasks !== undefined) {
        queryClient.setQueryData(
          ["tasks", "archived"],
          context.previousArchivedTasks
        );
      }

      // Vibração de erro
      if (navigator.vibrate) {
        navigator.vibrate([100, 30, 100]);
      }

      toast({
        title: "Erro ao excluir tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "archived"] });
    },
  });
}
