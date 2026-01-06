import { useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { useProfilesQuery } from "@/features/auth/useProfilesQuery";
import { useHouseholdQuery } from "./useHouseholdQuery";
import { useRemoveMember } from "./useRemoveMember";
import { useRegenerateInviteCode } from "./useRegenerateInviteCode";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, Loader2, Users, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MembersManagementScreen() {
  const { user } = useAuth();
  const { data: profile } = useProfileQuery(user?.id);
  const { data: household } = useHouseholdQuery(profile?.household_id);
  const { data: profiles, isLoading } = useProfilesQuery();
  const removeMember = useRemoveMember();
  const regenerateCode = useRegenerateInviteCode();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);

  const isAdmin = profile?.role === "admin";

  const handleCopyInviteCode = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      setCopiedCode(true);
      toast({
        title: "Código copiado!",
        description:
          "O código de convite foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleRegenerateCode = async () => {
    if (!household?.id) return;
    if (!confirm("Tem certeza? O código anterior deixará de funcionar."))
      return;
    await regenerateCode.mutateAsync(household.id);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!user) return;
    if (!confirm(`Tem certeza que deseja remover ${memberName} da casa?`))
      return;
    await removeMember.mutateAsync({
      adminId: user.id,
      memberId,
    });
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
              Apenas administradores podem gerenciar membros.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4 animate-in">
            <div className="relative h-12 w-12 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 animate-pulse"></div>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Carregando membros...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const admins = profiles?.filter((p) => p.role === "admin") || [];
  const members = profiles?.filter((p) => p.role === "member") || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciar Membros</h2>
        <p className="text-base text-muted-foreground">
          Gerencie os membros da casa{" "}
          <span
            className="font-semibold truncate inline-block max-w-[200px] align-bottom"
            title={household?.name}
          >
            {household?.name}
          </span>
        </p>
      </div>

      {/* Invite Code Section */}
      <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-soft animate-in">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-lg font-semibold tracking-tight">
              Código de Convite
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Compartilhe este código para convidar novos membros
            </p>
          </div>
          <Button
            onClick={handleRegenerateCode}
            variant="outline"
            size="sm"
            disabled={regenerateCode.isPending}
            className="rounded-xl shrink-0"
            title="Gerar novo código"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                regenerateCode.isPending ? "animate-spin" : ""
              }`}
            />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gradient-to-br from-muted/80 to-muted/50 rounded-2xl px-6 py-5 text-center border">
            <code
              className="text-2xl font-mono font-bold tracking-widest"
              title={household?.invite_code}
            >
              {household?.invite_code}
            </code>
          </div>
          <Button
            onClick={handleCopyInviteCode}
            variant={copiedCode ? "default" : "outline"}
            size="lg"
            className="rounded-xl shrink-0 thumb-friendly"
            title="Copiar código"
          >
            <Copy className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Household Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border rounded-2xl p-5 text-center space-y-2 shadow-soft hover-lift animate-in">
          <div className="flex items-center justify-center h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-2xl">👥</span>
          </div>
          <div className="text-2xl font-bold">{profiles?.length || 0}</div>
          <div className="text-xs text-muted-foreground font-medium">Total</div>
        </div>
        <div className="bg-card border rounded-2xl p-5 text-center space-y-2 shadow-soft hover-lift animate-in">
          <div className="flex items-center justify-center h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
            <span className="text-2xl">👑</span>
          </div>
          <div className="text-2xl font-bold">{admins.length}</div>
          <div className="text-xs text-muted-foreground font-medium">
            Admins
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 text-center space-y-2 shadow-soft hover-lift animate-in">
          <div className="flex items-center justify-center h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
            <span className="text-2xl">👤</span>
          </div>
          <div className="text-2xl font-bold">{members.length}</div>
          <div className="text-xs text-muted-foreground font-medium">
            Membros
          </div>
        </div>
      </div>

      {/* Admins List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <span>👑</span>
          <span>Administradores</span>
        </h3>
        <div className="space-y-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="bg-card border rounded-2xl p-5 flex items-center justify-between gap-4 shadow-soft hover-lift animate-in"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Avatar className="w-12 h-12 shrink-0">
                  {admin.avatar ? (
                    <img
                      src={admin.avatar}
                      alt={admin.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg">
                      {admin.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-semibold flex items-center gap-2 text-base">
                    <span className="truncate" title={admin.nome}>
                      {admin.nome}
                    </span>
                    {admin.id === user?.id && (
                      <Badge
                        variant="secondary"
                        className="text-xs shrink-0 rounded-lg"
                      >
                        Você
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span>⭐</span>
                    <span className="font-medium">
                      {admin.total_points} pontos
                    </span>
                  </div>
                </div>
              </div>
              <Badge
                variant="default"
                className="shrink-0 rounded-lg px-3 py-1"
              >
                Admin
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <span>👤</span>
          <span>Membros</span>
        </h3>
        {members.length === 0 ? (
          <div className="text-center py-12 space-y-6 animate-in">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-base">Nenhum membro ainda</h4>
              <p className="text-sm text-muted-foreground">
                Convide pessoas usando o código acima!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-card border rounded-2xl p-5 flex items-center justify-between gap-4 shadow-soft hover-lift animate-in"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Avatar className="w-12 h-12 shrink-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg">
                        {member.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div
                      className="font-semibold text-base truncate"
                      title={member.nome}
                    >
                      {member.nome}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span>⭐</span>
                      <span className="font-medium">
                        {member.total_points} pontos
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleRemoveMember(member.id, member.nome)}
                  variant="destructive"
                  size="sm"
                  disabled={removeMember.isPending}
                  className="rounded-xl shrink-0"
                  title={`Remover ${member.nome}`}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
