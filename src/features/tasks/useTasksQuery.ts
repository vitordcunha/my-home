import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { isWithinLast24Hours } from "@/lib/utils";
import { Database } from "@/types/database";

type TaskMaster = Database["public"]["Tables"]["tasks_master"]["Row"];
type TaskHistory = Database["public"]["Tables"]["tasks_history"]["Row"];

export interface TaskWithStatus extends TaskMaster {
  is_completed_today: boolean;
}

interface UseTasksQueryOptions {
  onlyMyTasks?: boolean;
  userId?: string;
}

export function useTasksQuery(options?: UseTasksQueryOptions) {
  const { onlyMyTasks = true, userId } = options || {};

  return useQuery({
    queryKey: ["tasks", "today", onlyMyTasks, userId],
    queryFn: async () => {
      // Get all active tasks
      let query = supabase
        .from("tasks_master")
        .select("*")
        .eq("is_active", true);

      // Filter by user if onlyMyTasks is true and userId is provided
      if (onlyMyTasks && userId) {
        query = query.or(`assigned_to.eq.${userId},assigned_to.is.null`);
      }

      const { data: tasks, error: tasksError } = await query.order("nome");

      if (tasksError) throw tasksError;

      // Get today's task history
      const { data: history, error: historyError } = await supabase
        .from("tasks_history")
        .select("*")
        .gte(
          "completed_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );

      if (historyError) throw historyError;

      // Filter tasks for today
      const today = new Date().getDay(); // 0-6 (Sunday-Saturday)

      const tasksForToday = (tasks as TaskMaster[])
        .filter((task) => {
          // Check recurrence
          if (task.recurrence_type === "once") {
            // Show once tasks that haven't been completed ever
            return !(history as TaskHistory[]).some(
              (h) => h.task_id === task.id
            );
          }

          if (task.recurrence_type === "daily") {
            return true; // Daily tasks always show
          }

          if (task.recurrence_type === "weekly") {
            // Check if today is in days_of_week
            return task.days_of_week?.includes(today) ?? false;
          }

          return false;
        })
        .map((task) => {
          // Check if completed in last 24h
          const completedRecently = (history as TaskHistory[]).some(
            (h) => h.task_id === task.id && isWithinLast24Hours(h.completed_at)
          );

          return {
            ...task,
            is_completed_today: completedRecently,
          } as TaskWithStatus;
        })
        .filter((task) => !task.is_completed_today); // Only show uncompleted tasks

      return tasksForToday;
    },
  });
}
