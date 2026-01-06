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
  CalendarDays,
  Home,
  Star,
  Crown,
  User,
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
    <header className="sticky top-0 z-40 w-full glass border-b safe-area-inset-top">
      <div className="container flex h-20 items-center justify-between px-6">
        {/* Logo e saudação */}
        <div className="flex items-center gap-4">
          <div
            {...doubleTapHandlers}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 cursor-pointer active:scale-95 transition-transform"
          >
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none tracking-tight">
              Nossa Casa
            </h1>
            <p className="text-sm text-muted-foreground mt-1 truncate max-w-[150px]">
              Olá, {profile?.nome || "Usuário"}!
            </p>
          </div>
        </div>

        {/* Pontos, Tema e Avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span className="font-semibold text-amber-900 dark:text-amber-100">
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
            className="thumb-friendly p-2 rounded-xl hover:bg-accent transition-all"
            aria-label="Alternar tema"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                className="group relative overflow-hidden rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Menu do usuário"
              >
                <Avatar className="h-11 w-11 border-2 border-border/50 transition-all group-hover:border-primary/30">
                  <AvatarImage src={profile?.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold">
                    {(profile?.nome || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                {/* Header do Popup */}
                <div className="flex items-center gap-4 pb-4 border-b border-border/50">
                  <Avatar className="h-16 w-16 border-2 border-border/50">
                    <AvatarImage src={profile?.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold text-2xl">
                      {(profile?.nome || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-lg truncate"
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
                  <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30">
                    <Star className="h-6 w-6 mb-1 fill-amber-500 text-amber-500" />
                    <span className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                      {profile?.total_points || 0}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      Pontos
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/60">
                    {profile?.role === "admin" ? (
                      <Crown className="h-6 w-6 mb-1 text-amber-500" />
                    ) : (
                      <User className="h-6 w-6 mb-1" />
                    )}
                    <span
                      className="text-2xl font-bold truncate max-w-[120px]"
                      title={profile?.nome?.split(" ")[0] || "Você"}
                    >
                      {profile?.nome?.split(" ")[0] || "Você"}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {profile?.role === "admin" ? "Admin" : "Membro"}
                    </span>
                  </div>
                </div>

                {/* Tasks Actions */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Button
                    onClick={() => {
                      trigger("light");
                      navigate("/tasks/trash");
                    }}
                    variant="ghost"
                    className="w-full justify-start rounded-xl font-medium"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Lixeira de Tarefas
                  </Button>
                </div>

                {/* Admin Actions */}
                {profile?.role === "admin" && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground px-1">
                      ADMINISTRAÇÃO
                    </p>
                    <Button
                      onClick={() => {
                        trigger("light");
                        navigate("/rewards/manage");
                      }}
                      variant="ghost"
                      className="w-full justify-start rounded-xl font-medium"
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
                      className="w-full justify-start rounded-xl font-medium"
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
                  className="w-full rounded-xl font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
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
