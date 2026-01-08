import { useMemo } from "react";
import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { EXPENSE_CATEGORY_EMOJIS, ExpenseCategory } from "./types";

interface LargestExpenseCardProps {
    expenses: Array<{
        id: string;
        description: string;
        amount: number;
        category: string;
        paid_at: string;
    }>;
    onExpenseClick?: (expenseId: string) => void;
}

export function LargestExpenseCard({ expenses, onExpenseClick }: LargestExpenseCardProps) {
    const largestExpense = useMemo(() => {
        if (!expenses || expenses.length === 0) return null;

        return expenses.reduce((max, exp) => {
            return Math.abs(exp.amount) > Math.abs(max.amount) ? exp : max;
        });
    }, [expenses]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
        });
    };

    if (!largestExpense) {
        return (
            <Card className="border-none shadow-soft p-4">
                <div className="flex items-center justify-center h-full text-center">
                    <p className="text-sm text-muted-foreground">Sem despesas no período</p>
                </div>
            </Card>
        );
    }

    const emoji = EXPENSE_CATEGORY_EMOJIS[largestExpense.category as ExpenseCategory] || "📦";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
        >
            <Card
                className={`border-none shadow-soft p-4 relative overflow-hidden group ${onExpenseClick ? "cursor-pointer hover:bg-muted/40 transition-colors" : ""
                    }`}
                onClick={() => onExpenseClick?.(largestExpense.id)}
            >
                {/* Decorative blob */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-red-500/10 rounded-full blur-2xl transition-all group-hover:bg-red-500/20" />

                {/* Vertical accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Receipt className="w-3.5 h-3.5" />
                            Maior Despesa
                        </span>

                        <div className="space-y-1">
                            <h4 className="text-base font-bold text-foreground truncate">
                                {largestExpense.description}
                            </h4>
                            <p className="text-xl font-bold text-red-600">
                                {formatCurrency(Math.abs(largestExpense.amount))}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                                <span className="mr-1">{emoji}</span>
                                {largestExpense.category} • {formatDate(largestExpense.paid_at)}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
