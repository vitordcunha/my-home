import { useState } from "react";
import TaskFormDialog from "@/components/tasks/TaskFormDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { PullToRefreshWrapper } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { TasksSummary } from "@/components/dashboard/TasksSummary";
import { useTasksQuery } from "@/features/tasks/useTasksQuery";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { useShoppingItemsQuery } from "@/features/shopping/useShoppingItemsQuery";
import { useRankingQuery } from "@/features/gamification/useRankingQuery";
import { PageHeader } from "@/components/ui/page-header";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AddExpenseSheet } from "@/features/expenses/AddExpenseSheet";
import { AddItemSheet } from "@/features/shopping/AddItemSheet";
import { useAddShoppingItem } from "@/features/shopping/useAddShoppingItem";
import { ShoppingCategory } from "@/features/shopping/types";
import { useFinancialHealth } from "@/features/analytics/hooks/useFinancialHealth";
import { useFinancialTimeline } from "@/features/expenses/useFinancialBalance";


export default function TodayScreen() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExpenseSheet, setShowExpenseSheet] = useState(false);
  const [showItemSheet, setShowItemSheet] = useState(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all data for dashboard
  const { data: profile } = useProfileQuery(user?.id);

  const addItem = useAddShoppingItem();

  const { data: allTasks } = useTasksQuery({ onlyMyTasks: false });

  // Data for Balance & Bills
  const todayDate = new Date();
  const currentMonth = todayDate.getMonth() + 1;
  const currentYear = todayDate.getFullYear();

  const health = useFinancialHealth({
    householdId: profile?.household_id || undefined,
    userId: user?.id,
  });

  const { data: timeline } = useFinancialTimeline(
    profile?.household_id || undefined,
    currentMonth,
    currentYear
  );

  const { data: shoppingItems } = useShoppingItemsQuery(
    profile?.household_id ?? undefined
  );
  const { data: ranking } = useRankingQuery();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    await queryClient.invalidateQueries({ queryKey: ["financialBalance"] });
    await queryClient.invalidateQueries({ queryKey: ["financialTimeline"] });
    await queryClient.invalidateQueries({ queryKey: ["shopping"] });
    await queryClient.invalidateQueries({ queryKey: ["ranking"] });
    await queryClient.invalidateQueries({ queryKey: ["household"] });
  };

  const handleAddItem = (data: {
    name: string;
    category: ShoppingCategory;
    emoji: string;
  }) => {
    if (!profile?.household_id || !user?.id) return;

    addItem.mutate(
      {
        householdId: profile.household_id,
        userId: user.id,
        ...data,
      },
      {
        onSuccess: () => {
          setShowItemSheet(false);
        },
      }
    );
  };

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Calculate specific balance metrics
  const totalScheduled = (health?.futureCommitments || 0) + (health?.flexibleCommitments || 0);
  const availableBalance = (health?.currentBalance || 0) - totalScheduled;

  // Prepare dashboard data
  const dashboardData = {
    tasksData: {
      total: allTasks?.length || 0,
      completed: 0,
      myTasks: allTasks?.length || 0,
    },
    balanceData: {
      availableBalance: availableBalance,
      dailySpendingPower: health?.dailyBudget || 0,
    },
    shoppingData: {
      totalItems: shoppingItems?.length || 0,
      urgentItems: 0,
    },
    rankingData: {
      topUserName: ranking?.[0]?.nome || "Ninguém",
      topUserPoints: ranking?.[0]?.total_points || 0,
      currentUserPosition:
        ranking && user?.id
          ? ranking.findIndex((r) => r.id === user.id) + 1 || undefined
          : undefined,
      currentUserPoints:
        ranking && user?.id
          ? ranking.find((r) => r.id === user.id)?.total_points
          : undefined,
    },
  };

  return (
    <>
      <PullToRefreshWrapper onRefresh={handleRefresh}>
        <div className="space-y-6">
          {/* Header da página atualizado */}
          <PageHeader
            title="Resumo de Hoje"
            description={today}
            className="capitalize"
            actions={
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="hidden md:flex gap-2"
                size="default"
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium">Nova Tarefa</span>
              </Button>
            }
          />

          {/* Widget de Acesso Rápido */}
          <QuickActions
            onNewTask={() => setShowCreateDialog(true)}
            onNewExpense={() => setShowExpenseSheet(true)}
            onNewItem={() => setShowItemSheet(true)}
          />

          {/* Dashboard com Bento Grid */}
          <DashboardGrid
            tasksData={dashboardData.tasksData}
            balanceData={dashboardData.balanceData}
            shoppingData={dashboardData.shoppingData}
            rankingData={dashboardData.rankingData}
            timeline={timeline || []}
          />

          {/* Resumo de Tarefas */}
          <TasksSummary maxTasks={5} />
        </div >
      </PullToRefreshWrapper >

      <TaskFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <AddExpenseSheet
        open={showExpenseSheet}
        onOpenChange={setShowExpenseSheet}
        householdId={profile?.household_id || ""}
        userId={user?.id || ""}
      />

      <AddItemSheet
        open={showItemSheet}
        onOpenChange={setShowItemSheet}
        onSubmit={handleAddItem}
        isPending={addItem.isPending}
      />
    </>
  );
}
