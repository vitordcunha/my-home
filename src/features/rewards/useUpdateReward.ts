import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";

type Reward = Database["public"]["Tables"]["rewards"]["Row"];

interface UpdateRewardParams {
  id: string;
  nome?: string;
  custo_pontos?: number;
  is_active?: boolean;
}

export function useUpdateReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateRewardParams) => {
      const { data, error } = await supabase
        .from("rewards")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...updates }: UpdateRewardParams) => {
      // Vibrate for tactile feedback
      vibrate(50);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["rewards"] });

      // Snapshot previous values
      const previousRewards = queryClient.getQueryData<Reward[]>(["rewards"]);

      // Optimistic update - update reward in list
      queryClient.setQueryData<Reward[]>(["rewards"], (old) => {
        if (!old) return old;
        return old
          .map((reward) => {
            if (reward.id === id) {
              return {
                ...reward,
                ...updates,
                updated_at: new Date().toISOString(),
              };
            }
            return reward;
          })
          .sort((a, b) => a.custo_pontos - b.custo_pontos);
      });

      // Show success toast
      toast({
        title: "Prêmio atualizado!",
        description: "As alterações foram salvas.",
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
        title: "Erro ao atualizar prêmio",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}
