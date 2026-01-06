import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";
import { TaskWithStatus } from "./useTasksQuery";

type TaskUpdate = Database["public"]["Tables"]["tasks_master"]["Update"];

interface DeleteTaskContext {
  previousTasks: TaskWithStatus[] | undefined;
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<unknown, Error, string, DeleteTaskContext>({
    mutationFn: async (taskId: string) => {
      // Soft delete: set is_active to false
      const { data, error } = await supabase
        .from("tasks_master")
        .update({ is_active: false } as TaskUpdate)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onMutate: async (taskId: string) => {
      // Vibrate for tactile feedback
      vibrate(50);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot previous values
      const previousTasks = queryClient.getQueryData<TaskWithStatus[]>([
        "tasks",
        "today",
      ]);

      // Optimistic update - remove task from list
      queryClient.setQueryData<TaskWithStatus[]>(["tasks", "today"], (old) => {
        if (!old) return [];
        return old.filter((task) => task.id !== taskId);
      });

      // Show success toast
      toast({
        title: "Tarefa removida",
        description: "A tarefa foi desativada.",
      });

      return { previousTasks };
    },

    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(["tasks", "today"], context.previousTasks);
      }

      // Vibração de erro
      if (navigator.vibrate) {
        navigator.vibrate([100, 30, 100]);
      }

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

    onSuccess: () => {
      // Invalidate queries to refetch tasks
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
