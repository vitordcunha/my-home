import { useRankingQuery } from "./useRankingQuery";
import { useAuth } from "@/features/auth/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const positionIcons = [
  { icon: Trophy, color: "text-yellow-500 dark:text-yellow-400" },
  { icon: Medal, color: "text-muted-foreground" },
  { icon: Award, color: "text-amber-600 dark:text-amber-500" },
];

export default function RankingScreen() {
  const { user } = useAuth();
  const { data: ranking, isLoading, error } = useRankingQuery();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Ranking</h2>
        <p className="text-base text-muted-foreground">Leaderboard da casa</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4 animate-in">
            <div className="relative h-12 w-12 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 animate-pulse"></div>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Carregando ranking...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-16 animate-in">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-destructive/10 mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-destructive font-medium">Erro ao carregar ranking</p>
        </div>
      )}

      {ranking && ranking.length === 0 && (
        <div className="text-center py-16 space-y-6 animate-in">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-6xl">🏆</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Ranking vazio</h3>
            <p className="text-muted-foreground">
              Complete tarefas para aparecer no ranking!
            </p>
          </div>
        </div>
      )}

      {ranking && ranking.length > 0 && (
        <div className="space-y-3">
          {ranking.map((profile, index) => {
            const isCurrentUser = profile.id === user?.id;
            const position = index + 1;
            const PositionIcon = positionIcons[index]?.icon;
            const iconColor = positionIcons[index]?.color;

            return (
              <div
                key={profile.id}
                className={cn(
                  "bg-card border rounded-2xl p-5 flex items-center gap-4 transition-all shadow-soft hover-lift animate-in",
                  isCurrentUser && "ring-2 ring-primary/50 bg-gradient-to-br from-primary/5 to-transparent"
                )}
              >
                <div className="flex items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-secondary to-secondary/50">
                  {PositionIcon ? (
                    <PositionIcon className={cn("h-6 w-6", iconColor)} />
                  ) : (
                    <span className="text-base font-bold text-muted-foreground">
                      {position}º
                    </span>
                  )}
                </div>

                <Avatar className="h-14 w-14 shrink-0 border-2 border-border/50">
                  <AvatarImage src={profile.avatar || undefined} />
                  <AvatarFallback className="text-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold">
                    {profile.nome[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg leading-tight truncate" title={profile.nome}>
                      {profile.nome}
                    </p>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs font-medium border-primary/50 text-primary">
                        Você
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {position}º lugar
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold bg-gradient-to-br from-amber-600 to-orange-500 bg-clip-text text-transparent">
                      {profile.total_points}
                    </p>
                    <span className="text-lg">⭐</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">pontos</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ranking && ranking.length > 0 && (
        <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl p-5 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            💡 Complete mais tarefas para subir no ranking!
          </p>
        </div>
      )}
    </div>
  );
}
