import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/types/database";
import { MaintenanceItemWithCreator } from "./types";
import { ExpenseWithPaidBy } from "../expenses/types";

type MaintenanceUpdate =
  Database["public"]["Tables"]["maintenance_items"]["Update"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

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

interface ResolveMaintenanceItemContext {
  previousItems: MaintenanceItemWithCreator[] | undefined;
  previousProfile: Profile | null | undefined;
  previousExpenses: ExpenseWithPaidBy[] | undefined;
}

export function useResolveMaintenanceItem() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    ResolveMaintenanceItemData,
    ResolveMaintenanceItemContext
  >({
    mutationFn: async (data: ResolveMaintenanceItemData) => {
      // 1. Atualizar status do item para resolved
      const { error: updateError } = await supabase
        .from("maintenance_items")
        // @ts-expect-error - Supabase type inference issue
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
          // @ts-expect-error - Supabase type inference issue
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
    onMutate: async (data: ResolveMaintenanceItemData) => {
      // Vibração forte de sucesso
      if (navigator.vibrate) {
        navigator.vibrate([30, 10, 30]);
      }

      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ["maintenanceItems", data.householdId],
      });
      await queryClient.cancelQueries({
        queryKey: ["profile", data.resolvedBy],
      });
      if (data.createExpense) {
        await queryClient.cancelQueries({
          queryKey: ["expenses", data.householdId],
        });
      }

      // Snapshot previous values
      const previousItems = queryClient.getQueryData<
        MaintenanceItemWithCreator[]
      >(["maintenanceItems", data.householdId]);
      const previousProfile = queryClient.getQueryData<Profile>([
        "profile",
        data.resolvedBy,
      ]);
      const previousExpenses = data.createExpense
        ? queryClient.getQueryData<ExpenseWithPaidBy[]>([
            "expenses",
            data.householdId,
          ])
        : undefined;

      // Optimistic update - update item status to resolved
      queryClient.setQueryData<MaintenanceItemWithCreator[]>(
        ["maintenanceItems", data.householdId],
        (old) => {
          if (!old) return old;
          return old.map((item) => {
            if (item.id === data.itemId) {
              return {
                ...item,
                status: "resolved" as const,
                resolved_by: data.resolvedBy,
                resolved_at: new Date().toISOString(),
                actual_cost: data.actualCost || null,
                time_spent_minutes: data.timeSpentMinutes || null,
                photos: data.photos || null,
              };
            }
            return item;
          });
        }
      );

      // Optimistic update - add points to user profile (50 points for resolving)
      queryClient.setQueryData<Profile>(["profile", data.resolvedBy], (old) => {
        if (!old) return old;
        return {
          ...old,
          total_points: old.total_points + 50,
        };
      });

      // Optimistic update - add expense if createExpense is true
      if (data.createExpense && data.actualCost && data.actualCost > 0) {
        queryClient.setQueryData<ExpenseWithPaidBy[]>(
          ["expenses", data.householdId],
          (old) => {
            const optimisticExpense: ExpenseWithPaidBy = {
              id: `temp-${Date.now()}`,
              household_id: data.householdId,
              description: data.expenseDescription || "Manutenção",
              amount: data.actualCost!,
              category: "manutencao",
              paid_by: data.resolvedBy,
              is_split: true,
              split_with: null,
              split_type: "equal",
              maintenance_item_id: data.itemId,
              created_by: data.resolvedBy,
              paid_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              paid_by_profile: {
                id: data.resolvedBy,
                nome: "Você",
                avatar: null,
              },
              split_with_profiles: [],
            } as unknown as ExpenseWithPaidBy;

            return [optimisticExpense, ...(old || [])];
          }
        );
      }

      // Toast de sucesso
      const toastMessage = data.createExpense
        ? "Item resolvido e despesa registrada!"
        : "Item resolvido!";

      toast({
        title: toastMessage,
        description: "+50 pts",
      });

      return { previousItems, previousProfile, previousExpenses };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(
          ["maintenanceItems", variables.householdId],
          context.previousItems
        );
      }
      if (context?.previousProfile && variables.resolvedBy) {
        queryClient.setQueryData(
          ["profile", variables.resolvedBy],
          context.previousProfile
        );
      }
      if (context?.previousExpenses !== undefined && variables.createExpense) {
        queryClient.setQueryData(
          ["expenses", variables.householdId],
          context.previousExpenses
        );
      }

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
    },
  });
}
