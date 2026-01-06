import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { ShoppingCategory, ShoppingItem } from "./types";
import { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AddShoppingItemParams {
  householdId: string;
  userId: string;
  name: string;
  category: ShoppingCategory;
  emoji?: string;
  notes?: string;
}

interface AddShoppingItemContext {
  previousItems: ShoppingItem[] | undefined;
  previousProfile: Profile | null | undefined;
}

export function useAddShoppingItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    unknown,
    Error,
    AddShoppingItemParams,
    AddShoppingItemContext
  >({
    mutationFn: async ({
      householdId,
      userId,
      name,
      category,
      emoji,
      notes,
    }: AddShoppingItemParams) => {
      const { data, error } = await supabase
        .from("shopping_items")
        .insert({
          household_id: householdId,
          added_by: userId,
          name: name.trim(),
          category,
          emoji: emoji || "🛒",
          notes: notes?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onMutate: async ({
      householdId,
      userId,
      name,
      category,
      emoji,
      notes,
    }: AddShoppingItemParams) => {
      // Vibrate for tactile feedback
      vibrate(30);

      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ["shopping-items", householdId],
      });
      await queryClient.cancelQueries({ queryKey: ["profile", userId] });

      // Snapshot previous values
      const previousItems = queryClient.getQueryData<ShoppingItem[]>([
        "shopping-items",
        householdId,
      ]);
      const previousProfile = queryClient.getQueryData<Profile>([
        "profile",
        userId,
      ]);

      // Optimistic update - add item to list
      queryClient.setQueryData<ShoppingItem[]>(
        ["shopping-items", householdId],
        (old) => {
          const optimisticItem: ShoppingItem = {
            id: `temp-${Date.now()}`,
            household_id: householdId,
            added_by: userId,
            name: name.trim(),
            category,
            emoji: emoji || "🛒",
            notes: notes?.trim() || null,
            is_purchased: false,
            added_at: new Date().toISOString(),
            purchased_at: null,
            purchased_by: null,
          } as ShoppingItem;

          return [optimisticItem, ...(old || [])];
        }
      );

      // Optimistic update - add points to user profile
      queryClient.setQueryData<Profile>(["profile", userId], (old) => {
        if (!old) return old;
        return {
          ...old,
          total_points: old.total_points + 5,
        };
      });

      // Show immediate success toast
      const truncatedName =
        name.length > 30 ? name.substring(0, 30) + "..." : name;
      toast({
        title: "Item adicionado!",
        description: `${truncatedName} · +5 pts`,
        duration: 3000,
      });

      return { previousItems, previousProfile };
    },

    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(
          ["shopping-items", variables.householdId],
          context.previousItems
        );
      }
      if (context?.previousProfile && variables.userId) {
        queryClient.setQueryData(
          ["profile", variables.userId],
          context.previousProfile
        );
      }

      // Vibração de erro
      if (navigator.vibrate) {
        navigator.vibrate([100, 30, 100]);
      }

      toast({
        variant: "destructive",
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar o item. Tente novamente.",
      });
      console.error("Error adding shopping item:", error);
    },

    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    },
  });
}
