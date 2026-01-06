import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { FinancialOverviewCard } from "./FinancialOverviewCard";
import { IncomeFormSheet } from "./IncomeFormSheet";
import { AddExpenseSheet } from "./AddExpenseSheet";
import { ImportStatementSheet } from "./ImportStatementSheet";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  DollarSign,
  Sparkles,
  User,
  Home,
} from "lucide-react";
import {
  useFinancialTimeline,
  useFinancialBalance,
} from "./useFinancialBalance";
import { useIncomesQuery, Income } from "./useIncomesQuery";
import { useExpensesQuery } from "./useExpensesQuery";
import { Expense } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit2 } from "lucide-react";
import { CashFlowChart } from "./CashFlowChart";

type ViewMode = "me" | "household";

const VIEW_MODE_STORAGE_KEY = "financial-planning-view-mode";

export function FinancialPlanningScreen() {
  const { user } = useAuth();
  const { data: profile } = useProfileQuery(user?.id);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return (stored === "me" || stored === "household") ? stored : "me";
  });

  // Persist viewMode to localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const [showIncomeSheet, setShowIncomeSheet] = useState(false);
  const [showExpenseSheet, setShowExpenseSheet] = useState(false);
  const [showImportSheet, setShowImportSheet] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [incomeToEdit, setIncomeToEdit] = useState<Income | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const { data: timeline, isLoading } = useFinancialTimeline(
    profile?.household_id || undefined,
    selectedMonth,
    selectedYear
  );

  const { data: balance } = useFinancialBalance(
    profile?.household_id || undefined,
    selectedMonth,
    selectedYear
  );

  const { data: allIncomes } = useIncomesQuery(
    profile?.household_id || undefined
  );
  const { data: allExpenses } = useExpensesQuery(
    profile?.household_id || undefined
  );

  const handleEditItem = (itemId: string, type: "income" | "expense") => {
    if (type === "income") {
      const income = allIncomes?.find((i) => i.id === itemId);
      if (income) {
        setIncomeToEdit(income);
        setShowIncomeSheet(true);
      }
    } else {
      const expense = allExpenses?.find((e) => e.id === itemId);
      if (expense) {
        setExpenseToEdit(expense);
        setShowExpenseSheet(true);
      }
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  // Agrupar timeline por dia
  const timelineByDay = useMemo(() => {
    if (!timeline) return [];

    const grouped = timeline.reduce((acc, item) => {
      const date = new Date(item.date);
      const dayKey = format(date, "yyyy-MM-dd");

      if (!acc[dayKey]) {
        acc[dayKey] = {
          date: dayKey,
          dateLabel: format(date, "dd 'de' MMMM", { locale: ptBR }),
          items: [],
          total: 0,
        };
      }

      acc[dayKey].items.push(item);
      acc[dayKey].total += item.amount;

      return acc;
    }, {} as Record<string, { date: string; dateLabel: string; items: typeof timeline; total: number }>);

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [timeline]);

  // Calcular saldo acumulado ao longo do mês
  // Começa com o saldo inicial (opening balance) do mês anterior
  const runningBalance = useMemo(() => {
    if (!timelineByDay.length) return [];

    let currentBalance = balance?.opening_balance || 0;
    return timelineByDay.map((day) => {
      currentBalance += day.total;
      return {
        ...day,
        runningBalance: currentBalance,
      };
    });
  }, [timelineByDay, balance]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Planejamento Financeiro
          </h2>
          <p className="text-base text-muted-foreground">
            Visão completa de receitas, despesas e saldo projetado
          </p>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setViewMode("me")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "me"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <User className="h-4 w-4" />
              Eu
            </button>
            <button
              onClick={() => setViewMode("household")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "household"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Home className="h-4 w-4" />
              Casa
            </button>
          </div>
        </div>

        {/* Seletor de Ano e Mês */}
        <div className="space-y-3">
          {/* Seletor de Ano */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="px-3 py-1 rounded-lg border border-border hover:bg-accent text-sm"
            >
              ← {selectedYear - 1}
            </button>
            <span className="px-4 py-1 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="px-3 py-1 rounded-lg border border-border hover:bg-accent text-sm"
            >
              {selectedYear + 1} →
            </button>
          </div>

          {/* Seletor de Mês */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from({ length: 12 }, (_, i) => {
              const month = i + 1;
              const isSelected = month === selectedMonth;

              return (
                <button
                  key={`${selectedYear}-${month}`}
                  onClick={() => {
                    setSelectedMonth(month);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  {format(new Date(selectedYear, month - 1, 1), "MMM", {
                    locale: ptBR,
                  })}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card de Visão Geral */}
        <FinancialOverviewCard
          householdId={profile?.household_id || undefined}
          month={selectedMonth}
          year={selectedYear}
        />

        {/* Gráfico de Fluxo de Caixa */}
        {timeline && timeline.length > 0 && (
          <CashFlowChart
            timeline={timeline}
            month={selectedMonth}
            year={selectedYear}
            openingBalance={balance?.opening_balance || 0}
          />
        )}

        {/* Timeline - Only visible in 'me' mode */}
        {viewMode === "me" && (
          isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando timeline...
            </div>
          ) : runningBalance.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">
                  Nenhuma movimentação neste mês
                </p>
                <p className="text-sm text-muted-foreground">
                  Comece registrando receitas e despesas para ver a timeline
                  financeira.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Timeline do Mês</h3>
              <div className="space-y-4">
                {runningBalance.map((day) => (
                  <Card key={day.date}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{day.dateLabel}</p>
                          <p className="text-sm text-muted-foreground">
                            {day.items.length}{" "}
                            {day.items.length === 1
                              ? "movimentação"
                              : "movimentações"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${day.total >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                              }`}
                          >
                            {day.total >= 0 ? "+" : ""}
                            {formatCurrency(day.total)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Saldo: {formatCurrency(day.runningBalance)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-3 border-t">
                        {day.items.map((item) => (
                          <div
                            key={item.item_id}
                            className="flex items-center justify-between text-sm group"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {item.type === "income" ? (
                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                              )}
                              <span className="truncate">{item.description}</span>
                              {item.is_projected && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
                                  Projetado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleEditItem(item.item_id, item.type)
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                                title="Editar"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <p
                                className={`font-semibold ${item.type === "income"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                                  }`}
                              >
                                {item.type === "income" ? "+" : "-"}
                                {formatCurrency(Math.abs(item.amount))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        )}

        {/* Botão de Importação com IA - Only visible in 'me' mode */}
        {viewMode === "me" && (
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
            <CardContent className="p-4">
              <Button
                onClick={() => setShowImportSheet(true)}
                className="w-full h-auto py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-bold">Importar Extrato com IA</div>
                  <div className="text-xs opacity-90">
                    Cole o extrato e deixe a IA categorizar
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação Rápida */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => setShowIncomeSheet(true)}
            className="h-auto py-4 flex flex-col items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>Adicionar Receita</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowExpenseSheet(true)}
            className="h-auto py-4 flex flex-col items-center gap-2"
          >
            <DollarSign className="h-5 w-5" />
            <span>Adicionar Despesa</span>
          </Button>
        </div>
      </div>

      {/* Floating Action Button - Adicionar Receita */}
      <FloatingActionButton
        onClick={() => setShowIncomeSheet(true)}
        ariaLabel="Adicionar receita"
        variant="green"
        size="sm"
      />

      {/* Income Form Sheet */}
      <IncomeFormSheet
        open={showIncomeSheet}
        onOpenChange={(open) => {
          setShowIncomeSheet(open);
          if (!open) setIncomeToEdit(null);
        }}
        householdId={profile?.household_id || ""}
        userId={user?.id || ""}
        incomeToEdit={incomeToEdit}
      />

      {/* Expense Form Sheet */}
      <AddExpenseSheet
        open={showExpenseSheet}
        onOpenChange={(open) => {
          setShowExpenseSheet(open);
          if (!open) setExpenseToEdit(null);
        }}
        householdId={profile?.household_id || ""}
        userId={user?.id || ""}
        expenseToEdit={expenseToEdit}
      />

      {/* Import Statement Sheet */}
      <ImportStatementSheet
        open={showImportSheet}
        onOpenChange={setShowImportSheet}
        householdId={profile?.household_id || ""}
        userId={user?.id || ""}
        month={selectedMonth}
        year={selectedYear}
      />
    </>
  );
}
