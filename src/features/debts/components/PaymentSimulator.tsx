import { useState } from "react";
import { usePaymentStrategy } from "../hooks/usePaymentStrategy";
import { useFinancialHealth } from "@/features/analytics/hooks/useFinancialHealth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, CheckCircle2, AlertTriangle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentSimulatorProps {
    expense: {
        amount: number;
        description: string;
        paid_at?: string;
    };
    debtId: string;
    householdId: string;
}

export function PaymentSimulator({ expense, debtId, householdId }: PaymentSimulatorProps) {
    const financialHealth = useFinancialHealth({ householdId, weekendWeight: 1.5 });
    const { analyze, loading, result, error } = usePaymentStrategy();
    const [manualMinimum, setManualMinimum] = useState<number | undefined>(undefined);

    if (!financialHealth) return null; // Wait for health data

    const handleSimulate = () => {
        analyze({
            expense: {
                amount: Number(expense.amount),
                description: expense.description,
            },
            debtId,
            financialHealth,
            manualMinimum
        });
    };

    const getScenarioIcon = (type: string) => {
        switch (type) {
            case "FULL": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "MIN": return <TrendingDown className="h-5 w-5 text-red-500" />;
            case "SMART": return <BrainCircuit className="h-5 w-5 text-purple-500" />;
            default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="space-y-4 my-4 border-t pt-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-purple-500" />
                    IA Advisor
                </h3>
                <div className="flex items-center gap-2">
                    <Button onClick={handleSimulate} disabled={loading} size="sm" variant="outline" className="gap-2">
                        {loading ? "Simulando..." : "Simular Pagamento"}
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/20 rounded-lg">
                <span className="whitespace-nowrap">Mínimo da Fatura (Se souber): R$</span>
                <input
                    type="number"
                    className="w-24 bg-transparent border-b border-muted-foreground/50 focus:border-primary focus:outline-none text-foreground font-medium"
                    placeholder="Auto"
                    onChange={(e) => setManualMinimum(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {result && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
                        <p className="text-sm text-foreground/80 italic">
                            "{result.recommendation}"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {result.scenarios.map((scenario, idx) => {
                            const isBest = result.best_option === (idx === 0 ? "FULL" : idx === 1 ? "MIN" : "SMART");
                            // Mapping index to type strictly for style (this relies on the order from backend: Full, Min, Smart)
                            const type = idx === 0 ? "FULL" : idx === 1 ? "MIN" : "SMART";

                            return (
                                <Card key={idx} className={cn(
                                    "transition-all duration-300 border-2",
                                    isBest ? "border-purple-500 shadow-md bg-purple-500/5" : "border-border opacity-80 hover:opacity-100"
                                )}>
                                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            {getScenarioIcon(type)}
                                            {scenario.name}
                                        </CardTitle>
                                        {isBest && <Badge variant="default" className="bg-purple-500">Recomendado</Badge>}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Pagar Agora:</span>
                                                <span className="font-bold">{formatCurrency(scenario.pay_amount)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Juros Futuros:</span>
                                                <span className={scenario.interest_cost > 0 ? "text-red-500" : "text-green-500"}>
                                                    {formatCurrency(scenario.interest_cost)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm pt-2 border-t mt-2">
                                                <span className="text-muted-foreground">Saldo Projetado:</span>
                                                <span className={scenario.projected_free_balance < 0 ? "text-red-500 font-bold" : "text-foreground"}>
                                                    {formatCurrency(scenario.projected_free_balance)}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
