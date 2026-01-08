import { useMemo } from "react";
import { motion } from "framer-motion";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_EMOJIS, ExpenseCategory } from "./types";

interface TopCategoriesCardProps {
    expenses: Array<{ category: string; amount: number }>;
}

// Category colors - usando variáveis do tema (mesmas do donut)
const CATEGORY_COLORS: Record<string, string> = {
    casa: "hsl(var(--primary))",
    contas: "hsl(271 91% 65%)",
    mercado: "hsl(var(--success))",
    delivery: "hsl(var(--warning))",
    limpeza: "hsl(199 89% 48%)",
    manutencao: "hsl(var(--destructive))",
    custom: "hsl(221 83% 53%)",
    outros: "hsl(var(--muted-foreground))",
};

export function TopCategoriesCard({ expenses }: TopCategoriesCardProps) {
    const topCategories = useMemo(() => {
        if (!expenses || expenses.length === 0) return [];

        // Agrupar por categoria
        const categoryMap = new Map<string, number>();
        expenses.forEach((exp) => {
            const cat = exp.category || "outros";
            const current = categoryMap.get(cat) || 0;
            categoryMap.set(cat, current + Math.abs(exp.amount));
        });

        // Converter para array e pegar top 3
        const sorted = Array.from(categoryMap.entries())
            .map(([category, value]) => ({
                category,
                categoryLabel: EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] || category,
                emoji: EXPENSE_CATEGORY_EMOJIS[category as ExpenseCategory] || "📦",
                value,
                color: CATEGORY_COLORS[category] || CATEGORY_COLORS.outros,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);

        // Calcular percentagem relativa ao maior
        const maxValue = sorted[0]?.value || 1;
        return sorted.map((item) => ({
            ...item,
            percentage: (item.value / maxValue) * 100,
        }));
    }, [expenses]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (topCategories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <p className="text-sm text-muted-foreground">Sem gastos no período</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Top Categorias
            </span>

            <div className="space-y-3 flex-1">
                {topCategories.map((category, index) => (
                    <motion.div
                        key={category.category}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        className="space-y-1.5"
                    >
                        {/* Header da categoria */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm">{category.emoji}</span>
                                <span className="text-xs font-medium text-foreground">
                                    {category.categoryLabel}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-foreground">
                                {formatCurrency(category.value)}
                            </span>
                        </div>

                        {/* Barra de progresso */}
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${category.percentage}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 + 0.5, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: category.color }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
