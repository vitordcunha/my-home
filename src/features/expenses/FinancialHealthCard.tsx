import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFinancialHealth } from "@/features/analytics/hooks/useFinancialHealth";
import { TrendingDown, TrendingUp, AlertTriangle, Activity, Settings, ShoppingBag } from "lucide-react";
import { PurchaseSimulatorModal } from "./PurchaseSimulatorModal";
import { WeekendOptimizerSettings } from "./WeekendOptimizerSettings";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

interface FinancialHealthCardProps {
    householdId?: string;
    userId?: string;
}

export function FinancialHealthCard({ householdId, userId }: FinancialHealthCardProps) {
    const [weekendWeight, setWeekendWeight] = useState(1.5);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const health = useFinancialHealth({ householdId, userId, weekendWeight });

    if (!health) return <div className="h-48 w-full animate-pulse bg-muted/20 rounded-2xl" />;

    const {
        safeDailyBudget,
        weekendSafeDailyBudget,
        status,
        projectedEndBalance,
        averageDailySpend,
        accumulatedBalance,
    } = health;

    // Configuração de cores e estilos baseados no status
    const statusVars = {
        HEALTHY: {
            gradient: "from-success/20 to-success/5",
            text: "text-success",
            bg: "bg-success",
            border: "border-success/20",
            icon: Activity
        },
        CAUTION: {
            gradient: "from-warning/20 to-warning/5",
            text: "text-warning",
            bg: "bg-warning",
            border: "border-warning/20",
            icon: AlertTriangle
        },
        DANGER: {
            gradient: "from-destructive/20 to-destructive/5",
            text: "text-destructive",
            bg: "bg-destructive",
            border: "border-destructive/20",
            icon: AlertTriangle
        }
    }[status];

    const StatusIcon = statusVars.icon;

    // Calculate progress for the bar (0 to 100)
    // We visualize how much of the "Total Budget Power" (Safe + Avg) is taken by Safe Budget
    // Or simpler: Safe Budget vs Average Spend relationship
    const progressValue = Math.min(100, Math.max(5, (safeDailyBudget / (Math.max(1, averageDailySpend + safeDailyBudget))) * 100));

    return (
        <>
            <div className={cn(
                "relative overflow-hidden rounded-3xl mb-6 transition-all duration-300",
                "bg-gradient-to-br border backdrop-blur-xl",
                "dark:bg-background/40 bg-white/60",
                statusVars.gradient,
                statusVars.border
            )}>
                <div className="p-6 pb-4">
                    {/* Header Minimalista */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2">
                            <div className={cn("p-2 rounded-xl bg-background/50 backdrop-blur-md shadow-sm", statusVars.text)}>
                                <StatusIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground/80">Saúde Financeira</h3>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                    {status === 'HEALTHY' ? 'Estável' : status === 'CAUTION' ? 'Atenção' : 'Crítico'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-background/50 text-muted-foreground hover:text-foreground"
                                onClick={() => setIsSimulatorOpen(true)}
                            >
                                <ShoppingBag className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-background/50 text-muted-foreground hover:text-foreground"
                                onClick={() => setIsSettingsOpen(true)}
                            >
                                <Settings className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Hero Number - Centralizado */}
                    <div className="text-center mb-8">
                        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-widest">
                            {accumulatedBalance < 0 ? "Excedente (Acima da Meta)" : "Disponível Hoje (Acumulado)"}
                        </p>
                        <div className="flex items-center justify-center gap-1">
                            <span className={cn(
                                "text-4xl md:text-5xl font-bold tracking-tighter",
                                accumulatedBalance < 0 ? "text-destructive" : "text-foreground"
                            )}>
                                {formatCurrency(accumulatedBalance)}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 items-center mt-2">
                            <p className="text-[10px] text-muted-foreground font-medium">
                                Meta Segurança: <span className="text-foreground">{formatCurrency(safeDailyBudget)}/dia</span>
                            </p>
                            {weekendWeight > 1 && (
                                <p className="text-[10px] text-muted-foreground font-medium">
                                    Fim de semana: <span className="text-foreground">{formatCurrency(weekendSafeDailyBudget)}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer Infos & Progress */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        {/* Box 1: Projeção */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Projeção Mês</span>
                            <div className={cn("flex items-center gap-1.5 font-semibold text-sm", projectedEndBalance >= 0 ? "text-success" : "text-destructive")}>
                                {projectedEndBalance >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {formatCurrency(projectedEndBalance)}
                            </div>
                        </div>

                        {/* Box 2: Média de Gastos */}
                        <div className="flex flex-col gap-1 text-right items-end">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Gasto Médio</span>
                            <div className="flex items-center gap-1.5 font-medium text-sm text-foreground/80">
                                {formatCurrency(averageDailySpend)}/dia
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar "Slim" na base */}
                <div className="h-1 w-full bg-background/50">
                    <div
                        className={cn("h-full transition-all duration-1000", statusVars.bg)}
                        style={{ width: `${progressValue}%` }}
                    />
                </div>
            </div>

            <PurchaseSimulatorModal
                open={isSimulatorOpen}
                onOpenChange={setIsSimulatorOpen}
                currentHealth={health}
            />

            <WeekendOptimizerSettings
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                weight={weekendWeight}
                onWeightChange={setWeekendWeight}
            />
        </>
    );
}
