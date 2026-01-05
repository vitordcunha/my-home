import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { TaskWithStatus } from "./useTasksQuery";
import { Database } from "@/types/database";
import { vibrate } from "@/lib/utils";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface CompleteTaskParams {
  taskId: string;
  userId: string;
  xpValue: number;
  taskName: string;
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, userId, xpValue }: CompleteTaskParams) => {
      // @ts-expect-error - Supabase type mismatch
      const { data, error } = await supabase.from("tasks_history").insert({
        task_id: taskId,
        user_id: userId,
        xp_earned: xpValue,
      }).select().single();

      if (error) throw error;
      return data;
    },

    onMutate: async ({ taskId, userId, xpValue, taskName }) => {
      // Vibrate for tactile feedback
      vibrate(50);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["tasks", "today"] });
      await queryClient.cancelQueries({ queryKey: ["profile", userId] });

      // Snapshot previous values
      const previousTasks = queryClient.getQueryData(["tasks", "today"]);
      const previousProfile = queryClient.getQueryData(["profile", userId]);

      // Optimistically update tasks list (remove completed task)
      queryClient.setQueryData<TaskWithStatus[]>(["tasks", "today"], (old) => {
        if (!old) return [];
        return old.filter((task) => task.id !== taskId);
      });

      // Optimistically update user points
      queryClient.setQueryData<Profile>(["profile", userId], (old) => {
        if (!old) return old;
        return {
          ...old,
          total_points: old.total_points + xpValue,
        };
      });

      // Show success toast
      const truncatedTaskName = taskName.length > 40 ? taskName.substring(0, 40) + "..." : taskName;
      toast({
        title: "✅ Tarefa concluída!",
        description: `+${xpValue} pts · ${truncatedTaskName}`,
      });

      return { previousTasks, previousProfile };
    },

    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", "today"], context.previousTasks);
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(
          ["profile", variables.userId],
          context.previousProfile
        );
      }

      // Show error toast
      toast({
        variant: "destructive",
        title: "❌ Falha ao sincronizar",
        description: "Não foi possível salvar a tarefa. Tente novamente.",
      });

      console.error("Error completing task:", error);
    },

    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}
