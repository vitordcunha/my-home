import { useTasksQuery } from "@/features/tasks/useTasksQuery";
import TaskCard from "./TaskCard";
import { Loader2 } from "lucide-react";

interface TaskListProps {
  onlyMyTasks?: boolean;
  userId?: string;
}

export default function TaskList({ onlyMyTasks = true, userId }: TaskListProps) {
  const { data: tasks, isLoading, error } = useTasksQuery({ onlyMyTasks, userId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4 animate-in">
          <div className="relative h-12 w-12 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 animate-pulse"></div>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 animate-in">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-destructive/10 mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <p className="text-destructive font-medium">
          Erro ao carregar tarefas
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : "Erro desconhecido"}
        </p>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-16 space-y-6 animate-in">
        <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
          <span className="text-6xl">🎉</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold">Tudo feito!</h3>
          <p className="text-base text-muted-foreground">
            Não há tarefas pendentes para hoje.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
