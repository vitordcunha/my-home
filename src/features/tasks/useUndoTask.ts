import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { TaskWithStatus } from "./useTasksQuery";
import { Database } from "@/types/database";
import { vibrate } from "@/lib/utils";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UndoTaskParams {
  historyId: string;
  userId: string;
  xpValue: number;
  taskName: string;
  taskId: string;
}

export function useUndoTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ historyId }: { historyId: string }) => {
      const { data, error } = await supabase.rpc("undo_task_completion", {
        p_history_id: historyId,
      });

      if (error) throw error;
      
      // The function returns a table with one row
      if (!data || data.length === 0) {
        throw new Error("Não foi possível desfazer a tarefa");
      }
      
      return data[0];
    },

    onMutate: async ({ historyId, userId, xpValue, taskName, taskId }: UndoTaskParams) => {
      // Vibrate for tactile feedback
      vibrate(50);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["tasks", "today"] });
      await queryClient.cancelQueries({ queryKey: ["profile", userId] });
      await queryClient.cancelQueries({ queryKey: ["history"] });

      // Snapshot previous values
      const previousTasks = queryClient.getQueryData(["tasks", "today"]);
      const previousProfile = queryClient.getQueryData(["profile", userId]);
      const previousHistory = queryClient.getQueryData(["history"]);

      // Optimistically update user points (deduct)
      queryClient.setQueryData<Profile>(["profile", userId], (old) => {
        if (!old) return old;
        return {
          ...old,
          total_points: Math.max(0, old.total_points - xpValue),
        };
      });

      // Optimistically remove from history
      queryClient.setQueryData<any[]>(["history"], (old) => {
        if (!old) return [];
        return old.filter((item) => item.id !== historyId);
      });

      // Note: We don't optimistically add the task back to the board
      // because we need to check if it should appear today based on recurrence rules
      // This will be handled by invalidating the query

      // Show success toast
      const truncatedTaskName = taskName.length > 40 ? taskName.substring(0, 40) + "..." : taskName;
      toast({
        title: "Tarefa desfeita!",
        description: `-${xpValue} pts · ${truncatedTaskName}`,
      });

      return { previousTasks, previousProfile, previousHistory };
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
      if (context?.previousHistory) {
        queryClient.setQueryData(["history"], context.previousHistory);
      }

      // Show error toast
      toast({
        variant: "destructive",
        title: "Falha ao desfazer",
        description: "Não foi possível desfazer a tarefa. Tente novamente.",
      });

      console.error("Error undoing task:", error);
    },

    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

