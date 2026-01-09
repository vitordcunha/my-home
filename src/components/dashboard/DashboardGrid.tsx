import { TasksSummaryCard } from "./TasksSummaryCard";
import { BalanceCard } from "./BalanceCard";
import { ShoppingCard } from "./ShoppingCard";
import { RankingCard } from "./RankingCard";
import { UpcomingBillsCard } from "@/features/expenses/UpcomingBillsCard";
import { TimelineItem } from "@/features/expenses/useFinancialBalance";
import { useNavigate } from "react-router-dom";

interface DashboardGridProps {
  tasksData: {
    total: number;
    completed: number;
    myTasks: number;
  };
  balanceData: {
    availableBalance: number;
    dailySpendingPower: number;
  };
  shoppingData: {
    totalItems: number;
    urgentItems?: number;
  };
  rankingData: {
    topUserName: string;
    topUserPoints: number;
    currentUserPosition?: number;
    currentUserPoints?: number;
  };
  timeline: TimelineItem[];
}

export function DashboardGrid({
  tasksData,
  balanceData,
  shoppingData,
  rankingData,
  timeline
}: DashboardGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8 animate-stagger">
      {/* Card grande de tarefas - destaque principal */}
      <div className="col-span-2">
        <TasksSummaryCard
          totalTasks={tasksData.total}
          completedTasks={tasksData.completed}
          myTasks={tasksData.myTasks}
        />
      </div>

      {/* Próximas Contas - Destaque financeiro (NOVO) */}
      <div className="col-span-2">
        <UpcomingBillsCard
          transactions={timeline}
          onViewAll={() => navigate("/expenses")}
        />
      </div>

      {/* Card de saldo - pequeno mas importante */}
      <div className="col-span-1">
        <BalanceCard
          availableBalance={balanceData.availableBalance}
          dailySpendingPower={balanceData.dailySpendingPower}
        />
      </div>

      {/* Card de lista de compras - pequeno */}
      <div className="col-span-1">
        <ShoppingCard
          totalItems={shoppingData.totalItems}
          urgentItems={shoppingData.urgentItems}
        />
      </div>

      {/* Card de ranking - médio destaque */}
      <div className="col-span-2">
        <RankingCard
          topUserName={rankingData.topUserName}
          topUserPoints={rankingData.topUserPoints}
          currentUserPosition={rankingData.currentUserPosition}
          currentUserPoints={rankingData.currentUserPoints}
        />
      </div>
    </div>
  );
}

