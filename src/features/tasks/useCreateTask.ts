import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { TaskWithStatus } from "./useTasksQuery";
import { Database } from "@/types/database";

type TaskMaster = Database["public"]["Tables"]["tasks_master"]["Row"];

interface CreateTaskParams {
  nome: string;
  descricao?: string;
  xp_value: number;
  recurrence_type: "daily" | "weekly" | "once";
  days_of_week?: number[];
  created_by: string;
  assigned_to?: string;
  household_id: string;
  rotation_enabled?: boolean;
}

interface CreateTaskContext {
  previousTasks: TaskWithStatus[] | undefined;
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<TaskMaster, Error, CreateTaskParams, CreateTaskContext>({
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
          rotation_enabled: task.rotation_enabled || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onMutate: async (task: CreateTaskParams) => {
      // Vibrate for tactile feedback
      vibrate(50);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot previous values
      const previousTasks = queryClient.getQueryData<TaskWithStatus[]>([
        "tasks",
        "today",
      ]);

      // Check if task should appear today based on recurrence
      const today = new Date().getDay();
      let shouldShowToday = false;

      if (task.recurrence_type === "daily") {
        shouldShowToday = true;
      } else if (task.recurrence_type === "weekly") {
        shouldShowToday = task.days_of_week?.includes(today) ?? false;
      } else if (task.recurrence_type === "once") {
        // Once tasks show if they haven't been completed
        shouldShowToday = true;
      }

      // Optimistic update - add task to list if it should appear today
      if (shouldShowToday) {
        queryClient.setQueryData<TaskWithStatus[]>(
          ["tasks", "today"],
          (old) => {
            const optimisticTask: TaskWithStatus = {
              id: `temp-${Date.now()}`,
              nome: task.nome,
              descricao: task.descricao || null,
              xp_value: task.xp_value,
              recurrence_type: task.recurrence_type,
              days_of_week: task.days_of_week || null,
              created_by: task.created_by,
              assigned_to: task.assigned_to || null,
              is_active: true,
              household_id: task.household_id,
              rotation_enabled: task.rotation_enabled || false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_completed_today: false,
            } as TaskWithStatus;

            const newTasks = [...(old || []), optimisticTask];
            // Sort alphabetically by nome
            return newTasks.sort((a, b) => a.nome.localeCompare(b.nome));
          }
        );
      }

      // Show success toast
      toast({
        title: "Tarefa criada!",
        description: "A nova tarefa está disponível.",
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
        title: "Erro ao criar tarefa",
        description: truncatedError,
      });
    },

    onSuccess: () => {
      // Invalidate queries to refetch tasks
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
