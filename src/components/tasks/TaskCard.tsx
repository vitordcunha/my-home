import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/useAuth";
import { useCompleteTask } from "@/features/tasks/useCompleteTask";
import { useDeleteTask } from "@/features/tasks/useDeleteTask";
import { TaskWithStatus } from "@/features/tasks/useTasksQuery";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/types/database";
import { Check, Users, Edit2, Trash2, MoreVertical, Star, Sparkles, RotateCw } from "lucide-react";
import TaskFormDialog from "./TaskFormDialog";
import { useSwipeable } from "react-swipeable";
import { useHaptic } from "@/hooks/useHaptic";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface TaskCardProps {
  task: TaskWithStatus;
}

const recurrenceLabels = {
  daily: "Diária",
  weekly: "Semanal",
  once: "Única",
};

export default function TaskCard({ task }: TaskCardProps) {
  const { user } = useAuth();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const [showPeopleSheet, setShowPeopleSheet] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );
  const [hapticFired, setHapticFired] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { trigger } = useHaptic();

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as Profile[];
    },
  });

  const handleComplete = (userId: string) => {
    setIsCompleting(true);
    trigger("success");
    
    // Pequeno delay para mostrar a animação
    setTimeout(() => {
      completeTask.mutate({
        taskId: task.id,
        userId,
        xpValue: task.xp_value,
        taskName: task.nome,
      });
      setShowPeopleSheet(false);
    }, 300);
  };

  const handleDelete = () => {
    const truncatedTaskName =
      task.nome.length > 50 ? task.nome.substring(0, 50) + "..." : task.nome;
    if (confirm(`Tem certeza que deseja remover "${truncatedTaskName}"?`)) {
      trigger("error");
      deleteTask.mutate(task.id);
      setShowActionsSheet(false);
    }
  };

  const handleEdit = () => {
    trigger("light");
    setShowActionsSheet(false);
    setShowEditDialog(true);
  };

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedRight: (e) => {
      // Só executa se o movimento horizontal for maior que o vertical
      // E se o movimento foi significativo o suficiente (pelo menos 60% do necessário)
      const minSwipeDistance = 100; // Distância mínima em pixels
      const swipeDistance = Math.abs(e.deltaX);
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const isSignificant = swipeDistance >= minSwipeDistance * 0.6; // 60% = 180px

      if (isHorizontal && isSignificant) {
        // Swipe direita = "Eu fiz"
        handleComplete(user!.id);
      }
      setSwipeProgress(0);
      setSwipeDirection(null);
      setHapticFired(false);
    },
    onSwipedLeft: (e) => {
      // Só executa se o movimento horizontal for maior que o vertical
      // E se o movimento foi significativo o suficiente (pelo menos 60% do necessário)
      const minSwipeDistance = 100; // Distância mínima em pixels
      const swipeDistance = Math.abs(e.deltaX);
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const isSignificant = swipeDistance >= minSwipeDistance * 0.6; // 60% = 180px

      if (isHorizontal && isSignificant) {
        // Swipe esquerda = "Outra pessoa"
        trigger("light");
        setShowPeopleSheet(true);
      }
      setSwipeProgress(0);
      setSwipeDirection(null);
      setHapticFired(false);
    },
    onSwiping: (e) => {
      // Ignora swipe se o movimento vertical for maior que o horizontal (scroll)
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        setSwipeProgress(0);
        setSwipeDirection(null);
        return;
      }

      // Aumenta a distância necessária para completar o swipe (de 200px para 300px)
      const swipeDistance = 300;
      const progress = Math.abs(e.deltaX) / swipeDistance;
      const clampedProgress = Math.min(progress, 1);
      setSwipeProgress(clampedProgress);
      setSwipeDirection(e.deltaX > 0 ? "right" : "left");

      // Haptic feedback ao atingir threshold (agora em 70% = 210px)
      if (clampedProgress > 0.7 && !hapticFired) {
        trigger("medium");
        setHapticFired(true);
      }
    },
    onSwiped: () => {
      setSwipeProgress(0);
      setSwipeDirection(null);
      setHapticFired(false);
    },
    trackTouch: true,
    trackMouse: false, // Mobile-first: apenas touch
    preventScrollOnSwipe: false, // Permite scroll vertical
    delta: 40, // Aumenta o threshold mínimo para evitar ativação acidental
    touchEventOptions: { passive: false },
  });

  // Estilo dinâmico para swipe
  const swipeStyle = {
    transform: `translateX(${
      swipeProgress * (swipeDirection === "right" ? 100 : -100)
    }px)`,
    transition:
      swipeProgress === 0
        ? "transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)"
        : "none",
    willChange: swipeProgress > 0 ? "transform" : "auto",
  };

  // Background indicators para swipe
  const showRightIndicator = swipeDirection === "right" && swipeProgress > 0.4;
  const showLeftIndicator = swipeDirection === "left" && swipeProgress > 0.4;
  const thresholdReached = swipeProgress > 0.7; // Aumentado para 70% (210px de 300px)

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        {/* Background indicators */}
        {showRightIndicator && (
          <div
            className={`absolute inset-0 flex items-center justify-start pl-6 rounded-2xl transition-all ${
              thresholdReached
                ? "bg-success/20 border-2 border-success/50"
                : "bg-success/10 border border-success/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <Check
                className={`h-6 w-6 text-success ${
                  thresholdReached ? "animate-bounce" : ""
                }`}
              />
              <span className="font-semibold text-success">Eu fiz</span>
            </div>
          </div>
        )}
        {showLeftIndicator && (
          <div
            className={`absolute inset-0 flex items-center justify-end pr-6 rounded-2xl transition-all ${
              thresholdReached
                ? "bg-primary/20 border-2 border-primary/50"
                : "bg-primary/10 border border-primary/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">Outra pessoa</span>
              <Users
                className={`h-6 w-6 text-primary ${
                  thresholdReached ? "animate-bounce" : ""
                }`}
              />
            </div>
          </div>
        )}

        {/* Card principal com swipe */}
        <div
          {...swipeHandlers}
          style={swipeStyle}
          className={`group bg-card border rounded-2xl p-5 space-y-4 shadow-soft hover-lift animate-in relative z-10 transition-all ${
            isCompleting ? "animate-confetti scale-105 bg-success/10 border-success/50" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3
                  className="font-semibold text-lg leading-tight tracking-tight line-clamp-2 flex-1"
                  title={task.nome}
                >
                  {task.nome}
                </h3>
                {task.assigned_to &&
                  (() => {
                    const assignedProfile = profiles.find(
                      (p) => p.id === task.assigned_to
                    );
                    return assignedProfile ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {assignedProfile.avatar ? (
                          <Avatar className="h-8 w-8 shrink-0 border-2 border-border/50">
                            <AvatarImage src={assignedProfile.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold text-xs">
                              {assignedProfile.nome[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-border/50 flex items-center justify-center text-primary font-semibold text-xs">
                            {assignedProfile.nome[0].toUpperCase()}
                          </div>
                        )}
                        {task.rotation_enabled && (
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20" title="Rodízio automático ativo">
                            <RotateCw className="h-3 w-3 text-primary" />
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
              </div>
              {task.descricao && (
                <p
                  className="text-sm text-muted-foreground leading-relaxed line-clamp-3"
                  title={task.descricao}
                >
                  {task.descricao}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30">
                <Star className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  {task.xp_value}
                </span>
              </div>
              <button
                onClick={() => setShowActionsSheet(true)}
                className="p-2 hover:bg-accent rounded-xl transition-all opacity-60 group-hover:opacity-100"
                aria-label="Mais opções"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 bg-secondary/60 rounded-full text-xs font-medium text-secondary-foreground">
              {recurrenceLabels[task.recurrence_type]}
            </span>
            {task.recurrence_type === "weekly" && task.days_of_week && (
              <span className="inline-flex items-center px-3 py-1 bg-secondary/60 rounded-full text-xs font-medium text-secondary-foreground">
                {task.days_of_week.length}{" "}
                {task.days_of_week.length === 1 ? "dia" : "dias"}/semana
              </span>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 thumb-friendly rounded-xl font-medium shadow-sm hover:shadow transition-all"
              onClick={() => handleComplete(user!.id)}
              disabled={completeTask.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Eu fiz
            </Button>
            <Button
              variant="outline"
              className="flex-1 thumb-friendly rounded-xl font-medium"
              onClick={() => setShowPeopleSheet(true)}
              disabled={completeTask.isPending}
            >
              <Users className="h-4 w-4 mr-2" />
              Outra pessoa
            </Button>
          </div>
        </div>
      </div>

      {/* Sheet: Quem fez a tarefa */}
      <Sheet open={showPeopleSheet} onOpenChange={setShowPeopleSheet}>
        <SheetContent
          side="bottom"
          className="h-auto max-h-[500px] rounded-t-3xl border-t"
        >
          <SheetHeader className="space-y-3 pb-6">
            <SheetTitle className="text-xl">Quem fez esta tarefa?</SheetTitle>
            <SheetDescription className="text-base truncate" title={task.nome}>
              {task.nome}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-2 pb-6">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleComplete(profile.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-accent transition-all thumb-friendly hover-lift"
              >
                <Avatar className="h-12 w-12 border-2 border-border/50">
                  <AvatarImage src={profile.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold">
                    {profile.nome[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p
                    className="font-semibold text-base truncate"
                    title={profile.nome}
                  >
                    {profile.nome}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm text-muted-foreground font-medium">
                      {profile.total_points} pontos
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet: Ações (Editar/Deletar) */}
      <Sheet open={showActionsSheet} onOpenChange={setShowActionsSheet}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl border-t">
          <SheetHeader className="space-y-3 pb-6">
            <SheetTitle className="text-xl">Ações</SheetTitle>
            <SheetDescription className="text-base truncate" title={task.nome}>
              {task.nome}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-2 pb-6">
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-accent transition-all thumb-friendly hover-lift"
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Edit2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-base">Editar Tarefa</p>
                <p className="text-sm text-muted-foreground">
                  Alterar nome, pontos ou recorrência
                </p>
              </div>
            </button>

            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-destructive/10 transition-all thumb-friendly hover-lift"
            >
              <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-base text-destructive">
                  Remover Tarefa
                </p>
                <p className="text-sm text-muted-foreground">
                  A tarefa será desativada
                </p>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog: Editar Tarefa */}
      <TaskFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        task={task}
      />
    </>
  );
}
