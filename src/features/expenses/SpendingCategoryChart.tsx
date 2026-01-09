import { useMemo, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Expense } from "./types";
import { useHaptic } from "@/hooks/useHaptic";

interface SpendingCategoryChartProps {
    expenses: Expense[];
    month: number;
    year: number;
}

const COLORS = [
    "#10B981", // Emerald 500
    "#3B82F6", // Blue 500
    "#F59E0B", // Amber 500
    "#EC4899", // Pink 500
    "#8B5CF6", // Violet 500
    "#EF4444", // Red 500
    "#6366F1", // Indigo 500
    "#14B8A6", // Teal 500
];

export function SpendingCategoryChart({ expenses, month, year }: SpendingCategoryChartProps) {
    const { trigger } = useHaptic();
    const lastHapticTime = useRef(0);
    const lastActiveCategory = useRef<string | null>(null);

    const data = useMemo(() => {
        if (!expenses) return [];

        // 1. Filtrar despesas do mês/ano selecionado
        const filtered = expenses.filter(expense => {
            const dateStr = expense.paid_at || expense.created_at || "";
            if (!dateStr) return false;
            const date = new Date(dateStr);
            return date.getMonth() + 1 === month && date.getFullYear() === year;
        });

        // 2. Agrupar por categoria
        const grouped = filtered.reduce((acc, expense) => {
            const category = expense.category || "Outros";
            if (!acc[category]) {
                acc[category] = 0;
            }
            acc[category] += Number(expense.amount);
            return acc;
        }, {} as Record<string, number>);

        // 3. Transformar em array para o gráfico
        const chartData = Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Ordenar do maior para o menor

        // 4. Se tiver muitas categorias, agrupar as menores em "Outros" (Top 5 + Outros)
        if (chartData.length > 6) {
            const top5 = chartData.slice(0, 5);
            const others = chartData.slice(5).reduce((sum, item) => sum + item.value, 0);
            return [...top5, { name: "Outros", value: others }];
        }

        return chartData;
    }, [expenses, month, year]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0
        }).format(value);

    // Tooltip customizado com haptic feedback
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const category = payload[0].name;

            // Dispara haptic quando muda de categoria
            const now = Date.now();
            const timeSinceLastHaptic = now - lastHapticTime.current;

            if (category !== lastActiveCategory.current && timeSinceLastHaptic > 150) {
                trigger("light");
                lastHapticTime.current = now;
                lastActiveCategory.current = category;
            }

            return (
                <div style={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    fontSize: '12px',
                    padding: '8px 12px'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{category}</div>
                    <div style={{ color: 'hsl(var(--primary))' }}>{formatCurrency(payload[0].value)}</div>
                </div>
            );
        }

        // Reseta quando tooltip fecha
        if (!active) {
            lastActiveCategory.current = null;
        }

        return null;
    };

    // Se não tiver dados, não mostrar nada (ou mostrar vazio)
    if (data.length === 0) {
        return (
            <div className="h-full flex flex-col justify-center items-center text-muted-foreground p-6 border-dashed opacity-50">
                <span className="text-xs">Sem gastos neste mês</span>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart onMouseLeave={() => { }}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Central Text (Total) - Smaller for Bento */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Total</span>
                <span className="text-xs font-bold text-foreground">
                    {formatCurrency(data.reduce((acc, cur) => acc + cur.value, 0))}
                </span>
            </div>
        </div>
    );
}
