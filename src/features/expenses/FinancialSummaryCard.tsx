import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFinancialHealth } from "@/features/analytics/hooks/useFinancialHealth";
import { useFinancialBalance } from "./useFinancialBalance";
import {
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    Calendar,
    ChevronDown,
    ChevronUp,
    Wallet,
    Target,
    Activity,
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WeekendOptimizerSettings } from "./WeekendOptimizerSettings";
import { motion, AnimatePresence } from "framer-motion";

interface FinancialSummaryCardProps {
    householdId?: string;
    userId?: string;
    month?: number;
    year?: number;
}

export function FinancialSummaryCard({
    householdId,
    userId,
    month,
    year
}: FinancialSummaryCardProps) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [weekendWeight, setWeekendWeight] = useState(1.5);

    const health = useFinancialHealth({ householdId, userId, weekendWeight });
    const { data: balance, isLoading } = useFinancialBalance(
        householdId,
        month || new Date().getMonth() + 1,
        year || new Date().getFullYear()
    );

    if (isLoading || !balance || !health) {
        return (
            <div className="w-full h-48 animate-pulse bg-muted/20 rounded-3xl" />
        );
    }

    const {
        projected_balance: projectedBalance,
        opening_balance
    } = balance;

    const {
        accumulatedBalance,
        safeDailyBudget,
        weekendSafeDailyBudget,
        realizedIncome,
        projectedIncome,
        realizedExpenses,
        projectedExpenses: healthProjectedExpenses
    } = health;

    // --- LOGIC REFINEMENT ---
    const isProjectedNegative = projectedBalance < 0;
    const isTodayNegative = accumulatedBalance < 0;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let statusMessage = "Finanças saudáveis";

    if (isProjectedNegative) {
        status = 'critical';
        statusMessage = "Projeção negativa";
    } else if (isTodayNegative) {
        status = 'warning';
        statusMessage = "Acima da meta hoje";
    }

    // Colors & Icons
    const theme = {
        critical: {
            bg: "bg-destructive",
            bgSoft: "bg-destructive/10",
            text: "text-destructive",
            textLight: "text-destructive-foreground",
            icon: AlertTriangle,
            border: "border-destructive/20"
        },
        warning: {
            bg: "bg-amber-500",
            bgSoft: "bg-amber-500/10",
            text: "text-amber-500",
            textLight: "text-amber-950",
            icon: AlertCircle,
            border: "border-amber-500/20"
        },
        healthy: {
            bg: "bg-emerald-500",
            bgSoft: "bg-emerald-500/10",
            text: "text-emerald-500",
            textLight: "text-emerald-50",
            icon: Activity, // More generic 'good' icon
            border: "border-emerald-500/20"
        }
    }[status];

    const StatusIcon = theme.icon;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

    return (
        <>
            <div className={cn(
                "relative overflow-hidden rounded-[2rem] border backdrop-blur-xl transition-all duration-300",
                "bg-background/60",
                theme.border
            )}>
                {/* --- HEADER COMPACTO --- */}
                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg", theme.bgSoft)}>
                            <Calendar className={cn("w-4 h-4", theme.text)} />
                        </div>
                        <span className="text-sm font-semibold capitalize text-foreground/80">
                            {format(new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) - 1), "MMMM", { locale: ptBR })}
                        </span>
                    </div>

                    <div className={cn("px-2.5 py-1 rounded-full flex items-center gap-1.5", theme.bgSoft)}>
                        <StatusIcon className={cn("w-3 h-3", theme.text)} />
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", theme.text)}>
                            {statusMessage}
                        </span>
                    </div>
                </div>

                {/* --- CORE METRICS (STACKED MOBILE OPTIMIZED) --- */}
                <div className="px-5 py-4 space-y-6">

                    {/* 1. Disponível Hoje (TACTICAL) */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <Wallet className="w-3 h-3" />
                                Disponível Hoje
                            </span>
                            {/* Simulator/Settings Toggle */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-full hover:bg-muted"
                                onClick={() => setIsSettingsOpen(true)}
                            >
                                <Target className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className={cn(
                                "text-4xl font-bold tracking-tighter",
                                accumulatedBalance < 0 ? "text-destructive" : "text-foreground"
                            )}>
                                {formatCurrency(accumulatedBalance)}
                            </span>
                        </div>

                        {/* Subtext Contextual */}
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                                Meta: <span className="font-medium text-foreground">{formatCurrency(safeDailyBudget)}/dia</span>
                            </span>
                            {weekendWeight > 1 && (
                                <span className="opacity-70">
                                    Fim de semana: {formatCurrency(weekendSafeDailyBudget)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Divider visual */}
                    <div className="w-full h-px bg-border/50" />

                    {/* 2. Projeção Mês (STRATEGIC) */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                                Projeção Final
                            </span>
                            <span className={cn(
                                "text-xl font-semibold",
                                projectedBalance < 0 ? "text-destructive" : "text-emerald-500"
                            )}>
                                {formatCurrency(projectedBalance)}
                            </span>
                        </div>

                        {/* Mini graph logic or generic outcome text */}
                        <div className="text-right max-w-[120px]">
                            <p className="text-[10px] leading-tight text-muted-foreground">
                                {projectedBalance >= 0
                                    ? "Você fechará o mês no azul."
                                    : "Risco de fechar o mês no negativo."}
                            </p>
                        </div>
                    </div>

                </div>

                {/* --- DETAILS (ACCORDION) --- */}
                <div className="bg-muted/30 border-t border-border/40">
                    <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full flex items-center justify-center gap-2 py-3 h-auto hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors group"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {isDetailsOpen ? "Ocultar Detalhes" : "Ver Detalhes"}
                                </span>
                                {isDetailsOpen ? (
                                    <ChevronUp className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                                ) : (
                                    <ChevronDown className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                                )}
                            </Button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                            <AnimatePresence>
                                {isDetailsOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-5 pb-5 pt-1 overflow-hidden"
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* ENTRADAS */}
                                            <div className="p-3 rounded-xl bg-background border border-border/50 space-y-2">
                                                <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold uppercase">Entradas</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] text-muted-foreground">Realizado</span>
                                                        <span className="text-xs font-semibold">{formatCurrency(realizedIncome)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] text-muted-foreground">A Receber</span>
                                                        <span className="text-xs text-muted-foreground">{formatCurrency(projectedIncome)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SAÍDAS */}
                                            <div className="p-3 rounded-xl bg-background border border-border/50 space-y-2">
                                                <div className="flex items-center gap-1.5 text-red-500 mb-1">
                                                    <TrendingDown className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold uppercase">Saídas</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] text-muted-foreground">Pago</span>
                                                        <span className="text-xs font-semibold">{formatCurrency(realizedExpenses)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] text-muted-foreground">A Pagar</span>
                                                        <span className="text-xs text-muted-foreground">{formatCurrency(healthProjectedExpenses)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SALDO INICIAL */}
                                        {opening_balance !== 0 && (
                                            <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border/50">
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase">Saldo Anterior</span>
                                                <span className={cn("text-xs font-semibold", opening_balance >= 0 ? "text-emerald-500" : "text-red-500")}>
                                                    {formatCurrency(opening_balance)}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </div>

            <WeekendOptimizerSettings
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                weight={weekendWeight}
                onWeightChange={setWeekendWeight}
            />
        </>
    );
}
