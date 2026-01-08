import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_EMOJIS, ExpenseCategory } from "./types";

interface SpendingData {
    category: string;
    value: number;
    emoji: string;
    percentage: number;
    [key: string]: any;
}

interface SpendingDonutChartProps {
    expenses: Array<{ category: string; amount: number }>;
}

// Category colors - usando variáveis do tema
const CATEGORY_COLORS: Record<string, string> = {
    casa: "hsl(var(--primary))", // blue
    contas: "hsl(271 91% 65%)", // purple
    mercado: "hsl(var(--success))", // emerald/green
    delivery: "hsl(var(--warning))", // amber
    limpeza: "hsl(199 89% 48%)", // cyan
    manutencao: "hsl(var(--destructive))", // red
    custom: "hsl(221 83% 53%)", // indigo
    outros: "hsl(var(--muted-foreground))", // gray
};

export function SpendingDonutChart({ expenses }: SpendingDonutChartProps) {
    const chartData = useMemo(() => {
        if (!expenses || expenses.length === 0) return [];

        // Agrupar por categoria
        const categoryMap = new Map<string, number>();
        let total = 0;

        expenses.forEach((exp) => {
            const cat = exp.category || "outros";
            const current = categoryMap.get(cat) || 0;
            categoryMap.set(cat, current + Math.abs(exp.amount));
            total += Math.abs(exp.amount);
        });

        // Converter para array e calcular percentagens
        const data: SpendingData[] = Array.from(categoryMap.entries())
            .map(([category, value]) => ({
                category: EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] || category,
                value,
                emoji: EXPENSE_CATEGORY_EMOJIS[category as ExpenseCategory] || "📦",
                percentage: (value / total) * 100,
            }))
            .sort((a, b) => b.value - a.value);

        return data;
    }, [expenses]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as SpendingData;
            return (
                <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-xl p-3 text-xs">
                    <p className="font-bold mb-2 text-muted-foreground uppercase tracking-wider">
                        {data.emoji} {data.category}
                    </p>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-semibold text-foreground">
                                {formatCurrency(data.value)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Percentual:</span>
                            <span className="font-medium text-primary">
                                {data.percentage.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sem gastos no período</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="85%"
                        paddingAngle={2}
                        dataKey="value"
                        animationDuration={800}
                        animationBegin={0}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={
                                    CATEGORY_COLORS[
                                    Object.keys(EXPENSE_CATEGORY_LABELS).find(
                                        (k) => EXPENSE_CATEGORY_LABELS[k as ExpenseCategory] === entry.category
                                    ) || "outros"
                                    ] || CATEGORY_COLORS.outros
                                }
                                strokeWidth={0}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
