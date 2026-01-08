import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { usePurchaseSimulator } from "@/features/analytics/hooks/usePurchaseSimulator";
import { FinancialHealth } from "@/features/analytics/hooks/useFinancialHealth";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Flame } from "lucide-react";

interface PurchaseSimulatorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentHealth: FinancialHealth | null;
}

export function PurchaseSimulatorModal({ open, onOpenChange, currentHealth }: PurchaseSimulatorModalProps) {
    const [amountStr, setAmountStr] = useState("");
    const { simulatePurchase } = usePurchaseSimulator(currentHealth);

    const result = useMemo(() => {
        const amount = parseFloat(amountStr.replace(",", "."));
        if (isNaN(amount) || amount <= 0) return null;
        return simulatePurchase(amount);
    }, [amountStr, simulatePurchase]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[80vh] sm:h-auto">
                <SheetHeader>
                    <SheetTitle>Simulador de Impacto</SheetTitle>
                    <SheetDescription>
                        Veja como uma compra afeta seu orçamento diário até o fim do mês.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Valor da Compra (R$)
                        </label>
                        <Input
                            type="number"
                            placeholder="0,00"
                            value={amountStr}
                            onChange={(e) => setAmountStr(e.target.value)}
                            className="text-lg"
                        />
                    </div>

                    {result && currentHealth && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className={cn(
                                "p-4 rounded-lg border",
                                result.impactSeverity === "CRITICAL" ? "bg-destructive/10 border-destructive/20" :
                                    result.impactSeverity === "HIGH" ? "bg-destructive/5 border-destructive/10" :
                                        result.impactSeverity === "MEDIUM" ? "bg-warning/10 border-warning/20" :
                                            "bg-success/10 border-success/20"
                            )}>
                                <div className="flex items-center gap-2 mb-2">
                                    {result.impactSeverity === "CRITICAL" ? <Flame className="w-5 h-5 text-destructive" /> :
                                        result.impactSeverity === "HIGH" ? <AlertTriangle className="w-5 h-5 text-destructive/80" /> :
                                            result.impactSeverity === "MEDIUM" ? <AlertTriangle className="w-5 h-5 text-warning" /> :
                                                <CheckCircle className="w-5 h-5 text-success" />}
                                    <h3 className="font-semibold text-sm">
                                        {result.impactSeverity === "CRITICAL" ? "Critico! Vai quebrar a banca." :
                                            result.impactSeverity === "HIGH" ? "Impacto Alto no dia a dia." :
                                                result.impactSeverity === "MEDIUM" ? "Impacto Moderado." :
                                                    "Compra Segura!"}
                                    </h3>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Meta Diária Atual:</span>
                                        <span className="font-medium">{currentHealth.dailyBudget.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Nova Meta Diária:</span>
                                        <span className={cn("font-bold", result.newSafeDailyBudget < 0 ? "text-destructive" : "")}>
                                            {result.newSafeDailyBudget.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Queda de Conforto:</span>
                                        <span className="text-destructive font-medium">-{result.budgetDropPercentage.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            {result.daysToRecover > 0.5 && (
                                <p className="text-xs text-center text-muted-foreground">
                                    Para compensar, você precisaria passar <strong>{Math.ceil(result.daysToRecover)} dias</strong> sem gastar nada.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
