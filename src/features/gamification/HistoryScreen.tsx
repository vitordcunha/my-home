import { useState } from "react";
import { useHistoryQuery, HistoryItem } from "./useHistoryQuery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertTriangle,
  Clipboard,
  Sparkles,
  Undo2,
  Star,
  Calendar,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useUndoTask } from "@/features/tasks/useUndoTask";
import { HistoryListSkeleton } from "@/components/skeletons/HistorySkeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { PullToRefreshWrapper } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";

const recurrenceLabels = {
  daily: "Diária",
  weekly: "Semanal",
  once: "Única",
};

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function HistoryScreen() {
  const { data: history, isLoading, error } = useHistoryQuery();
  const undoTask = useUndoTask();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["history"] });
  };

  const handleUndo = (item: HistoryItem, closeModal = false) => {
    undoTask.mutate({
      historyId: item.id,
      userId: item.user_id,
      xpValue: item.xp_earned,
      taskName: item.task.nome,
      taskId: item.task_id,
    });
    if (closeModal) {
      setSelectedItem(null);
    }
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div className="space-y-8">

        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Histórico</h2>
          <p className="text-base text-muted-foreground">
            Feed de atividades e tarefas concluídas
          </p>
        </div>

        {isLoading && <HistoryListSkeleton />}

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
                onClick={() => setSelectedItem(item)}
                className="bg-card border rounded-2xl p-5 flex items-center gap-4 shadow-soft hover-lift animate-in cursor-pointer transition-all active:scale-[0.98]"
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

                  <div onClick={(e) => e.stopPropagation()}>
                    <ConfirmButton
                      onConfirm={() => handleUndo(item, false)}
                      variant="ghost"
                      size="icon"
                      showBadge={true}
                      badgePosition="top"
                      className="h-9 w-9"
                      disabled={undoTask.isPending}
                    >
                      <Undo2 className="h-4 w-4" />
                    </ConfirmButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de detalhes da task */}
        <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <SheetContent
            side="bottom"
            className="h-auto max-h-[85vh] rounded-t-3xl border-t overflow-y-auto"
          >
            {selectedItem && (
              <>
                <SheetHeader className="space-y-3 pb-6">
                  <SheetTitle className="text-xl text-left">
                    Detalhes da Tarefa
                  </SheetTitle>
                  <SheetDescription className="text-base text-left">
                    Informações completas sobre a conclusão
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 pb-6">
                  {/* Nome da task */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {selectedItem.task.nome}
                    </h3>
                    {selectedItem.task.descricao && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedItem.task.descricao}
                      </p>
                    )}
                  </div>

                  {/* Quem completou */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Completado por</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50">
                      <Avatar className="h-14 w-14 border-2 border-border/50">
                        <AvatarImage src={selectedItem.profile.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold text-lg">
                          {selectedItem.profile.nome[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-base">
                          {selectedItem.profile.nome}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          <p className="text-sm text-muted-foreground font-medium">
                            {selectedItem.profile.total_points} pontos totais
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* XP ganho */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Star className="h-4 w-4" />
                      <span>Pontos ganhos</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/30">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          +{selectedItem.xp_earned}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                          XP ganho
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Data de conclusão */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Quando foi completado</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50">
                      <p className="text-base font-semibold text-foreground">
                        {formatDistanceToNow(selectedItem.completed_at)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(selectedItem.completed_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Tipo de recorrência */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clipboard className="h-4 w-4" />
                      <span>Tipo de tarefa</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1.5 bg-secondary/60 rounded-full text-sm font-medium text-secondary-foreground">
                        {recurrenceLabels[selectedItem.task.recurrence_type]}
                      </span>
                      {selectedItem.task.recurrence_type === "weekly" &&
                        selectedItem.task.days_of_week &&
                        selectedItem.task.days_of_week.length > 0 && (
                          <span className="inline-flex items-center px-3 py-1.5 bg-secondary/60 rounded-full text-sm font-medium text-secondary-foreground">
                            {selectedItem.task.days_of_week.length}{" "}
                            {selectedItem.task.days_of_week.length === 1
                              ? "dia"
                              : "dias"}
                            /semana
                          </span>
                        )}
                      {selectedItem.task.recurrence_type === "weekly" &&
                        selectedItem.task.days_of_week &&
                        selectedItem.task.days_of_week.length > 0 && (
                          <div className="w-full flex flex-wrap gap-1.5 mt-2">
                            {selectedItem.task.days_of_week.map((day) => (
                              <span
                                key={day}
                                className="inline-flex items-center px-2.5 py-1 bg-primary/10 rounded-lg text-xs font-medium text-primary"
                              >
                                {dayNames[day]}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Botão de desfazer */}
                  <div className="pt-4 border-t">
                    <ConfirmButton
                      onConfirm={() => handleUndo(selectedItem, true)}
                      variant="destructive"
                      className="w-full thumb-friendly rounded-xl font-medium"
                      disabled={undoTask.isPending}
                    >
                      <Undo2 className="h-4 w-4 mr-2" />
                      Desfazer conclusão
                    </ConfirmButton>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </PullToRefreshWrapper>
  );

}
