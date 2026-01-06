import { useState } from "react";
import { useWeekTasksQuery } from "./useWeekTasksQuery";
import { addWeeks, subWeeks, format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import TaskCard from "@/components/tasks/TaskCard";
import { useHaptic } from "@/hooks/useHaptic";
import { WeekViewSkeleton } from "@/components/skeletons/WeekViewSkeleton";

export function WeekViewScreen() {
  const [weekStart, setWeekStart] = useState(new Date());
  const [activeDay, setActiveDay] = useState(0);
  const queryClient = useQueryClient();
  const { trigger } = useHaptic();

  const { data: weekData, isLoading } = useWeekTasksQuery(weekStart);

  const handlePrevWeek = () => {
    setWeekStart((prev) => subWeeks(prev, 1));
    trigger("light");
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => addWeeks(prev, 1));
    trigger("light");
  };

  const handleToday = () => {
    setWeekStart(new Date());
    // Encontra o índice do dia atual (0 = Segunda)
    const today = new Date();
    const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    setActiveDay(dayIndex);
    trigger("medium");
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["tasks", "week"] });
    trigger("success");
  };

  const handleDayChange = (direction: "prev" | "next") => {
    if (direction === "prev" && activeDay > 0) {
      setActiveDay((prev) => prev - 1);
      trigger("light");
    } else if (direction === "next" && activeDay < 6) {
      setActiveDay((prev) => prev + 1);
      trigger("light");
    }
  };

  if (isLoading || !weekData) {
    return <WeekViewSkeleton />;
  }

  const densityTextColors = {
    light: "text-success",
    moderate: "text-yellow-600 dark:text-yellow-500",
    heavy: "text-orange-600 dark:text-orange-500",
    overload: "text-destructive",
  };

  // Dados do dia ativo
  const currentDay = weekData.days[activeDay];

  return (
    <div className="space-y-6">
      {/* Header com navegação de semana */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevWeek}
          className="rounded-xl thumb-friendly"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 text-center">
          <h2 className="text-lg font-bold">
            {format(weekData.startDate, "d MMM", { locale: ptBR })} -{" "}
            {format(weekData.endDate, "d MMM", { locale: ptBR })}
          </h2>
          <p className="text-xs text-muted-foreground">
            {format(weekData.startDate, "yyyy", { locale: ptBR })}
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          className="rounded-xl thumb-friendly"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Botão "Hoje" */}
      {!weekData.days.some((day) => isToday(day.date)) && (
        <Button
          onClick={handleToday}
          variant="outline"
          className="w-full rounded-xl font-medium gap-2"
        >
          <Calendar className="h-4 w-4" />
          Voltar para Hoje
        </Button>
      )}

      {/* Navegação de dias - Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {weekData.days.map((day, index) => (
          <button
            key={day.date.toISOString()}
            onClick={() => {
              setActiveDay(index);
              trigger("light");
            }}
            className={cn(
              "shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all min-w-[72px]",
              activeDay === index
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card"
            )}
          >
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {format(day.date, "EEE", { locale: ptBR })}
            </span>
            <span
              className={cn(
                "text-xl font-bold",
                isToday(day.date) && "text-primary",
                activeDay === index && "text-primary"
              )}
            >
              {day.dayNumber}
            </span>
            <div className="flex items-center gap-1 text-xs">
              <span className={densityTextColors[day.density]}>
                {day.taskCount}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Header do dia ativo com navegação */}
      <div className="flex items-center justify-between gap-3 px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDayChange("prev")}
          disabled={activeDay === 0}
          className="rounded-xl shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 text-center space-y-1">
          <h3 className="text-xl font-bold capitalize">
            {currentDay.dayName}
            {isToday(currentDay.date) && (
              <span className="ml-2 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                Hoje
              </span>
            )}
          </h3>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>{currentDay.taskCount} tarefas</span>
            <span>⭐ {currentDay.totalPoints} pts</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDayChange("next")}
          disabled={activeDay === 6}
          className="rounded-xl shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Botão de atualizar manual */}
      <Button
        variant="outline"
        onClick={handleRefresh}
        className="w-full rounded-xl font-medium text-sm"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Atualizar tarefas
      </Button>

      {/* Lista de tarefas do dia ativo */}
      <div className="space-y-3 pb-6">
        {currentDay.tasks.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <PartyPopper className="h-16 w-16 mx-auto text-primary" />
            <p className="text-lg font-medium">Nenhuma tarefa para este dia</p>
            <p className="text-sm text-muted-foreground">
              Aproveite seu tempo livre!
            </p>
          </div>
        ) : (
          currentDay.tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}


