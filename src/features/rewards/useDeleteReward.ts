import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useDeleteReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase
        .from("rewards")
        .delete()
        .eq("id", rewardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast({
        title: "Prêmio removido!",
        description: "O prêmio foi removido da loja.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover prêmio",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

