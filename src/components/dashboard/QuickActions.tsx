import {
    CheckSquare,
    CreditCard,
    ShoppingCart,
    Plus,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionProps {
    icon: React.ElementType;
    label: string;
    sublabel?: string;
    onClick: () => void;
    colorClass: string;
    delay?: number;
}

function QuickActionButton({
    icon: Icon,
    label,
    onClick,
    colorClass,
    delay = 0
}: QuickActionProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md active:scale-95 group relative overflow-hidden animate-in fade-in zoom-in duration-300 fill-mode-backwards",
                "h-28 min-w-[6.5rem] flex-1 md:flex-none md:w-32"
            )}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={cn(
                "p-3 rounded-xl bg-gradient-to-br transition-opacity group-hover:opacity-80",
                colorClass
            )}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-center leading-tight">
                {label}
            </span>

            {/* Sparkle effect on hover */}
            <Sparkles className="absolute top-2 right-2 w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}

interface QuickActionsProps {
    onNewTask: () => void;
    onNewExpense: () => void;
    onNewItem: () => void;
    className?: string;
}

export function QuickActions({
    onNewTask,
    onNewExpense,
    onNewItem,
    className
}: QuickActionsProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <h3 className="text-sm font-medium text-muted-foreground ml-1">Acesso Rápido</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                <QuickActionButton
                    icon={CheckSquare}
                    label="Nova Tarefa"
                    onClick={onNewTask}
                    colorClass="from-blue-500 to-indigo-500 shadow-blue-500/20"
                    delay={0}
                />
                <QuickActionButton
                    icon={CreditCard}
                    label="Nova Despesa"
                    onClick={onNewExpense}
                    colorClass="from-rose-500 to-pink-500 shadow-rose-500/20"
                    delay={100}
                />
                <QuickActionButton
                    icon={ShoppingCart}
                    label="Item Mercado"
                    onClick={onNewItem}
                    colorClass="from-emerald-500 to-green-500 shadow-emerald-500/20"
                    delay={200}
                />
            </div>
        </div>
    );
}
