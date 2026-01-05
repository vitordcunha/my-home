import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { useMonthlyExpensesQuery } from "./useExpensesQuery";
import { useTotalSpentQuery } from "./useTotalSpentQuery";
import { AddExpenseSheet } from "./AddExpenseSheet";
import { ExpenseCard } from "./ExpenseCard";
import { TotalSpentCard } from "./BalanceSummaryCard";
import { Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export function ExpensesScreen() {
  const { user } = useAuth();
  const { data: profile } = useProfileQuery(user?.id);
  const { data: monthlyExpenses, expenses, isLoading } = useMonthlyExpensesQuery(
    profile?.household_id || undefined
  );
  const { data: totalSpent } = useTotalSpentQuery(profile?.household_id || undefined);

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Expandir o primeiro mês automaticamente quando os dados carregarem
  useEffect(() => {
    if (monthlyExpenses && monthlyExpenses.length > 0 && expandedMonths.size === 0) {
      setExpandedMonths(new Set([monthlyExpenses[0].month]));
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
      <div className="space-y-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4 animate-in">
            <div className="relative h-12 w-12 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 animate-pulse"></div>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Carregando despesas...
            </p>
          </div>
        </div>
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

        {/* Empty state */}
        {!hasExpenses && (
          <div className="text-center py-16 space-y-6 animate-in">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
              <span className="text-6xl">💰</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Nenhuma despesa ainda</h3>
              <p className="text-muted-foreground">
                Registre despesas para manter transparência financeira.
              </p>
            </div>
          </div>
        )}

        {/* Monthly grouped expenses */}
        {hasExpenses && monthlyExpenses && (
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
                        {monthData.expenses.length} {monthData.expenses.length === 1 ? "despesa" : "despesas"}
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
        )}

        {/* Info box */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 space-y-2">
          <h4 className="font-semibold text-sm">💡 Como funciona?</h4>
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
      <button
        onClick={() => setShowAddSheet(true)}
        className="group fixed bottom-24 right-6 z-30 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-soft-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
        aria-label="Adicionar despesa"
      >
        <Plus className="h-6 w-6 transition-transform group-hover:rotate-90 duration-200" />
      </button>

      {/* Add expense sheet */}
      <AddExpenseSheet
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        householdId={profile?.household_id || ""}
        userId={user?.id || ""}
      />
    </>
  );
}


