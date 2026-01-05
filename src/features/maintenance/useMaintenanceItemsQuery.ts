import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MaintenanceItemWithCreator, MaintenanceStatus } from "./types";

interface UseMaintenanceItemsQueryOptions {
  householdId?: string;
  status?: MaintenanceStatus[];
}

export function useMaintenanceItemsQuery({
  householdId,
  status,
}: UseMaintenanceItemsQueryOptions) {
  return useQuery({
    queryKey: ["maintenanceItems", householdId, status],
    queryFn: async (): Promise<MaintenanceItemWithCreator[]> => {
      if (!householdId) return [];

      let query = supabase
        .from("maintenance_items")
        .select(
          `
          *,
          creator:profiles!maintenance_items_created_by_fkey(
            id,
            nome,
            avatar
          ),
          assigned:profiles!maintenance_items_assigned_to_fkey(
            id,
            nome,
            avatar
          )
        `
        )
        .eq("household_id", householdId);

      // Filtrar por status se fornecido
      if (status && status.length > 0) {
        query = query.in("status", status);
      } else {
        // Por padrão, não mostrar arquivados
        query = query.neq("status", "archived");
      }

      const { data, error } = await query.order("priority", {
        ascending: false,
      }) // urgent first
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => ({
        ...item,
        creator: Array.isArray(item.creator) ? item.creator[0] : item.creator,
        assigned: Array.isArray(item.assigned)
          ? item.assigned[0]
          : item.assigned,
      })) as MaintenanceItemWithCreator[];
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}


