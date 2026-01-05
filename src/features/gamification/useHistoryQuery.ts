import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";

type TaskHistory = Database["public"]["Tables"]["tasks_history"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type TaskMaster = Database["public"]["Tables"]["tasks_master"]["Row"];

export interface HistoryItem extends TaskHistory {
  profile: Profile;
  task: TaskMaster;
}

export function useHistoryQuery(limit = 50) {
  return useQuery({
    queryKey: ["history", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks_history")
        .select(
          `
          *,
          profile:profiles(*),
          task:tasks_master(*)
        `
        )
        .order("completed_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as unknown as HistoryItem[];
    },
  });
}
