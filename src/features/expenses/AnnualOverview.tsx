import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnualOverviewProps {
    selectedMonth: number;
    selectedYear: number;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
    financialData?: Record<number, { status: 'healthy' | 'warning' | 'critical' | 'neutral', balance: number }>;
}

export function AnnualOverview({
    selectedMonth,
    selectedYear,
    onMonthChange,
    onYearChange,
    financialData = {}
}: AnnualOverviewProps) {
    const months = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => i + 1);
    }, []);

    return (
        <div className="flex flex-col space-y-2 bg-card border rounded-xl p-3 shadow-sm">
            {/* Seletor de Ano */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => onYearChange(selectedYear - 1)}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <span className="text-sm font-semibold">{selectedYear}</span>
                <button
                    onClick={() => onYearChange(selectedYear + 1)}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                >
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            {/* Grid de Meses */}
            <div className="grid grid-cols-6 gap-2">
                {months.map((month) => {
                    const isSelected = month === selectedMonth;
                    const data = financialData[month];
                    const statusColor = data?.status === 'critical' ? 'bg-red-500' :
                        data?.status === 'warning' ? 'bg-amber-500' :
                            data?.status === 'healthy' ? 'bg-green-500' :
                                'bg-muted';

                    return (
                        <button
                            key={month}
                            onClick={() => onMonthChange(month)}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg transition-all text-xs relative overflow-hidden group",
                                isSelected
                                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-1"
                                    : "bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                            )}
                        >
                            <span className="font-medium">
                                {format(new Date(selectedYear, month - 1, 1), "MMM", { locale: ptBR }).replace('.', '')}
                            </span>

                            {/* Indicador de Status (ponto) */}
                            {!isSelected && data && (
                                <div className={cn(
                                    "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                                    statusColor
                                )} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
