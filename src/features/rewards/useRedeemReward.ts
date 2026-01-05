import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";

type RewardUpdate = Database["public"]["Tables"]["rewards"]["Update"];

interface RedeemRewardParams {
  rewardId: string;
  userId: string;
  costoPontos: number;
}

export function useRedeemReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ rewardId, userId }: RedeemRewardParams) => {
      const { data, error } = await supabase
        .from("rewards")
        // @ts-ignore - Supabase type inference issue
        .update({
          resgatado_por: userId,
          resgatado_em: new Date().toISOString(),
        } as RewardUpdate)
        .eq("id", rewardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: (_, variables) => {
      vibrate(100);

      toast({
        title: "🎁 Prêmio resgatado!",
        description: "Aproveite sua recompensa!",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({
        queryKey: ["profile", variables.userId],
      });
    },

    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Tente novamente";
      const truncatedError = errorMessage.length > 60 ? errorMessage.substring(0, 60) + "..." : errorMessage;
      toast({
        variant: "destructive",
        title: "❌ Erro ao resgatar",
        description: truncatedError,
      });
    },
  });
}
