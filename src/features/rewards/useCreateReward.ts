import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";

type Reward = Database["public"]["Tables"]["rewards"]["Row"];

interface CreateRewardParams {
  nome: string;
  custo_pontos: number;
  household_id: string;
}

interface CreateRewardContext {
  previousRewards: Reward[] | undefined;
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Reward, Error, CreateRewardParams, CreateRewardContext>({
    mutationFn: async (reward: CreateRewardParams) => {
      const { data, error } = await supabase
        .from("rewards")
        // @ts-expect-error - Supabase type mismatch
        .insert({
          nome: reward.nome,
          custo_pontos: reward.custo_pontos,
          household_id: reward.household_id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (reward: CreateRewardParams) => {
      // Vibrate for tactile feedback
      vibrate(50);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["rewards"] });

      // Snapshot previous values
      const previousRewards = queryClient.getQueryData<Reward[]>(["rewards"]);

      // Optimistic update - add reward to list
      queryClient.setQueryData<Reward[]>(["rewards"], (old) => {
        const optimisticReward: Reward = {
          id: `temp-${Date.now()}`,
          nome: reward.nome,
          descricao: null,
          custo_pontos: reward.custo_pontos,
          household_id: reward.household_id,
          is_active: true,
          resgatado_por: null,
          resgatado_em: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Reward;

        const newRewards = [...(old || []), optimisticReward];
        // Sort by cost
        return newRewards.sort((a, b) => a.custo_pontos - b.custo_pontos);
      });

      // Show success toast
      toast({
        title: "Prêmio criado!",
        description: "O novo prêmio está disponível na loja.",
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
        title: "Erro ao criar prêmio",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}
