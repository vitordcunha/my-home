import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { TaskWithStatus } from "./useTasksQuery";
import { Database } from "@/types/database";

type Task = Database["public"]["Tables"]["tasks_master"]["Row"];

interface RestoreTaskContext {
  previousArchivedTasks: Task[] | undefined;
  previousTasks: TaskWithStatus[] | undefined;
}

export function useRestoreTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Task, Error, string, RestoreTaskContext>({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from("tasks_master")
        .update({ is_active: true })
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
      const previousArchivedTasks = queryClient.getQueryData<Task[]>([
        "tasks",
        "archived",
      ]);
      const previousTasks = queryClient.getQueryData<TaskWithStatus[]>([
        "tasks",
        "today",
      ]);

      // Get the task from archived list
      const archivedTasks = previousArchivedTasks || [];
      const taskToRestore = archivedTasks.find((t) => t.id === taskId);

      // Optimistic update - remove from archived list
      queryClient.setQueryData<Task[]>(["tasks", "archived"], (old) => {
        if (!old) return [];
        return old.filter((task) => task.id !== taskId);
      });

      // Optimistic update - add to today's tasks if it should appear today
      if (taskToRestore) {
        const today = new Date().getDay();
        let shouldShowToday = false;

        if (taskToRestore.recurrence_type === "daily") {
          shouldShowToday = true;
        } else if (taskToRestore.recurrence_type === "weekly") {
          shouldShowToday = taskToRestore.days_of_week?.includes(today) ?? false;
        } else if (taskToRestore.recurrence_type === "once") {
          shouldShowToday = true;
        }

        if (shouldShowToday) {
          queryClient.setQueryData<TaskWithStatus[]>(
            ["tasks", "today"],
            (old) => {
              const restoredTask: TaskWithStatus = {
                ...taskToRestore,
                is_active: true,
                is_completed_today: false,
              } as TaskWithStatus;

              const newTasks = [...(old || []), restoredTask];
              return newTasks.sort((a, b) => a.nome.localeCompare(b.nome));
            }
          );
        }
      }

      // Show success toast
      toast({
        title: "Tarefa restaurada!",
        description: "A tarefa foi restaurada com sucesso.",
      });

      return { previousArchivedTasks, previousTasks };
    },
    onError: (error: Error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousArchivedTasks !== undefined) {
        queryClient.setQueryData(
          ["tasks", "archived"],
          context.previousArchivedTasks
        );
      }
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(["tasks", "today"], context.previousTasks);
      }

      // Vibração de erro
      if (navigator.vibrate) {
        navigator.vibrate([100, 30, 100]);
      }

      toast({
        title: "Erro ao restaurar tarefa",
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
