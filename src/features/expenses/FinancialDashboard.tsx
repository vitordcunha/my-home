import { Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { AnnualOverview } from "./AnnualOverview";

import { useFinancialBalance, useFinancialTimeline, TimelineItem } from "./useFinancialBalance";

import { useExpensesQuery } from "./useExpensesQuery";
import { useIncomesQuery } from "./useIncomesQuery";
import { Expense } from "./types";
import { Income } from "./useIncomesQuery";
import { FinancialOverviewGrid } from "./FinancialOverviewGrid";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    TrendingUp,
    TrendingDown,
    FileText,
    Target,
    Download,
    Filter,
    Upload,
    Repeat,
    CreditCard,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sheets
import { AddExpenseSheet } from "./AddExpenseSheet";
import { IncomeFormSheet } from "./IncomeFormSheet";
import { ImportStatementSheet } from "./ImportStatementSheet";
import { BudgetManagementSheet } from "./BudgetManagementSheet";
import { FinancialSettingsSheet } from "./FinancialSettingsSheet";
import { ReceiptPreviewSheet } from "@/features/shopping/ReceiptPreviewSheet";
import { useAddExpense } from "./useAddExpense";

import { PullToRefreshWrapper } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";

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

    const [activeTab, setActiveTab] = useState("overview");

    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // Sheets State
    const [showExpenseSheet, setShowExpenseSheet] = useState(false);
    const [showIncomeSheet, setShowIncomeSheet] = useState(false);
    const [showImportSheet, setShowImportSheet] = useState(false);
    const [showReceiptSheet, setShowReceiptSheet] = useState(false);

    const [showBudgetSheet, setShowBudgetSheet] = useState(false);
    const [showSettingsSheet, setShowSettingsSheet] = useState(false);

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

    // --- Quick Attributes for Actions ---
    const quickActions = [
        {
            label: "Despesa",
            icon: TrendingDown,
            color: "text-red-500",
            bg: "bg-red-500/10",
            onClick: () => { setExpenseToEdit(null); setShowExpenseSheet(true); }
        },
        {
            label: "Receita",
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            onClick: () => { setIncomeToEdit(null); setShowIncomeSheet(true); }
        },
        {
            label: "Escanear",
            icon: Upload,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            onClick: () => setShowReceiptSheet(true)
        },
        {
            label: "Importar",
            icon: Download,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            onClick: () => setShowImportSheet(true)
        },
        {
            label: "Metas",
            icon: Target,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            onClick: () => setShowBudgetSheet(true)
        },
    ];

    return (
        <PullToRefreshWrapper onRefresh={handleRefresh}>
            <div className="space-y-6 pb-24">
                {/* --- Header & View Toggle --- */}
                <div className="flex flex-col gap-4">
                    <PageHeader
                        title="Financeiro"
                        description="Gestão inteligente do seu dinheiro"
                        actions={
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted"
                                    onClick={() => setShowSettingsSheet(true)}
                                >
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                </Button>

                                <Link to="/expenses/debts">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </Link>
                                <div className="flex bg-muted/50 rounded-full p-1 backdrop-blur-sm border border-white/5">
                                    <button
                                        onClick={() => setViewMode("me")}
                                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${viewMode === "me"
                                            ? "bg-background shadow-sm text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        Pessoal
                                    </button>
                                    <button
                                        onClick={() => setViewMode("household")}
                                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${viewMode === "household"
                                            ? "bg-background shadow-sm text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        Casa
                                    </button>
                                </div>
                            </div>
                        }
                    />
                </div>

                {/* --- Main Content Tabs --- */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-2xl h-12">
                        <TabsTrigger
                            value="overview"
                            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-soft text-xs font-medium"
                        >
                            Visão Geral
                        </TabsTrigger>
                        <TabsTrigger
                            value="statement"
                            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-soft text-xs font-medium"
                        >
                            Extrato
                        </TabsTrigger>
                        <TabsTrigger
                            value="planning"
                            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-soft text-xs font-medium"
                        >
                            Planejamento
                        </TabsTrigger>
                    </TabsList>

                    {/* === TAB 1: OVERVIEW === */}
                    <TabsContent value="overview" className="space-y-6 mt-4">

                        {/* 1. Quick Actions Bar */}
                        <div className="w-full overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                            <div className="flex gap-3 min-w-max">
                                {quickActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={action.onClick}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-soft border border-transparent ${action.bg} group-hover:scale-105 group-active:scale-95`}>
                                            <action.icon className={`h-5 w-5 ${action.color}`} />
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                            {action.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. New Clean Bento Grid */}
                        <FinancialOverviewGrid
                            householdId={profile?.household_id || undefined}
                            userId={user?.id}
                            month={selectedMonth}
                            year={selectedYear}
                            timeline={timeline}
                        />

                    </TabsContent>

                    {/* === TAB 2: EXTRATO === */}
                    <TabsContent value="statement" className="space-y-4 mt-2">
                        {/* Header Filtros Compacto */}
                        <div className="flex items-center justify-between px-1 mb-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {format(new Date(selectedYear, selectedMonth - 1), "MMMM yyyy", { locale: ptBR })}
                            </span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                                        <Filter className="h-3.5 w-3.5" />
                                        {filterType === 'all' ? 'Todos' : filterType === 'income' ? 'Entradas' : 'Despesas'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setFilterType("all")}>Todos</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterType("income")}>Receitas</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterType("expense")}>Despesas</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Lista Super Clean */}
                        {groupedTimeline.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                                <div className="p-4 rounded-full bg-muted/30">
                                    <FileText className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Nenhum lançamento</p>
                                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                                        Toque no botão + para adicionar sua primeira despesa ou receita.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative space-y-6">
                                {/* Linha conectora vertical sutil */}
                                <div className="absolute left-[14px] top-2 bottom-2 w-[1px] bg-border/40 z-0" />

                                {groupedTimeline.map((group) => (
                                    <div key={group.date} className="relative z-10">
                                        {/* Sticky Date Header */}
                                        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-2 mb-2 flex items-center gap-3 border-b border-border/30">
                                            <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-background ml-[11px]" />
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                {group.dateLabel}
                                            </span>
                                            <div className={`ml-auto text-xs font-medium font-mono ${group.total >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {group.total > 0 ? "+" : ""}{formatCurrency(group.total)}
                                            </div>
                                        </div>

                                        {/* Transactions List */}
                                        <div className="pl-8 pr-1 space-y-1">
                                            {group.items.map((item) => {
                                                const isRecurring = item.type === 'expense'
                                                    ? allExpenses?.find(e => e.id === item.item_id)?.is_recurring
                                                    : allIncomes?.find(i => i.id === item.item_id)?.is_recurring;

                                                const isProjected = item.is_projected;

                                                return (
                                                    <div
                                                        key={item.item_id}
                                                        onClick={() => handleEditItem(item)}
                                                        className="group flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-pointer"
                                                    >
                                                        {/* Icon Circle */}
                                                        <div className={`
                                                            w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                                                            ${item.type === 'income'
                                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                                : 'bg-red-500/10 text-red-600'}
                                                            ${isProjected ? 'opacity-60 border border-dashed border-current bg-transparent' : ''}
                                                        `}>
                                                            {item.type === 'income'
                                                                ? <TrendingUp className="w-4 h-4" />
                                                                : <TrendingDown className="w-4 h-4" />
                                                            }
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <span className={`text-sm font-medium truncate ${isProjected ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                                                                    {item.description}
                                                                </span>
                                                                <span className={`text-sm font-semibold whitespace-nowrap ${item.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}>
                                                                    {formatCurrency(Math.abs(item.amount))}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-muted-foreground capitalize">
                                                                    {item.category || "Sem categoria"}
                                                                </span>
                                                                {isRecurring && (
                                                                    <div className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                                                                        <Repeat className="w-2.5 h-2.5" />
                                                                        Recorrente
                                                                    </div>
                                                                )}
                                                                {isProjected && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
                                                                        Projetado
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* === TAB 3: PLANEJAMENTO === */}
                    <TabsContent value="planning" className="space-y-6 mt-4">
                        <AnnualOverview
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                            onMonthChange={setSelectedMonth}
                            onYearChange={setSelectedYear}
                            financialData={{
                                [selectedMonth]: {
                                    status: (balance?.projected_balance ?? 0) < 0 ? 'warning' : 'healthy',
                                    balance: balance?.projected_balance ?? 0
                                }
                            }}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Card className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setShowBudgetSheet(true)}>
                                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                    <div className="p-3 bg-purple-500/10 text-purple-600 rounded-full">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Metas de Gastos</h4>
                                        <p className="text-[10px] text-muted-foreground mt-1">Defina limites por categoria</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:bg-muted/30 transition-colors cursor-pointer opacity-50">
                                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                    <div className="p-3 bg-amber-500/10 text-amber-600 rounded-full">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Objetivos</h4>
                                        <p className="text-[10px] text-muted-foreground mt-1">Economia e Sonhos (Em breve)</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* --- Floating Action Button (FAB) --- */}
                <FloatingActionButton
                    onClick={() => {
                        setExpenseToEdit(null);
                        setShowExpenseSheet(true);
                    }}
                    ariaLabel="Adicionar Despesa"
                    variant="blue"
                    size="sm"
                    mobileOnly={true}
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

                <FinancialSettingsSheet
                    open={showSettingsSheet}
                    onOpenChange={setShowSettingsSheet}
                    householdId={profile?.household_id || ""}
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
