import { useHistoryQuery } from "./useHistoryQuery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

export default function HistoryScreen() {
  const { data: history, isLoading, error } = useHistoryQuery();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Histórico</h2>
        <p className="text-base text-muted-foreground">
          Feed de atividades e tarefas concluídas
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4 animate-in">
            <div className="relative h-12 w-12 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 animate-pulse"></div>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Carregando histórico...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-16 animate-in">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-destructive/10 mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-destructive font-medium">Erro ao carregar histórico</p>
        </div>
      )}

      {history && history.length === 0 && (
        <div className="text-center py-16 space-y-6 animate-in">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-6xl">📋</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Nenhuma atividade ainda</h3>
            <p className="text-muted-foreground">
              Complete tarefas para ver o histórico aqui.
            </p>
          </div>
        </div>
      )}

      {history && history.length > 0 && (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-card border rounded-2xl p-5 flex items-center gap-4 shadow-soft hover-lift animate-in"
            >
              <Avatar className="h-12 w-12 shrink-0 border-2 border-border/50">
                <AvatarImage src={item.profile.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold">
                  {item.profile.nome[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed line-clamp-2">
                  <span className="font-semibold text-foreground">{item.profile.nome}</span>
                  <span className="text-muted-foreground"> completou </span>
                  <span className="font-medium text-foreground" title={item.task.nome}>{item.task.nome}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                  {formatDistanceToNow(item.completed_at)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/30 shrink-0">
                <span className="text-sm">✨</span>
                <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                  +{item.xp_earned}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
