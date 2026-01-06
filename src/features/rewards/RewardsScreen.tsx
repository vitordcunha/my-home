import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/useAuth";
import { useRewardsQuery, useRedeemedRewardsQuery } from "./useRewardsQuery";
import { useRedeemReward } from "./useRedeemReward";
import { Button } from "@/components/ui/button";
import { Gift, Check, Star } from "lucide-react";
import { Database } from "@/types/database";
import { RewardsGridSkeleton } from "@/components/skeletons/RewardsSkeleton";
import { PullToRefreshWrapper } from "@/components/ui/pull-to-refresh";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Reward = Database["public"]["Tables"]["rewards"]["Row"];

function RewardCard({
  reward,
  userPoints,
  onRedeem,
  isRedeeming,
}: {
  reward: Reward;
  userPoints: number;
  onRedeem: () => void;
  isRedeeming: boolean;
}) {
  const canAfford = userPoints >= reward.custo_pontos;

  return (
    <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-soft hover-lift animate-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h3
            className="font-semibold text-lg leading-tight tracking-tight line-clamp-2"
            title={reward.nome}
          >
            {reward.nome}
          </h3>
          {reward.descricao && (
            <p
              className="text-sm text-muted-foreground leading-relaxed line-clamp-3"
              title={reward.descricao}
            >
              {reward.descricao}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shrink-0">
          <Gift className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 gap-3">
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30">
          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
          <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {reward.custo_pontos}
          </span>
        </div>

        <Button
          onClick={onRedeem}
          disabled={!canAfford || isRedeeming}
          className="thumb-friendly rounded-xl font-medium shadow-sm hover:shadow transition-all"
          variant={canAfford ? "default" : "outline"}
        >
          {canAfford ? "Resgatar" : "Sem pontos"}
        </Button>
      </div>
    </div>
  );
}

function RedeemedRewardCard({ reward }: { reward: Reward }) {
  return (
    <div className="bg-gradient-to-br from-muted/50 to-muted/30 border border-dashed rounded-2xl p-5 flex items-center gap-4 opacity-80 animate-in">
      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 shrink-0">
        <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base truncate" title={reward.nome}>
          {reward.nome}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Resgatado em{" "}
          {new Date(reward.resgatado_em!).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary shrink-0">
        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
        <span className="text-xs font-semibold">{reward.custo_pontos}</span>
      </div>
    </div>
  );
}

export default function RewardsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"available" | "redeemed">(
    "available"
  );

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["rewards"] }),
      queryClient.invalidateQueries({ queryKey: ["redeemed-rewards"] }),
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    ]);
  };

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });

  const { data: rewards, isLoading: loadingRewards } = useRewardsQuery();
  const { data: redeemedRewards, isLoading: loadingRedeemed } =
    useRedeemedRewardsQuery(user?.id || "");
  const redeemMutation = useRedeemReward();

  const handleRedeem = (reward: Reward) => {
    if (!user?.id) return;
    redeemMutation.mutate({
      rewardId: reward.id,
      userId: user.id,
      costoPontos: reward.custo_pontos,
    });
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div className="space-y-8">

        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Prêmios</h2>
          <div className="flex items-center gap-2">
            <p className="text-base text-muted-foreground">Você tem</p>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-bold text-amber-900 dark:text-amber-100">
                {profile?.total_points || 0}
              </span>
            </div>
            <p className="text-base text-muted-foreground">disponíveis</p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-border/50">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-6 py-3 font-semibold transition-all rounded-t-lg ${activeTab === "available"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
          >
            Disponíveis
          </button>
          <button
            onClick={() => setActiveTab("redeemed")}
            className={`px-6 py-3 font-semibold transition-all rounded-t-lg ${activeTab === "redeemed"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
          >
            Resgatados
          </button>
        </div>

        {activeTab === "available" && (
          <>
            {loadingRewards && <RewardsGridSkeleton />}

            {!loadingRewards && rewards && rewards.length === 0 && (
              <div className="text-center py-16 space-y-6 animate-in">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5">
                  <Gift className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">
                    Nenhum prêmio disponível
                  </h3>
                  <p className="text-muted-foreground">
                    Novos prêmios serão adicionados em breve!
                  </p>
                </div>
              </div>
            )}

            {!loadingRewards && rewards && rewards.length > 0 && (
              <div className="space-y-3">
                {rewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    userPoints={profile?.total_points || 0}
                    onRedeem={() => handleRedeem(reward)}
                    isRedeeming={redeemMutation.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "redeemed" && (
          <>
            {loadingRedeemed && <RewardsGridSkeleton />}

            {!loadingRedeemed &&
              redeemedRewards &&
              redeemedRewards.length === 0 && (
                <div className="text-center py-16 space-y-6 animate-in">
                  <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5">
                    <Gift className="h-12 w-12 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      Nenhum prêmio resgatado
                    </h3>
                    <p className="text-muted-foreground">
                      Comece resgatando prêmios com seus pontos!
                    </p>
                  </div>
                </div>
              )}

            {!loadingRedeemed &&
              redeemedRewards &&
              redeemedRewards.length > 0 && (
                <div className="space-y-3">
                  {redeemedRewards.map((reward) => (
                    <RedeemedRewardCard key={reward.id} reward={reward} />
                  ))}
                </div>
              )}
          </>
        )}
      </div>
    </PullToRefreshWrapper>
  );

}
