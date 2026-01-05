import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MaintenanceItemInsert } from "./types";
import { toast } from "@/hooks/use-toast";

interface AddMaintenanceItemData
  extends Omit<
    MaintenanceItemInsert,
    "id" | "created_at" | "updated_at" | "status"
  > {}

export function useAddMaintenanceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddMaintenanceItemData) => {
      const { data: item, error } = await supabase
        .from("maintenance_items")
        .insert({
          household_id: data.household_id,
          title: data.title,
          description: data.description,
          location: data.location,
          priority: data.priority,
          action_type: data.action_type,
          technician_specialty: data.technician_specialty,
          estimated_cost: data.estimated_cost,
          photos: data.photos,
          created_by: data.created_by,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return item;
    },
    onMutate: async (newItem) => {
      // Vibração ao adicionar
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["maintenanceItems", newItem.household_id],
      });

      // Snapshot do estado anterior
      const previousItems = queryClient.getQueryData([
        "maintenanceItems",
        newItem.household_id,
      ]);

      // Optimistic update
      queryClient.setQueryData(
        ["maintenanceItems", newItem.household_id],
        (old: any) => {
          const optimisticItem = {
            ...newItem,
            id: `temp-${Date.now()}`,
            status: "open" as const,
            assigned_to: null,
            resolved_by: null,
            resolved_at: null,
            actual_cost: null,
            time_spent_minutes: null,
            expense_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            creator: {
              id: newItem.created_by,
              nome: "Você",
              avatar: null,
            },
            assigned: null,
          };
          return [optimisticItem, ...(old || [])];
        }
      );

      return { previousItems };
    },
    onError: (err, newItem, context) => {
      // Rollback
      if (context?.previousItems) {
        queryClient.setQueryData(
          ["maintenanceItems", newItem.household_id],
          context.previousItems
        );
      }

      // Vibração de erro
      if (navigator.vibrate) {
        navigator.vibrate([100, 30, 100]);
      }

      toast({
        variant: "destructive",
        title: "Erro ao adicionar item",
        description: err instanceof Error ? err.message : "Tente novamente",
      });
    },
    onSuccess: (_data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ["maintenanceItems", variables.household_id],
      });

      // Toast de sucesso
      toast({
        title: "✅ Item reportado!",
        description: `${variables.title} • +5 pts`,
      });
    },
  });
}

