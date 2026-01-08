import {
    CheckSquare,
    CreditCard,
    ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionProps {
    icon: React.ElementType;
    label: string;
    sublabel?: string;
    onClick: () => void;
    delay?: number;
}

function QuickActionButton({
    icon: Icon,
    label,
    onClick,
    delay = 0
}: QuickActionProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border bg-card transition-all hover:bg-muted active:scale-95 group",
                "h-24 min-w-[6rem] flex-1 md:flex-none md:w-28"
            )}
            style={{ animationDelay: `${delay}ms` }}
        >
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-xs font-medium text-center leading-tight">
                {label}
            </span>
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
        <div className={cn("space-y-3", className)}>
            <h3 className="text-sm font-medium text-muted-foreground">Acesso Rápido</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                <QuickActionButton
                    icon={CheckSquare}
                    label="Nova Tarefa"
                    onClick={onNewTask}
                    delay={0}
                />
                <QuickActionButton
                    icon={CreditCard}
                    label="Nova Despesa"
                    onClick={onNewExpense}
                    delay={50}
                />
                <QuickActionButton
                    icon={ShoppingCart}
                    label="Item Mercado"
                    onClick={onNewItem}
                    delay={100}
                />
            </div>
        </div>
    );
}
