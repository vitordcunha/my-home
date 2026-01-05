import { useArchivedTasksQuery } from "./useArchivedTasksQuery";
import { useRestoreTask } from "./useRestoreTask";
import { usePermanentDeleteTask } from "./usePermanentDeleteTask";
import { useProfilesQuery } from "../auth/useProfilesQuery";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  RefreshCw,
  Trash2,
  Loader2,
  Sparkles,
  Calendar,
  Target,
  CalendarDays,
} from "lucide-react";

export function TasksTrashScreen() {
  const { data: archivedTasks, isLoading } = useArchivedTasksQuery();
  const { data: profiles } = useProfilesQuery();
  const restoreTask = useRestoreTask();
  const permanentDeleteTask = usePermanentDeleteTask();

  const handleRestore = async (taskId: string) => {
    await restoreTask.mutateAsync(taskId);
  };

  const handlePermanentDelete = async (taskId: string, taskName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir permanentemente "${taskName}"?\n\nEsta ação não pode ser desfeita e o histórico da tarefa será mantido.`
      )
    ) {
      return;
    }
    await permanentDeleteTask.mutateAsync(taskId);
  };

  const getProfileName = (userId: string | null) => {
    if (!userId) return "Sem responsável";
    return profiles?.find((p) => p.id === userId)?.nome || "Desconhecido";
  };

  const getProfileAvatar = (userId: string | null) => {
    if (!userId) return null;
    return profiles?.find((p) => p.id === userId)?.avatar || null;
  };

  const getRecurrenceInfo = (type: string, days?: number[] | null) => {
    if (type === "daily") {
      return { icon: Calendar, label: "Diária" };
    }
    if (type === "once") {
      return { icon: Target, label: "Uma vez" };
    }
    if (type === "weekly") {
      const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const selectedDays = days?.map((d) => dayLabels[d]).join(", ") || "?";
      return { icon: CalendarDays, label: selectedDays };
    }
    return { icon: Calendar, label: "" };
  };

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
              Carregando lixeira...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">
          Lixeira de Tarefas
        </h2>
        <p className="text-base text-muted-foreground">
          Tarefas arquivadas podem ser restauradas ou excluídas permanentemente
        </p>
      </div>

      {/* Archived Tasks */}
      {!archivedTasks || archivedTasks.length === 0 ? (
        <div className="text-center py-16 space-y-6 animate-in">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Lixeira vazia</h3>
            <p className="text-muted-foreground">
              Nenhuma tarefa arquivada no momento
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {archivedTasks.map((task) => {
            const recurrenceInfo = getRecurrenceInfo(
              task.recurrence_type,
              task.days_of_week
            );
            const RecurrenceIcon = recurrenceInfo.icon;

            return (
              <div
                key={task.id}
                className="bg-gradient-to-br from-muted/50 to-muted/30 border border-dashed rounded-2xl p-5 space-y-4 opacity-80 hover:opacity-100 transition-all shadow-soft animate-in"
              >
                {/* Task Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3
                      className="font-semibold text-lg leading-tight truncate"
                      title={task.nome}
                    >
                      {task.nome}
                    </h3>
                    {task.descricao && (
                      <p
                        className="text-sm text-muted-foreground leading-relaxed line-clamp-2"
                        title={task.descricao}
                      >
                        {task.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30 shrink-0">
                    <span className="text-base">⭐</span>
                    <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      {task.xp_value}
                    </span>
                  </div>
                </div>

                {/* Task Meta */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <RecurrenceIcon className="h-4 w-4" />
                    <span className="font-medium">{recurrenceInfo.label}</span>
                  </div>
                  {task.assigned_to && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5 shrink-0">
                          {getProfileAvatar(task.assigned_to) ? (
                            <img
                              src={getProfileAvatar(task.assigned_to)!}
                              alt={getProfileName(task.assigned_to)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xs font-bold">
                              {getProfileName(task.assigned_to)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </Avatar>
                        <span
                          className="font-medium truncate max-w-[120px]"
                          title={getProfileName(task.assigned_to)}
                        >
                          {getProfileName(task.assigned_to)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleRestore(task.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl thumb-friendly"
                    disabled={restoreTask.isPending}
                    title="Restaurar tarefa"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        restoreTask.isPending ? "animate-spin" : ""
                      }`}
                    />
                    Restaurar
                  </Button>
                  <Button
                    onClick={() => handlePermanentDelete(task.id, task.nome)}
                    variant="destructive"
                    size="sm"
                    className="flex-1 rounded-xl thumb-friendly"
                    disabled={permanentDeleteTask.isPending}
                    title="Excluir permanentemente"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
