import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { AnnualOverview } from "./AnnualOverview";

import { CashFlowChart } from "./CashFlowChart";
import { CashFlowSankey } from "./CashFlowSankey";
import { useFinancialBalance, useFinancialTimeline, TimelineItem } from "./useFinancialBalance";
import { motion, AnimatePresence } from "framer-motion";
import { useExpensesQuery } from "./useExpensesQuery";
import { useIncomesQuery } from "./useIncomesQuery";
import { Expense } from "./types";
import { Income } from "./useIncomesQuery";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {

    ChevronDown,
    ChevronUp,
    TrendingUp,
    TrendingDown,
    FileText,
    Target,
    Download,
    Filter,
    Upload,
    Repeat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

// Sheets
import { AddExpenseSheet } from "./AddExpenseSheet";
import { IncomeFormSheet } from "./IncomeFormSheet";
import { ImportStatementSheet } from "./ImportStatementSheet";
import { BudgetManagementSheet } from "./BudgetManagementSheet";
import { ReceiptPreviewSheet } from "@/features/shopping/ReceiptPreviewSheet";
import { useAddExpense } from "./useAddExpense";

import { PullToRefreshWrapper } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { FinancialSummaryCard } from "./FinancialSummaryCard";

type ViewMode = "me" | "household";
const VIEW_MODE_STORAGE_KEY = "financial-dashboard-view-mode";

export function FinancialDashboard() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: profile } = useProfileQuery(user?.id);

    // --- Data Queries for Editing ---
    const { data: allExpenses } = useExpensesQuery(profile?.household_id || undefined);

    const { data: allIncomes } = useIncomesQuery(profile?.household_id || undefined);

    // --- State ---
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
        return (stored === "me" || stored === "household") ? stored : "me";
    });

    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [isChartOpen, setIsChartOpen] = useState(true);

    // Sheets State
    const [showExpenseSheet, setShowExpenseSheet] = useState(false);
    const [showIncomeSheet, setShowIncomeSheet] = useState(false);
    const [showImportSheet, setShowImportSheet] = useState(false);
    const [showReceiptSheet, setShowReceiptSheet] = useState(false);

    const [showBudgetSheet, setShowBudgetSheet] = useState(false);
    const [chartMode, setChartMode] = useState<"bar" | "flow">("flow");

    // Edit State
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [incomeToEdit, setIncomeToEdit] = useState<Income | null>(null);

    // Filter State
    const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

    // --- Effects ---
    useEffect(() => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    }, [viewMode]);

    // --- Queries ---
    const { data: balance } = useFinancialBalance(
        profile?.household_id || undefined,
        selectedMonth,
        selectedYear
    );

    const { data: timeline } = useFinancialTimeline(
        profile?.household_id || undefined,
        selectedMonth,
        selectedYear
    );

    // Calculo de grouping da timeline
    const groupedTimeline = useMemo(() => {
        if (!timeline) return [];

        // Apply filters
        const filteredTimeline = timeline.filter(item => {
            if (filterType === "all") return true;
            return item.type === filterType;
        });

        const grouped = filteredTimeline.reduce((acc, item) => {
            const date = new Date(item.date);
            const dayKey = format(date, "yyyy-MM-dd");

            if (!acc[dayKey]) {
                acc[dayKey] = {
                    date: dayKey,
                    dateLabel: format(date, "dd 'de' MMMM, EEEE", { locale: ptBR }),
                    items: [],
                    total: 0,
                    runningBalance: 0, // Inicializa zerado, calcula depois
                };
            }

            acc[dayKey].items.push(item);
            acc[dayKey].total += item.amount;
            return acc;
        }, {} as Record<string, { date: string; dateLabel: string; items: typeof timeline; total: number; runningBalance: number }>);

        // Ordenar dias e calcular saldo acumulado
        const sortedDays = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

        let currentBalance = balance?.opening_balance || 0;

        return sortedDays.map(day => {
            currentBalance += day.total;
            return {
                ...day,
                runningBalance: currentBalance
            };
        });
    }, [timeline, balance, filterType]);

    // Handle Edit
    const handleEditItem = (item: TimelineItem) => {
        if (item.type === 'expense') {
            const expense = allExpenses?.find(e => e.id === item.item_id);
            if (expense) {
                setExpenseToEdit(expense);
                setShowExpenseSheet(true);
            }
        } else if (item.type === 'income') {
            const income = allIncomes?.find(i => i.id === item.item_id);
            if (income) {
                setIncomeToEdit(income);
                setShowIncomeSheet(true);
            }
        }
    };

    const handleCloseExpenseSheet = (open: boolean) => {
        setShowExpenseSheet(open);
        if (!open) setExpenseToEdit(null);
    };

    const handleCloseIncomeSheet = (open: boolean) => {
        setShowIncomeSheet(open);
        if (!open) setIncomeToEdit(null);
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);

    const handleRefresh = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["expenses"] }),
            queryClient.invalidateQueries({ queryKey: ["incomes"] }),
            queryClient.invalidateQueries({ queryKey: ["financialBalance"] }),
            queryClient.invalidateQueries({ queryKey: ["financialTimeline"] }),
            queryClient.invalidateQueries({ queryKey: ["profile"] })
        ]);
    };

    const { mutate: addExpense } = useAddExpense();
    const handleSaveReceipt = (data: import("@/features/shopping/ReceiptPreviewSheet").ReceiptData) => {
        if (!user?.id || !profile?.household_id) return;
        addExpense({
            household_id: profile.household_id,
            description: data.establishment_name || "Despesa Escaneada",
            amount: data.total_amount,
            category: "mercado",
            paid_by: user.id,
            paid_at: data.purchase_date || new Date().toISOString(),
            is_split: false,
            is_recurring: false,
            created_by: user.id,
        });
        setShowReceiptSheet(false);
    };

    return (
        <PullToRefreshWrapper onRefresh={handleRefresh}>
            <div className="space-y-6 pb-24">
                {/* --- Header & View Toggle --- */}
                <div className="flex flex-col gap-4">
                    <PageHeader
                        title="Financeiro"
                        description="Gestão de receitas e despesas"
                        actions={
                            <div className="flex bg-muted/50 rounded-lg p-0.5 backdrop-blur-sm border border-white/10">
                                <button
                                    onClick={() => setViewMode("me")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "me"
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    Minha Visão
                                </button>
                                <button
                                    onClick={() => setViewMode("household")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "household"
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    Visão Casa
                                </button>
                            </div>
                        }
                    />

                    {/* --- Annual Overview --- */}
                    <AnnualOverview
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                        onMonthChange={setSelectedMonth}
                        onYearChange={setSelectedYear}
                        // TODO: Passar dados reais de status anual
                        financialData={{
                            [selectedMonth]: {
                                status: (balance?.projected_balance ?? 0) < 0 ? 'warning' : 'healthy',
                                balance: balance?.projected_balance ?? 0
                            }
                        }}
                    />
                </div>

                {/* --- Financial Summary (Unified) --- */}
                <FinancialSummaryCard
                    householdId={profile?.household_id || undefined}
                    userId={user?.id}
                    month={selectedMonth}
                    year={selectedYear}
                />

                {/* --- Analysis Section (Chart) --- */}
                <Collapsible open={isChartOpen} onOpenChange={setIsChartOpen} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            Análise Financeira
                            <div className="flex bg-muted/50 p-0.5 rounded-lg">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setChartMode("bar"); }}
                                    className={`px-2 py-0.5 text-[10px] rounded-md transition-all ${chartMode === 'bar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Barras
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setChartMode("flow"); }}
                                    className={`px-2 py-0.5 text-[10px] rounded-md transition-all ${chartMode === 'flow' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Fluxo
                                </button>
                            </div>
                        </h3>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                {isChartOpen ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                        </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent>
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2"
                        >
                            {timeline && timeline.length > 0 ? (
                                chartMode === 'bar' ? (
                                    <CashFlowChart
                                        timeline={timeline}
                                        month={selectedMonth}
                                        year={selectedYear}
                                        openingBalance={balance?.opening_balance || 0}
                                    />
                                ) : (
                                    <CashFlowSankey
                                        timeline={timeline}
                                        month={selectedMonth}
                                        year={selectedYear}
                                    />
                                )
                            ) : (
                                <div className="h-32 flex items-center justify-center bg-muted/20 rounded-lg border border-dashed">
                                    <p className="text-sm text-muted-foreground">Sem dados para o gráfico</p>
                                </div>
                            )}
                        </motion.div>
                    </CollapsibleContent>
                </Collapsible>

                {/* --- Actions Bar --- */}
                {viewMode === "me" && (
                    <div className="grid grid-cols-4 gap-2">
                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-1 h-auto py-3 px-0 border-dashed border-2 hover:border-solid hover:bg-accent/50 hover:text-accent-foreground"
                            onClick={() => {
                                setIncomeToEdit(null);
                                setShowIncomeSheet(true);
                            }}
                        >
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Receita</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-1 h-auto py-3 px-0 border-dashed border-2 hover:border-solid hover:bg-accent/50"
                            onClick={() => setShowImportSheet(true)}
                        >
                            <Download className="h-4 w-4 text-blue-600" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Importar</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-1 h-auto py-3 px-0 border-dashed border-2 hover:border-solid hover:bg-accent/50"
                            onClick={() => setShowReceiptSheet(true)}
                        >
                            <Upload className="h-4 w-4 text-orange-600" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Escanear</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-1 h-auto py-3 px-0 border-dashed border-2 hover:border-solid hover:bg-accent/50"
                            onClick={() => setShowBudgetSheet(true)}
                        >
                            <Target className="h-4 w-4 text-purple-600" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Metas</span>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`flex flex-col items-center gap-1 h-auto py-3 px-0 border-dashed border-2 hover:border-solid hover:bg-accent/50 ${filterType !== 'all' ? 'bg-accent/20 border-primary/50' : ''}`}
                                >
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-[10px] uppercase font-bold tracking-wider">
                                        {filterType === 'all' ? 'Filtros' : filterType === 'income' ? 'Receitas' : 'Despesas'}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filtrar Visualização</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setFilterType("all")}>
                                    {filterType === 'all' && <span className="mr-2">✓</span>}
                                    Ver Tudo
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterType("expense")}>
                                    {filterType === 'expense' && <span className="mr-2">✓</span>}
                                    Apenas Despesas
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterType("income")}>
                                    {filterType === 'income' && <span className="mr-2">✓</span>}
                                    Apenas Receitas
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {/* --- Timeline / Transactions --- */}
                {viewMode === 'me' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-lg font-semibold">Extrato</h3>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                {timeline?.length || 0} movimentações
                            </span>
                        </div>

                        {groupedTimeline.length === 0 ? (
                            <Card className="border-dashed bg-muted/10">
                                <CardContent className="p-8 text-center space-y-2">
                                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
                                    <p className="text-sm font-medium">Nenhuma movimentação neste mês</p>
                                    <Button variant="link" size="sm" onClick={() => setShowExpenseSheet(true)}>
                                        Adicionar primeira despesa
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4 relative">
                                {/* Linha vertical conectora (visual flair) */}
                                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-transparent via-border to-transparent z-0 md:left-6 transition-all opacity-50" />

                                <AnimatePresence mode="popLayout">
                                    {groupedTimeline.map((group, groupIndex) => (
                                        <motion.div
                                            key={group.date}
                                            className="relative z-10"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: groupIndex * 0.1 }}
                                        >
                                            {/* Sticky Header por dia */}
                                            <div className="flex items-center gap-3 mb-2 bg-background/80 backdrop-blur-md py-2 sticky top-0 z-20 rounded-lg">
                                                <div className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background ml-[15px] md:ml-[20px] shadow-sm" />
                                                <div className="flex-1 flex items-center justify-between border-b border-border/50 pb-1 mr-1">
                                                    <span className="text-sm font-semibold capitalize text-foreground/90">
                                                        {group.dateLabel}
                                                    </span>
                                                    <div className="text-right">
                                                        <div className={`text-xs font-mono font-medium ${group.total > 0 ? "text-green-600" : "text-red-500"}`}>
                                                            {group.total > 0 ? "+" : ""}
                                                            {formatCurrency(group.total)}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                                            Saldo: <span className={group.runningBalance >= 0 ? "text-green-600/70" : "text-red-600/70"}>
                                                                {formatCurrency(group.runningBalance)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lista de itens do dia */}
                                            <div className="pl-10 space-y-2 pr-1">
                                                {group.items.map((item, itemIndex) => {
                                                    const isRecurring = item.type === 'expense'
                                                        ? allExpenses?.find(e => e.id === item.item_id)?.is_recurring
                                                        : allIncomes?.find(i => i.id === item.item_id)?.is_recurring;

                                                    return (
                                                        <motion.div
                                                            key={item.item_id}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: itemIndex * 0.05 }}
                                                        >
                                                            <Card
                                                                className="overflow-hidden border-0 shadow-sm glass-card hover:bg-white/60 dark:hover:bg-black/40 transition-all group cursor-pointer"
                                                                onClick={() => handleEditItem(item)}
                                                            >
                                                                <div className="flex items-center p-3 gap-3">
                                                                    <div className={`p-2 rounded-xl flex-shrink-0 ${item.type === 'income'
                                                                        ? 'bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                                        : 'bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                                                        }`}>
                                                                        {item.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between mb-0.5">
                                                                            <p className="font-medium text-sm truncate pr-2">{item.description}</p>
                                                                            <span className={`font-semibold text-sm whitespace-nowrap ${item.type === 'income'
                                                                                ? 'text-green-600 dark:text-green-400'
                                                                                : 'text-red-600 dark:text-red-400'
                                                                                }`}>
                                                                                {item.type === 'income' ? "+" : "-"}
                                                                                {formatCurrency(Math.abs(item.amount))}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                            <span className="flex items-center gap-1.5 flex-wrap">
                                                                                {item.category || "Sem categoria"}

                                                                                {isRecurring && (
                                                                                    <span className="flex items-center gap-0.5 text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-sm">
                                                                                        <Repeat className="w-3 h-3" />
                                                                                        <span className="hidden sm:inline">Recorrente</span>
                                                                                    </span>
                                                                                )}

                                                                                {item.is_projected && (
                                                                                    <span className="px-1.5 py-0.5 rounded-[4px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium text-[10px] uppercase">
                                                                                        Projetado
                                                                                    </span>
                                                                                )}
                                                                            </span>

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                )}

                {/* --- Floating Action Button (FAB) --- */}
                <FloatingActionButton
                    onClick={() => {
                        setExpenseToEdit(null);
                        setShowExpenseSheet(true);
                    }}
                    ariaLabel="Adicionar Despesa"
                    variant="blue"
                    size="sm"
                />

                {/* --- Sheets & Modals --- */}
                <AddExpenseSheet
                    open={showExpenseSheet}
                    onOpenChange={handleCloseExpenseSheet}
                    householdId={profile?.household_id || ""}
                    userId={user?.id || ""}
                    expenseToEdit={expenseToEdit}
                />

                <IncomeFormSheet
                    open={showIncomeSheet}
                    onOpenChange={handleCloseIncomeSheet}
                    householdId={profile?.household_id || ""}
                    userId={user?.id || ""}
                    incomeToEdit={incomeToEdit}
                />

                <ImportStatementSheet
                    open={showImportSheet}
                    onOpenChange={setShowImportSheet}
                    householdId={profile?.household_id || ""}
                    userId={user?.id || ""}
                    month={selectedMonth}
                    year={selectedYear}
                />

                <BudgetManagementSheet
                    open={showBudgetSheet}
                    onOpenChange={setShowBudgetSheet}
                    householdId={profile?.household_id || ""}
                    userId={user?.id || ""}
                />

                <ReceiptPreviewSheet
                    open={showReceiptSheet}
                    onOpenChange={setShowReceiptSheet}
                    householdId={profile?.household_id || undefined}
                    onSave={handleSaveReceipt}
                    shoppingListItems={[]} // No shopping list matching in dashboard mode for now
                />
            </div>
        </PullToRefreshWrapper>
    );

}
