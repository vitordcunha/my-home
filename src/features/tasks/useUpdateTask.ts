import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";
import { TaskWithStatus } from "./useTasksQuery";

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

interface UpdateTaskContext {
  previousTasks: TaskWithStatus[] | undefined;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<unknown, Error, UpdateTaskParams, UpdateTaskContext>({
    mutationFn: async ({ id, ...updates }: UpdateTaskParams) => {
      const { data, error } = await supabase
        .from("tasks_master")
        // @ts-expect-error - Supabase type inference issue
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

    onMutate: async ({ id, ...updates }: UpdateTaskParams) => {
      // Vibrate for tactile feedback
      vibrate(50);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot previous values
      const previousTasks = queryClient.getQueryData<TaskWithStatus[]>([
        "tasks",
        "today",
      ]);

      // Optimistic update - update task in list
      queryClient.setQueryData<TaskWithStatus[]>(["tasks", "today"], (old) => {
        if (!old) return old;
        return old
          .map((task) => {
            if (task.id === id) {
              return {
                ...task,
                nome: updates.nome,
                descricao:
                  updates.descricao !== undefined
                    ? updates.descricao || null
                    : task.descricao,
                xp_value: updates.xp_value,
                recurrence_type: updates.recurrence_type,
                days_of_week:
                  updates.days_of_week !== undefined
                    ? updates.days_of_week || null
                    : task.days_of_week,
                assigned_to:
                  updates.assigned_to !== undefined
                    ? updates.assigned_to || null
                    : task.assigned_to,
                updated_at: new Date().toISOString(),
              } as TaskWithStatus;
            }
            return task;
          })
          .sort((a, b) => a.nome.localeCompare(b.nome));
      });

      // Show success toast
      toast({
        title: "Tarefa atualizada!",
        description: "As alterações foram salvas.",
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
        title: "Erro ao atualizar",
        description: truncatedError,
      });
    },

    onSuccess: () => {
      // Invalidate queries to refetch tasks
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
