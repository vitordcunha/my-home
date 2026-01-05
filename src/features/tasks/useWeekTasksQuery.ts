import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TaskWithStatus } from "./useTasksQuery";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface DayTasks {
  date: Date;
  dayName: string;
  dayNumber: number;
  tasks: TaskWithStatus[];
  totalPoints: number;
  taskCount: number;
  density: "light" | "moderate" | "heavy" | "overload";
}

export interface WeekView {
  startDate: Date;
  endDate: Date;
  days: DayTasks[];
}

export function useWeekTasksQuery(weekStart?: Date) {
  const start = weekStart || startOfWeek(new Date(), { weekStartsOn: 1 }); // Segunda-feira
  const end = endOfWeek(start, { weekStartsOn: 1 });

  return useQuery({
    queryKey: ["tasks", "week", format(start, "yyyy-MM-dd")],
    queryFn: async (): Promise<WeekView> => {
      const { data: tasks, error } = await supabase
        .from("tasks_master")
        .select("*")
        .eq("is_active", true)
        .order("xp_value", { ascending: false });

      if (error) throw error;

      // Buscar histórico de conclusões da semana
      const { data: history } = await supabase
        .from("tasks_history")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      const days = eachDayOfInterval({ start, end }).map((date) => {
        const dayOfWeek = date.getDay();
        const dayName = format(date, "EEEE", { locale: ptBR });

        // Filtrar tarefas para este dia
        const dayTasks = (tasks || []).filter((task: any) => {
          // Diárias aparecem todos os dias
          if (task.recurrence_type === "daily") return true;

          // Semanais apenas nos dias configurados
          if (task.recurrence_type === "weekly") {
            return task.days_of_week?.includes(dayOfWeek) || false;
          }

          // Únicas: verificar se já foram concluídas
          if (task.recurrence_type === "once") {
            const wasCompleted = history?.some((h: any) => h.task_id === task.id);
            return !wasCompleted;
          }

          return false;
        });

        // Remover tarefas concluídas nas últimas 24h
        const filteredTasks = dayTasks.filter((task: any) => {
          const recentCompletion = history?.find(
            (h: any) =>
              h.task_id === task.id &&
              isSameDay(new Date(h.created_at), date)
          );
          return !recentCompletion;
        }) as TaskWithStatus[];

        const totalPoints = filteredTasks.reduce(
          (sum, task) => sum + task.xp_value,
          0
        );
        const taskCount = filteredTasks.length;

        // Calcular densidade
        let density: DayTasks["density"] = "light";
        if (taskCount >= 10) density = "overload";
        else if (taskCount >= 7) density = "heavy";
        else if (taskCount >= 4) density = "moderate";

        return {
          date,
          dayName,
          dayNumber: date.getDate(),
          tasks: filteredTasks,
          totalPoints,
          taskCount,
          density,
        };
      });

      return {
        startDate: start,
        endDate: end,
        days,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

