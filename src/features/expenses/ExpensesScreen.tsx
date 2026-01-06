import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { useMonthlyExpensesQuery } from "./useExpensesQuery";
import { useTotalSpentQuery } from "./useTotalSpentQuery";
import { useCurrentMonthBudgetsQuery } from "./useBudgetsQuery";
import { AddExpenseSheet } from "./AddExpenseSheet";
import { ExpenseCard } from "./ExpenseCard";
import { TotalSpentCard } from "./BalanceSummaryCard";
import { ExpensesAnalytics } from "./ExpensesAnalytics";
import { BudgetManagementSheet } from "./BudgetManagementSheet";
import { FinancialOverviewCard } from "./FinancialOverviewCard";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Wallet,
  Lightbulb,
  List,
  BarChart3,
  Target,
  TrendingUp,
} from "lucide-react";
import { ExpenseListSkeleton } from "@/components/skeletons/ExpenseSkeleton";

export function ExpensesScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfileQuery(user?.id);
  const {
    data: monthlyExpenses,
    expenses,
    isLoading,
  } = useMonthlyExpensesQuery(profile?.household_id || undefined);
  const { data: totalSpent } = useTotalSpentQuery(
    profile?.household_id || undefined
  );
  const { data: currentBudgets } = useCurrentMonthBudgetsQuery(
    profile?.household_id || undefined
  );

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showBudgetSheet, setShowBudgetSheet] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "analytics">("list");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Expandir o primeiro mês automaticamente quando os dados carregarem
  useEffect(() => {
    if (
      monthlyExpenses &&
      monthlyExpenses.length > 0 &&
      expandedMonths.size === 0
    ) {
      setExpandedMonths(new Set([monthlyExpenses[0].month]));
      setSelectedMonth(monthlyExpenses[0].month);
    }
  }, [monthlyExpenses]);

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(month)) {
        newSet.delete(month);
      } else {
        newSet.add(month);
      }
      return newSet;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Despesas</h2>
          <p className="text-base text-muted-foreground">Carregando...</p>
        </div>
        <ExpenseListSkeleton />
      </div>
    );
  }

  const hasExpenses = expenses && expenses.length > 0;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Despesas</h2>
          <p className="text-base text-muted-foreground">
            {hasExpenses
              ? `${expenses.length} ${
                  expenses.length === 1 ? "despesa" : "despesas"
                } registradas`
              : "Comece a registrar suas despesas"}
          </p>
        </div>

        {/* Total Spent Card */}
        {totalSpent !== undefined && totalSpent > 0 && (
          <TotalSpentCard totalSpent={totalSpent} />
        )}

        {/* Financial Overview Card */}
        <FinancialOverviewCard householdId={profile?.household_id} />

        {/* Botão para Planejamento Completo */}
        <Button
          variant="outline"
          onClick={() => navigate("/expenses/planning")}
          className="w-full"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Ver Planejamento Financeiro Completo
        </Button>

        {/* Seletor de Visualização e Botão de Orçamentos */}
        {hasExpenses && monthlyExpenses && monthlyExpenses.length > 0 && (
          <div className="space-y-3">
            <div className="flex p-1 bg-muted/50 rounded-xl">
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-4 h-4" />
                Extrato
              </button>
              <button
                onClick={() => setViewMode("analytics")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "analytics"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Análise
              </button>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowBudgetSheet(true)}
              className="w-full"
            >
              <Target className="w-4 h-4 mr-2" />
              Gerenciar Orçamentos
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!hasExpenses && (
          <div className="text-center py-16 space-y-6 animate-in">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
              <Wallet className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Nenhuma despesa ainda</h3>
              <p className="text-muted-foreground">
                Registre despesas para manter transparência financeira.
              </p>
            </div>
          </div>
        )}

        {/* Conteúdo baseado no modo de visualização */}
        {viewMode === "analytics" ? (
          /* Modo Análise */
          hasExpenses && monthlyExpenses && monthlyExpenses.length > 0 ? (
            <div className="space-y-6">
              {/* Seletor de Mês para Análise */}
              {monthlyExpenses.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {monthlyExpenses.map((monthData) => (
                    <button
                      key={monthData.month}
                      onClick={() => setSelectedMonth(monthData.month)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        selectedMonth === monthData.month
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {monthData.monthLabel}
                    </button>
                  ))}
                </div>
              )}

              {/* Gráficos do mês selecionado */}
              {selectedMonth && (
                <>
                  {monthlyExpenses
                    .filter((m) => m.month === selectedMonth)
                    .map((monthData) => (
                      <ExpensesAnalytics
                        key={monthData.month}
                        expenses={monthData.expenses}
                        periodLabel={monthData.monthLabel}
                        budgets={currentBudgets}
                      />
                    ))}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-16 space-y-6 animate-in">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                <BarChart3 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  Nenhum dado para análise
                </h3>
                <p className="text-muted-foreground">
                  Registre despesas para ver gráficos e análises.
                </p>
              </div>
            </div>
          )
        ) : (
          /* Modo Extrato (Lista) */
          hasExpenses && monthlyExpenses && (
            <div className="space-y-4">
              {monthlyExpenses.map((monthData) => {
                const isExpanded = expandedMonths.has(monthData.month);

                return (
                  <div key={monthData.month} className="space-y-3">
                    {/* Month header */}
                    <button
                      onClick={() => toggleMonth(monthData.month)}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-accent/50 to-accent/30 rounded-xl hover:from-accent/70 hover:to-accent/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold capitalize">
                          {monthData.monthLabel}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {monthData.expenses.length}{" "}
                          {monthData.expenses.length === 1
                            ? "despesa"
                            : "despesas"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(monthData.total)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Month expenses */}
                    {isExpanded && (
                      <div className="space-y-3 pl-2">
                        {monthData.expenses.map((expense) => (
                          <ExpenseCard key={expense.id} expense={expense} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Info box */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Como funciona?
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • Registrar despesa:{" "}
              <span className="font-semibold text-foreground">+10 pts</span>
            </li>
            <li>
              • Confirmar pagamento:{" "}
              <span className="font-semibold text-foreground">+5 pts</span>
            </li>
            <li>• Mantenha suas contas em dia e ganhe pontos!</li>
          </ul>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => setShowAddSheet(true)}
        ariaLabel="Adicionar despesa"
        variant="blue"
        size="sm"
      />

      {/* Add expense sheet */}
      <AddExpenseSheet
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        householdId={profile?.household_id || ""}
        userId={user?.id || ""}
      />

      {/* Budget management sheet */}
      <BudgetManagementSheet
        open={showBudgetSheet}
        onOpenChange={setShowBudgetSheet}
        householdId={profile?.household_id || ""}
        userId={user?.id || ""}
      />
    </>
  );
}
