import { TasksSummaryCard } from "./TasksSummaryCard";
import { BalanceCard } from "./BalanceCard";
import { ShoppingCard } from "./ShoppingCard";
import { RankingCard } from "./RankingCard";

interface DashboardGridProps {
  tasksData: {
    total: number;
    completed: number;
    myTasks: number;
  };
  balanceData: {
    balance: number;
    monthBudget?: number;
    totalSpent?: number;
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
}

export function DashboardGrid({ 
  tasksData, 
  balanceData, 
  shoppingData, 
  rankingData 
}: DashboardGridProps) {
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
      
      {/* Card de saldo - pequeno mas importante */}
      <div className="col-span-1">
        <BalanceCard
          balance={balanceData.balance}
          monthBudget={balanceData.monthBudget}
          totalSpent={balanceData.totalSpent}
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

