import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";

type RewardUpdate = Database["public"]["Tables"]["rewards"]["Update"];
type Reward = Database["public"]["Tables"]["rewards"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface RedeemRewardParams {
  rewardId: string;
  userId: string;
  costoPontos: number;
}

interface RedeemRewardContext {
  previousRewards: Reward[] | undefined;
  previousProfile: Profile | null | undefined;
}

export function useRedeemReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Reward, Error, RedeemRewardParams, RedeemRewardContext>({
    mutationFn: async ({ rewardId, userId }: RedeemRewardParams) => {
      const { data, error } = await supabase
        .from("rewards")
        // @ts-expect-error - Supabase type inference issue
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

    onMutate: async ({ rewardId, userId, costoPontos }: RedeemRewardParams) => {
      // Vibrate for tactile feedback
      vibrate(100);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["rewards"] });
      await queryClient.cancelQueries({ queryKey: ["profile", userId] });

      // Snapshot previous values
      const previousRewards = queryClient.getQueryData<Reward[]>(["rewards"]);
      const previousProfile = queryClient.getQueryData<Profile>([
        "profile",
        userId,
      ]);

      // Optimistic update - remove reward from available rewards list
      queryClient.setQueryData<Reward[]>(["rewards"], (old) => {
        if (!old) return [];
        return old.filter((reward) => reward.id !== rewardId);
      });

      // Optimistic update - deduct points from user profile
      queryClient.setQueryData<Profile>(["profile", userId], (old) => {
        if (!old) return old;
        return {
          ...old,
          total_points: Math.max(0, old.total_points - costoPontos),
        };
      });

      // Show success toast
      toast({
        title: "Prêmio resgatado!",
        description: "Aproveite sua recompensa!",
      });

      return { previousRewards, previousProfile };
    },

    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousRewards !== undefined) {
        queryClient.setQueryData(["rewards"], context.previousRewards);
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

      const errorMessage =
        error instanceof Error ? error.message : "Tente novamente";
      const truncatedError =
        errorMessage.length > 60
          ? errorMessage.substring(0, 60) + "..."
          : errorMessage;
      toast({
        variant: "destructive",
        title: "Erro ao resgatar",
        description: truncatedError,
      });
    },

    onSuccess: (_, variables) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({
        queryKey: ["profile", variables.userId],
      });
    },
  });
}
