import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/useAuth";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database";
import {
  LogOut,
  Settings,
  Users,
  Trash2,
  Sun,
  Moon,
  Home,
  Star,
  Crown,
  User,
  Trophy,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useDoubleTap } from "@/hooks/useDoubleTap";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useHaptic } from "@/hooks/useHaptic";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const scrollToTop = useScrollToTop();
  const { trigger } = useHaptic();

  // Double tap no logo para scroll to top
  const doubleTapHandlers = useDoubleTap(scrollToTop);

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

  return (
    <header className="sticky top-0 z-40 w-full glass border-none safe-area-inset-top">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo e saudação */}
        <div className="flex items-center gap-3">
          <div
            {...doubleTapHandlers}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted cursor-pointer active:scale-95 transition-transform"
          >
            <Home className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">
              Nossa Casa
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[140px]">
              {profile?.nome?.split(" ")[0] || "Usuário"}
            </p>
          </div>
        </div>

        {/* Pontos, Tema e Avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50">
            <Star className="h-3.5 w-3.5 text-warning fill-warning" />
            <span className="text-sm font-semibold">
              {profile?.total_points || 0}
            </span>
          </div>

          {/* Toggle de Tema */}
          <button
            onClick={() => {
              trigger("light");
              const newTheme = resolvedTheme === "dark" ? "light" : "dark";
              setTheme(newTheme);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Alternar tema"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                className="rounded-full transition-all hover:opacity-80 active:scale-95 cursor-pointer"
                aria-label="Menu do usuário"
              >
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={profile?.avatar || undefined} />
                  <AvatarFallback className="bg-muted text-foreground text-sm font-semibold">
                    {(profile?.nome || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                {/* Header do Popup */}
                <div className="flex items-center gap-3 pb-3 border-b">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarImage src={profile?.avatar || undefined} />
                    <AvatarFallback className="bg-muted text-foreground font-semibold">
                      {(profile?.nome || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold truncate"
                      title={profile?.nome || "Usuário"}
                    >
                      {profile?.nome || "Usuário"}
                    </h3>
                    <p
                      className="text-sm text-muted-foreground truncate"
                      title={user?.email}
                    >
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                    <Star className="h-5 w-5 mb-1 text-warning fill-warning" />
                    <span className="text-xl font-bold">
                      {profile?.total_points || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Pontos
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                    {profile?.role === "admin" ? (
                      <Crown className="h-5 w-5 mb-1 text-warning" />
                    ) : (
                      <User className="h-5 w-5 mb-1" />
                    )}
                    <span
                      className="text-xl font-bold truncate max-w-[100px]"
                      title={profile?.nome?.split(" ")[0] || "Você"}
                    >
                      {profile?.nome?.split(" ")[0] || "Você"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {profile?.role === "admin" ? "Admin" : "Membro"}
                    </span>
                  </div>
                </div>

                {/* Tasks Actions */}
                <div className="space-y-1 pt-2 border-t">
                  <Button
                    onClick={() => {
                      trigger("light");
                      navigate("/ranking");
                    }}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Ranking
                  </Button>
                  <Button
                    onClick={() => {
                      trigger("light");
                      navigate("/tasks/trash");
                    }}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Lixeira de Tarefas
                  </Button>
                </div>

                {/* Admin Actions */}
                {profile?.role === "admin" && (
                  <div className="space-y-1 pt-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground px-2 mb-1">
                      ADMINISTRAÇÃO
                    </p>
                    <Button
                      onClick={() => {
                        trigger("light");
                        navigate("/rewards/manage");
                      }}
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar Prêmios
                    </Button>
                    <Button
                      onClick={() => {
                        trigger("light");
                        navigate("/members");
                      }}
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Gerenciar Membros
                    </Button>
                  </div>
                )}

                {/* Botão de Sair */}
                <Button
                  onClick={() => {
                    trigger("warning");
                    signOut();
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da conta
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
