import { CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { useNavigate } from "react-router-dom";

interface TasksSummaryCardProps {
  totalTasks: number;
  completedTasks: number;
  myTasks: number;
}

export function TasksSummaryCard({ totalTasks, completedTasks, myTasks }: TasksSummaryCardProps) {
  const navigate = useNavigate();
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <BentoCard
      className="col-span-2"
      onClick={() => navigate("/")}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-muted">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <h3 className="font-semibold">Tarefas de Hoje</h3>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold">{pendingTasks}</span>
              <span className="text-muted-foreground">
                {pendingTasks === 1 ? "tarefa pendente" : "tarefas pendentes"}
              </span>
            </div>

            {myTasks > 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Circle className="h-3 w-3" />
                {myTasks} {myTasks === 1 ? "atribuída" : "atribuídas"} a você
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{Math.round(completionRate)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {completedTasks > 0 && (
            <div className="flex items-center gap-2 text-sm text-success">
              <TrendingUp className="h-4 w-4" />
              <span>{completedTasks} {completedTasks === 1 ? "concluída" : "concluídas"} hoje</span>
            </div>
          )}
        </div>
      </div>
    </BentoCard>
  );
}

