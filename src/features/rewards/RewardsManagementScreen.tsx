import { useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { useRewardsQuery } from "./useRewardsQuery";
import { useCreateReward } from "./useCreateReward";
import { useUpdateReward } from "./useUpdateReward";
import { useDeleteReward } from "./useDeleteReward";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Gift, Lock, Edit2, Trash2, Check, Star } from "lucide-react";
import { RewardsGridSkeleton } from "@/components/skeletons/RewardsSkeleton";

interface RewardFormData {
  id?: string;
  nome: string;
  custo_pontos: number;
}

export function RewardsManagementScreen() {
  const { user } = useAuth();
  const { data: profile } = useProfileQuery(user?.id);
  const { data: rewards, isLoading } = useRewardsQuery();
  const createReward = useCreateReward();
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardFormData | null>(
    null
  );
  const [formData, setFormData] = useState<RewardFormData>({
    nome: "",
    custo_pontos: 100,
  });

  const isAdmin = profile?.role === "admin";

  const handleOpenDialog = (reward?: NonNullable<typeof rewards>[number]) => {
    if (reward) {
      setEditingReward({
        id: reward.id,
        nome: reward.nome,
        custo_pontos: reward.custo_pontos,
      });
      setFormData({
        id: reward.id,
        nome: reward.nome,
        custo_pontos: reward.custo_pontos,
      });
    } else {
      setEditingReward(null);
      setFormData({
        nome: "",
        custo_pontos: 100,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.household_id) return;

    if (editingReward?.id) {
      await updateReward.mutateAsync({
        id: editingReward.id,
        nome: formData.nome,
        custo_pontos: formData.custo_pontos,
      });
    } else {
      await createReward.mutateAsync({
        nome: formData.nome,
        custo_pontos: formData.custo_pontos,
        household_id: profile.household_id,
      });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm("Tem certeza que deseja remover este prêmio?")) return;
    await deleteReward.mutateAsync(rewardId);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16 space-y-6 animate-in">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Acesso Restrito</h3>
            <p className="text-muted-foreground">
              Apenas administradores podem gerenciar prêmios.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Gerenciar Prêmios
          </h2>
          <p className="text-base text-muted-foreground">Carregando...</p>
        </div>
        <RewardsGridSkeleton />
      </div>
    );
  }

  const activeRewards = rewards?.filter((r) => r.is_active) || [];
  const redeemedRewards =
    rewards?.filter((r) => !r.is_active && r.resgatado_por) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciar Prêmios</h2>
        <p className="text-base text-muted-foreground">
          Crie e gerencie os prêmios disponíveis na loja
        </p>
      </div>

      {/* Add Button */}
      <Button
        onClick={() => handleOpenDialog()}
        className="w-full rounded-xl shadow-sm hover:shadow transition-all gap-2 thumb-friendly"
        size="lg"
      >
        <Plus className="h-5 w-5" />
        <span className="font-medium">Adicionar Prêmio</span>
      </Button>

      {/* Active Rewards */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold tracking-tight">
          Prêmios Disponíveis
        </h3>
        {activeRewards.length === 0 ? (
          <div className="text-center py-12 space-y-6 animate-in">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Gift className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-base">
                Nenhum prêmio disponível
              </h4>
              <p className="text-sm text-muted-foreground">
                Adicione o primeiro prêmio usando o botão acima!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-card border rounded-2xl p-5 flex items-center justify-between gap-4 shadow-soft hover-lift animate-in"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shrink-0">
                    <Gift className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3
                      className="font-semibold text-lg leading-tight truncate"
                      title={reward.nome}
                    >
                      {reward.nome}
                    </h3>
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30 w-fit">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        {reward.custo_pontos} pontos
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={() => handleOpenDialog(reward)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    title="Editar prêmio"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(reward.id)}
                    variant="destructive"
                    size="sm"
                    className="rounded-xl"
                    title="Excluir prêmio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Redeemed Rewards History */}
      {redeemedRewards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">
            Prêmios Resgatados
          </h3>
          <div className="space-y-3">
            {redeemedRewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-gradient-to-br from-muted/50 to-muted/30 border border-dashed rounded-2xl p-5 flex items-center gap-4 opacity-80 animate-in"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 shrink-0">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-base truncate"
                    title={reward.nome}
                  >
                    {reward.nome}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Resgatado em{" "}
                    {reward.resgatado_em
                      ? new Date(reward.resgatado_em).toLocaleDateString(
                          "pt-BR"
                        )
                      : "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary shrink-0">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-semibold">
                    {reward.custo_pontos}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader className="space-y-3">
            <SheetTitle className="text-2xl font-bold">
              {editingReward ? "Editar Prêmio" : "Novo Prêmio"}
            </SheetTitle>
            <SheetDescription className="text-base">
              {editingReward
                ? "Atualize as informações do prêmio"
                : "Adicione um novo prêmio à loja"}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <label htmlFor="nome" className="block text-sm font-semibold">
                Nome do Prêmio *
              </label>
              <input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
                maxLength={100}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground transition-all"
                placeholder="Ex: Sorvete Extra"
              />
            </div>

            {/* Custo */}
            <div className="space-y-2">
              <label htmlFor="custo" className="block text-sm font-semibold">
                Custo em Pontos *
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="custo"
                  type="number"
                  value={formData.custo_pontos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      custo_pontos: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  required
                  min="1"
                  max="10000"
                  className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground transition-all"
                />
                <div className="flex items-center gap-1.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30 shrink-0">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {formData.custo_pontos}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 rounded-xl thumb-friendly"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl thumb-friendly"
                disabled={createReward.isPending || updateReward.isPending}
              >
                {createReward.isPending || updateReward.isPending
                  ? "Salvando..."
                  : editingReward
                  ? "Atualizar"
                  : "Criar Prêmio"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
