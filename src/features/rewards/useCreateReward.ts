import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface CreateRewardParams {
  nome: string;
  custo_pontos: number;
  household_id: string;
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast({
        title: "Prêmio criado!",
        description: "O novo prêmio está disponível na loja.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar prêmio",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
