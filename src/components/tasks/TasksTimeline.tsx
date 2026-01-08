import { useMemo } from "react";
import { addDays, format, isToday, startOfDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Calendar as CalendarIcon, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

import { TaskWithStatus } from "@/features/tasks/useTasksQuery";

interface TasksTimelineProps {
    tasks: TaskWithStatus[];
}

export function TasksTimeline({ tasks }: TasksTimelineProps) {
    // Generate next 7 days
    const days = useMemo(() => {
        const today = startOfDay(new Date());
        return Array.from({ length: 7 }).map((_, i) => addDays(today, i));
    }, []);

    // Use a similar structure to FinancialDashboard's groupedTimeline
    const timelineData = useMemo(() => {
        return days.map(date => {
            const dayOfWeek = getDay(date);
            const isDateToday = isToday(date);

            const dateTasks = tasks.filter((task) => {
                if (!task.is_active) return false;

                // Daily tasks always appear
                if (task.recurrence_type === "daily") return true;

                // Weekly tasks appear if the day matches
                if (task.recurrence_type === "weekly") {
                    return task.days_of_week?.includes(dayOfWeek);
                }

                // Once tasks: Show only if it is today and NOT completed (backlog style) 
                // OR if it is today and IS completed.
                // Actually, for "Timeline", we often just want recurrence. 
                // But let's include 'Once' tasks only for TODAY.
                if (task.recurrence_type === 'once' && isDateToday) {
                    return true;
                }

                return false;
            }).sort((a, b) => {
                // Sort: Completed last, then by XP (desc)
                if (isDateToday) {
                    if (a.is_completed_today !== b.is_completed_today) {
                        return a.is_completed_today ? 1 : -1;
                    }
                }
                return b.xp_value - a.xp_value;
            });

            return {
                date: date.toISOString(),
                dateObj: date,
                dateLabel: format(date, "dd 'de' MMMM, EEEE", { locale: ptBR }),
                isToday: isDateToday,
                tasks: dateTasks
            };
        }).filter(day => day.tasks.length > 0);
    }, [days, tasks]);

    if (timelineData.length === 0) {
        return (
            <div className="border-dashed bg-muted/10 p-8 text-center rounded-lg border">
                <p className="text-sm text-muted-foreground">Nenhuma tarefa programada para os próximos dias.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative pb-10">
            {/* Vertical line connecting days */}
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-transparent via-border to-transparent z-0 md:left-6 transition-all opacity-50" />

            <AnimatePresence mode="popLayout">
                {timelineData.map((day, dayIndex) => (
                    <motion.div
                        key={day.date}
                        className="relative z-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dayIndex * 0.1 }}
                    >
                        {/* Sticky Header per day */}
                        <div className="flex items-center gap-3 mb-4 bg-background/80 backdrop-blur-md py-2 sticky top-0 z-20 rounded-lg">
                            <div className={cn(
                                "h-2.5 w-2.5 rounded-full ring-4 ring-background ml-[15px] md:ml-[20px] shadow-sm transition-colors",
                                day.isToday ? "bg-primary" : "bg-muted-foreground/40"
                            )} />
                            <div className="flex-1 flex items-center justify-between border-b border-border/50 pb-1 mr-1">
                                <span className={cn(
                                    "text-sm font-semibold capitalize",
                                    day.isToday ? "text-primary" : "text-foreground/90"
                                )}>
                                    {day.isToday ? "Hoje" : day.dateLabel}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {day.tasks.length} tarefas
                                </span>
                            </div>
                        </div>

                        {/* Task Items */}
                        <div className="pl-10 space-y-3 pr-1">
                            {day.tasks.map((task, taskIndex) => (
                                <motion.div
                                    key={`${task.id}-${day.date}`}
                                    whileHover={{ x: 4 }}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: taskIndex * 0.05 }}
                                >
                                    <div className={cn(
                                        "group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 border",
                                        day.isToday && task.is_completed_today
                                            ? "opacity-60 bg-transparent border-dashed border-border"
                                            : "bg-card/50 border-transparent hover:border-primary/20 hover:bg-card hover:shadow-sm"
                                    )}>
                                        <div className="mt-0.5 flex-shrink-0">
                                            {day.isToday && task.is_completed_today ? (
                                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                            ) : day.isToday ? (
                                                <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            ) : (
                                                task.recurrence_type === 'daily' ? (
                                                    <Clock className="h-5 w-5 text-muted-foreground/50" />
                                                ) : (
                                                    <CalendarIcon className="h-5 w-5 text-muted-foreground/50" />
                                                )
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-sm font-medium text-foreground transition-colors",
                                                day.isToday && task.is_completed_today && "line-through text-muted-foreground"
                                            )}>
                                                {task.nome}
                                            </p>

                                            <div className="flex items-center gap-2 mt-1">
                                                {task.recurrence_type === 'daily' && (
                                                    <span className="text-[10px] bg-sky-500/10 text-sky-600 px-1.5 py-0.5 rounded-sm font-medium">
                                                        Diário
                                                    </span>
                                                )}
                                                {task.recurrence_type === 'weekly' && (
                                                    <span className="text-[10px] bg-violet-500/10 text-violet-600 px-1.5 py-0.5 rounded-sm font-medium">
                                                        Semanal
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-muted-foreground">
                                                    +{task.xp_value} XP
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
