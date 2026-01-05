import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useDeleteShoppingItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },

    onError: (error) => {
      toast({
        variant: "destructive",
        title: "❌ Erro ao remover",
        description: "Não foi possível remover o item.",
      });
      console.error("Error deleting shopping item:", error);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
    },
  });
}

