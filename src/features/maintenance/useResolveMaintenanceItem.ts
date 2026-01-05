import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/types/database";

type MaintenanceUpdate =
  Database["public"]["Tables"]["maintenance_items"]["Update"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];

interface ResolveMaintenanceItemData {
  itemId: string;
  householdId: string;
  resolvedBy: string;
  actualCost?: number;
  timeSpentMinutes?: number;
  photos?: string[];
  notes?: string;
  createExpense?: boolean;
  expenseDescription?: string;
}

export function useResolveMaintenanceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ResolveMaintenanceItemData) => {
      // 1. Atualizar status do item para resolved
      const { error: updateError } = await supabase
        .from("maintenance_items")
        // @ts-ignore - Supabase type inference issue
        .update({
          status: "resolved",
          resolved_by: data.resolvedBy,
          resolved_at: new Date().toISOString(),
          actual_cost: data.actualCost,
          time_spent_minutes: data.timeSpentMinutes,
          photos: data.photos,
        } as MaintenanceUpdate)
        .eq("id", data.itemId);

      if (updateError) throw updateError;

      // 2. Se tiver custo e quiser criar despesa
      if (data.createExpense && data.actualCost && data.actualCost > 0) {
        const { error: expenseError } = await supabase
          .from("expenses")
          // @ts-ignore - Supabase type inference issue
          .insert({
            household_id: data.householdId,
            description: data.expenseDescription || "Manutenção",
            amount: data.actualCost,
            category: "manutencao",
            paid_by: data.resolvedBy,
            split_type: "equal",
            maintenance_item_id: data.itemId,
            created_by: data.resolvedBy,
          } as ExpenseInsert);

        if (expenseError) throw expenseError;
      }

      return { success: true };
    },
    onMutate: async () => {
      // Vibração forte de sucesso
      if (navigator.vibrate) {
        navigator.vibrate([30, 10, 30]);
      }
    },
    onError: (err) => {
      // Vibração de erro
      if (navigator.vibrate) {
        navigator.vibrate([100, 30, 100]);
      }

      toast({
        variant: "destructive",
        title: "Erro ao resolver item",
        description: err instanceof Error ? err.message : "Tente novamente",
      });
    },
    onSuccess: (_, variables) => {
      // Invalidar queries
      queryClient.invalidateQueries({
        queryKey: ["maintenanceItems", variables.householdId],
      });
      queryClient.invalidateQueries({
        queryKey: ["expenses", variables.householdId],
      });
      queryClient.invalidateQueries({
        queryKey: ["userBalance"],
      });

      // Toast de sucesso
      const toastMessage = variables.createExpense
        ? "✅ Item resolvido e despesa registrada!"
        : "✅ Item resolvido!";

      toast({
        title: toastMessage,
        description: "+50 pts",
      });
    },
  });
}
