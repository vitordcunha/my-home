import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";

type Reward = Database["public"]["Tables"]["rewards"]["Row"];

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
    onMutate: async (rewardId: string) => {
      // Vibrate for tactile feedback
      vibrate(50);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["rewards"] });

      // Snapshot previous values
      const previousRewards = queryClient.getQueryData<Reward[]>(["rewards"]);

      // Optimistic update - remove reward from list
      queryClient.setQueryData<Reward[]>(["rewards"], (old) => {
        if (!old) return [];
        return old.filter((reward) => reward.id !== rewardId);
      });

      // Show success toast
      toast({
        title: "Prêmio removido!",
        description: "O prêmio foi removido da loja.",
      });

      return { previousRewards };
    },
    onError: (error: Error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousRewards !== undefined) {
        queryClient.setQueryData(["rewards"], context.previousRewards);
      }

      // Vibração de erro
      if (navigator.vibrate) {
        navigator.vibrate([100, 30, 100]);
      }

      toast({
        title: "Erro ao remover prêmio",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}
