import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TaskList from "@/components/tasks/TaskList";
import TaskFormDialog from "@/components/tasks/TaskFormDialog";
import { Button } from "@/components/ui/button";
import { Plus, User, Users, History } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { PullToRefreshWrapper } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";

export default function TodayScreen() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [onlyMyTasks, setOnlyMyTasks] = useState(true);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <PullToRefreshWrapper onRefresh={handleRefresh}>
        <div className="space-y-8">
          {/* Header da página */}
          <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Tarefas de Hoje</h2>
            <p className="text-base text-muted-foreground capitalize">
              {today}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="hidden md:flex thumb-friendly rounded-xl shadow-sm hover:shadow transition-all gap-2"
            size="default"
          >
            <Plus className="h-4 w-4" />
            <span className="font-medium">Nova Tarefa</span>
          </Button>
        </div>

        {/* Filtro de visualização */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setOnlyMyTasks(true)}
              variant={onlyMyTasks ? "default" : "outline"}
              size="sm"
              className="rounded-xl transition-all gap-2"
            >
              <User className="h-4 w-4" />
              <span className="font-medium">Minhas Tarefas</span>
            </Button>
            <Button
              onClick={() => setOnlyMyTasks(false)}
              variant={!onlyMyTasks ? "default" : "outline"}
              size="sm"
              className="rounded-xl transition-all gap-2"
            >
              <Users className="h-4 w-4" />
              <span className="font-medium">Todas as Tarefas</span>
            </Button>
          </div>
          <Button
            onClick={() => navigate("/history")}
            variant="outline"
            size="sm"
            className="rounded-xl transition-all gap-2 hover:bg-primary/10"
          >
            <History className="h-4 w-4" />
            <span className="font-medium hidden sm:inline">Histórico</span>
          </Button>
        </div>

          {/* Lista de tarefas */}
          <TaskList onlyMyTasks={onlyMyTasks} userId={user?.id} />
        </div>
      </PullToRefreshWrapper>

      {/* Floating Action Button - Design mais elegante */}
      <button
        onClick={() => setShowCreateDialog(true)}
        className="group fixed bottom-24 right-6 z-30 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-soft-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center md:hidden"
        aria-label="Criar nova tarefa"
      >
        <Plus className="h-6 w-6 transition-transform group-hover:rotate-90 duration-200" />
      </button>

      <TaskFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
