import { Flame } from "lucide-react";

interface BurnRateCardProps {
    averageDailySpend: number;
    accumulatedBalance: number;
}

export function BurnRateCard({ averageDailySpend, accumulatedBalance }: BurnRateCardProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Calcular quantos dias o saldo atual sustenta com o gasto médio
    const daysRemaining = averageDailySpend > 0
        ? Math.floor(accumulatedBalance / averageDailySpend)
        : Infinity;

    const isLowRunway = daysRemaining < 7 && daysRemaining > 0;
    const isCritical = daysRemaining < 3 && daysRemaining > 0;
    const isNegative = accumulatedBalance < 0;

    return (
        <div className="flex flex-col h-full justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Autonomia
            </span>

            <div className="mt-2 space-y-3">
                {/* Média Diária */}
                <div>
                    <span className="text-lg font-bold block leading-none text-foreground">
                        {formatCurrency(averageDailySpend)}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        Gasto médio por dia
                    </span>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Burn Rate */}
                <div>
                    {isNegative ? (
                        <>
                            <span className="text-sm font-bold block leading-none text-red-600">
                                Saldo negativo
                            </span>
                            <span className="text-[9px] text-muted-foreground mt-1 block">
                                Repor saldo urgente
                            </span>
                        </>
                    ) : daysRemaining === Infinity ? (
                        <>
                            <span className="text-sm font-bold block leading-none text-emerald-600">
                                ∞ dias
                            </span>
                            <span className="text-[9px] text-muted-foreground mt-1 block">
                                Sem gastos registrados
                            </span>
                        </>
                    ) : (
                        <>
                            <span
                                className={`text-sm font-bold block leading-none ${isCritical
                                        ? "text-red-600"
                                        : isLowRunway
                                            ? "text-amber-600"
                                            : "text-emerald-600"
                                    }`}
                            >
                                {daysRemaining} {daysRemaining === 1 ? "dia" : "dias"}
                            </span>
                            <span className="text-[9px] text-muted-foreground mt-1 block">
                                Com base no gasto atual
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
