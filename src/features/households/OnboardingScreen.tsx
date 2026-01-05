import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../auth/useAuth";
import { useProfileQuery } from "../auth/useProfileQuery";
import { useCreateHousehold } from "./useCreateHousehold";
import { useJoinHousehold } from "./useJoinHousehold";

export function OnboardingScreen() {
  const { user } = useAuth();
  const { data: profile } = useProfileQuery(user?.id);
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();

  // Reset form state when profile is updated (household created/joined)
  useEffect(() => {
    if (profile?.household_id) {
      setMode("choose");
      setHouseholdName("");
      setInviteCode("");
    }
  }, [profile?.household_id]);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !householdName.trim()) return;

    createHousehold.mutate({
      name: householdName.trim(),
      userId: user.id,
    });
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;

    joinHousehold.mutate({
      inviteCode: inviteCode.trim(),
      userId: user.id,
    });
  };

  if (mode === "choose") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              🏠 Bem-vindo!
            </h1>
            <p className="text-lg text-muted-foreground">Escolha como deseja começar</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setMode("create")}
              className="w-full h-auto py-6 px-6 flex flex-col items-center gap-2 text-left"
              variant="outline"
            >
              <span className="text-3xl">🏡</span>
              <div>
                <div className="font-semibold text-base">Criar nova casa</div>
                <div className="text-sm text-muted-foreground font-normal">
                  Comece sua própria casa e convide membros
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setMode("join")}
              className="w-full h-auto py-6 px-6 flex flex-col items-center gap-2 text-left"
              variant="outline"
            >
              <span className="text-3xl">🚪</span>
              <div>
                <div className="font-semibold text-base">
                  Entrar em uma casa
                </div>
                <div className="text-sm text-muted-foreground font-normal">
                  Use um código de convite para entrar
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => setMode("choose")}
              className="text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              ← Voltar
            </button>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              🏡 Criar nova casa
            </h1>
            <p className="text-muted-foreground">Dê um nome para sua casa</p>
          </div>

          <form onSubmit={handleCreateHousehold} className="space-y-6">
            <div>
              <label
                htmlFor="householdName"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Nome da casa
              </label>
              <input
                id="householdName"
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Ex: Família Silva"
                className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg"
              disabled={createHousehold.isPending}
            >
              {createHousehold.isPending ? "Criando..." : "Criar casa"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => setMode("choose")}
              className="text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              ← Voltar
            </button>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              🚪 Entrar em uma casa
            </h1>
            <p className="text-muted-foreground">Digite o código de convite</p>
          </div>

          <form onSubmit={handleJoinHousehold} className="space-y-6">
            <div>
              <label
                htmlFor="inviteCode"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Código de convite
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC12345"
                className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-center text-2xl font-mono tracking-wider uppercase transition-all"
                maxLength={8}
                required
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                O código tem 8 caracteres
              </p>
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg"
              disabled={joinHousehold.isPending}
            >
              {joinHousehold.isPending ? "Entrando..." : "Entrar na casa"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}

