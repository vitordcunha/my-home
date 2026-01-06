import { useHistoryQuery } from "./useHistoryQuery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  AlertTriangle,
  Clipboard,
  Sparkles,
  Undo2,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUndoTask } from "@/features/tasks/useUndoTask";

export default function HistoryScreen() {
  const { data: history, isLoading, error } = useHistoryQuery();
  const undoTask = useUndoTask();

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
            <p className="text-sm text-muted-foreground">
              Carregando histórico...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-16 animate-in">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-destructive font-medium">
            Erro ao carregar histórico
          </p>
        </div>
      )}

      {history && history.length === 0 && (
        <div className="text-center py-16 space-y-6 animate-in">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5">
            <Clipboard className="h-12 w-12 text-primary" />
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
                  <span className="font-semibold text-foreground">
                    {item.profile.nome}
                  </span>
                  <span className="text-muted-foreground"> completou </span>
                  <span
                    className="font-medium text-foreground"
                    title={item.task.nome}
                  >
                    {item.task.nome}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                  {formatDistanceToNow(item.completed_at)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/30">
                  <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                    +{item.xp_earned}
                  </span>
                </div>

                <Button
                  onClick={() => {
                    const truncatedTaskName =
                      item.task.nome.length > 50
                        ? item.task.nome.substring(0, 50) + "..."
                        : item.task.nome;
                    if (
                      confirm(
                        `Desfazer conclusão de "${truncatedTaskName}"?\n\nIsso removerá ${item.xp_earned} pontos de ${item.profile.nome} e a tarefa voltará para o board.`
                      )
                    ) {
                      undoTask.mutate({
                        historyId: item.id,
                        userId: item.user_id,
                        xpValue: item.xp_earned,
                        taskName: item.task.nome,
                        taskId: item.task_id,
                      });
                    }
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  disabled={undoTask.isPending}
                  title="Desfazer tarefa"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
