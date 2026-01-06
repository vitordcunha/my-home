import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ShoppingItem } from "./types";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface DeleteShoppingItemParams {
  itemId: string;
  itemName: string;
  householdId?: string;
  addedBy?: string | null;
  isPurchased?: boolean;
}

export function useDeleteShoppingItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ itemId }: DeleteShoppingItemParams) => {
      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },

    onMutate: async ({
      itemId,
      itemName,
      householdId,
      addedBy,
      isPurchased,
    }: DeleteShoppingItemParams) => {
      // Vibrate for tactile feedback
      vibrate(50);

      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ["shopping-items", householdId],
      });
      if (addedBy) {
        await queryClient.cancelQueries({ queryKey: ["profile", addedBy] });
      }

      // Snapshot previous values
      const previousItems = queryClient.getQueryData<ShoppingItem[]>([
        "shopping-items",
        householdId,
      ]);
      const previousProfile = addedBy
        ? queryClient.getQueryData<Profile>(["profile", addedBy])
        : null;

      // Optimistically remove item from list
      queryClient.setQueryData<ShoppingItem[]>(
        ["shopping-items", householdId],
        (old) => {
          if (!old) return [];
          return old.filter((item) => item.id !== itemId);
        }
      );

      // Optimistically deduct points from user who added the item
      // Only if item hasn't been purchased yet
      if (addedBy && !isPurchased) {
        queryClient.setQueryData<Profile>(["profile", addedBy], (old) => {
          if (!old) return old;
          return {
            ...old,
            total_points: Math.max(0, old.total_points - 5),
          };
        });
      }

      // Show success toast
      const truncatedItemName =
        itemName.length > 40 ? itemName.substring(0, 40) + "..." : itemName;
      toast({
        title: "Item removido",
        description: truncatedItemName,
      });

      return { previousItems, previousProfile };
    },

    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousItems) {
        queryClient.setQueryData(
          ["shopping-items", variables.householdId],
          context.previousItems
        );
      }
      if (context?.previousProfile && variables.addedBy) {
        queryClient.setQueryData(
          ["profile", variables.addedBy],
          context.previousProfile
        );
      }

      // Show error toast
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: "Não foi possível remover o item. Tente novamente.",
      });

      console.error("Error deleting shopping item:", error);
    },

    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    },
  });
}
