import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";

type Task = Database["public"]["Tables"]["tasks_master"]["Row"];

export function useArchivedTasksQuery() {
  return useQuery({
    queryKey: ["tasks", "archived"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks_master")
        .select("*")
        .eq("is_active", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });
}

