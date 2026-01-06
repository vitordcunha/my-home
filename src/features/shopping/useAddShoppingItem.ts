import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { ShoppingCategory } from "./types";

interface AddShoppingItemParams {
  householdId: string;
  userId: string;
  name: string;
  category: ShoppingCategory;
  emoji?: string;
  notes?: string;
}

export function useAddShoppingItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
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
        // @ts-expect-error - Supabase type mismatch with new table
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

    onMutate: async ({ name }) => {
      // Vibrate for tactile feedback
      vibrate(30);

      // Show immediate success toast
      const truncatedName =
        name.length > 30 ? name.substring(0, 30) + "..." : name;
      toast({
        title: "Item adicionado!",
        description: `${truncatedName} · +5 pts`,
        duration: 3000,
      });
    },

    onError: (error) => {
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
