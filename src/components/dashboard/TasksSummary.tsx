import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/useAuth";
import { useTasksQuery } from "@/features/tasks/useTasksQuery";
import { useCompleteTask } from "@/features/tasks/useCompleteTask";
import { useHaptic } from "@/hooks/useHaptic";

interface TasksSummaryProps {
    maxTasks?: number;
}

export function TasksSummary({ maxTasks = 5 }: TasksSummaryProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { trigger } = useHaptic();

    const { data: tasks, isLoading } = useTasksQuery({
        onlyMyTasks: true,
        userId: user?.id,
    });

    const completeTask = useCompleteTask();

    const displayTasks = tasks?.slice(0, maxTasks) || [];
    const hasMoreTasks = (tasks?.length || 0) > maxTasks;



    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ListTodo className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Suas Tarefas</h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!tasks || tasks.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ListTodo className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Suas Tarefas</h3>
                        </div>
                        <Button
                            onClick={() => navigate("/tasks")}
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs"
                        >
                            Ver todas
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Nenhuma tarefa pendente
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Você está em dia! 🎉
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ListTodo className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Suas Tarefas</h3>
                        <span className="text-xs text-muted-foreground">
                            ({tasks.length})
                        </span>
                    </div>
                    <Button
                        onClick={() => navigate("/tasks")}
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs"
                    >
                        Ver todas
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {displayTasks.map((task) => (
                    <div
                        key={task.id}
                        className={cn(
                            "flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
                            "bg-secondary/30 border border-transparent hover:border-primary/20",
                            "hover:bg-secondary/50 cursor-pointer group",
                            task.is_completed_today && "opacity-60 bg-transparent border-dashed border-border"
                        )}
                        onClick={() => {
                            if (user?.id) {
                                trigger("light");
                                completeTask.mutate({
                                    taskId: task.id,
                                    userId: user.id,
                                    xpValue: task.xp_value,
                                    taskName: task.nome,
                                });
                            }
                        }}
                    >
                        <button
                            className="mt-0.5 flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (user?.id) {
                                    trigger("light");
                                    completeTask.mutate({
                                        taskId: task.id,
                                        userId: user.id,
                                        xpValue: task.xp_value,
                                        taskName: task.nome,
                                    });
                                }
                            }}
                        >
                            {task.is_completed_today ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                                <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            )}
                        </button>

                        <div className="flex-1 min-w-0">
                            <p
                                className={cn(
                                    "text-sm font-medium text-foreground",
                                    task.is_completed_today && "line-through text-muted-foreground"
                                )}
                            >
                                {task.nome}
                            </p>
                            {task.descricao && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {task.descricao}
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {hasMoreTasks && (
                    <Button
                        onClick={() => navigate("/tasks")}
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                    >
                        Ver mais {tasks.length - maxTasks} tarefas
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
