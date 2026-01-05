import { ExpenseWithPaidBy, EXPENSE_CATEGORY_EMOJIS } from "./types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users } from "lucide-react";

interface ExpenseCardProps {
  expense: ExpenseWithPaidBy;
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Data inválida";
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }
      return formatDistanceToNow(date, {
        locale: ptBR,
        addSuffix: true,
      });
    } catch {
      return "Data inválida";
    }
  };

  const emoji = expense.category === "custom" && expense.custom_category
    ? "✏️"
    : EXPENSE_CATEGORY_EMOJIS[expense.category] || "📦";

  const categoryLabel = expense.category === "custom" && expense.custom_category
    ? expense.custom_category
    : expense.description;

  const hasSplit = expense.is_split && expense.split_with_profiles && expense.split_with_profiles.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover-lift">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl">{emoji}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight">
              {categoryLabel}
            </h3>
            <p className="text-sm text-muted-foreground">
              {expense.paid_by_profile?.nome || "Alguém"} pagou •{" "}
              {formatDate(expense.paid_at)}
            </p>
            
            {/* Mostrar informação de divisão */}
            {hasSplit && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>
                  Dividido com {expense.split_with_profiles.map(p => p.nome).join(", ")}
                </span>
              </div>
            )}
            
            {expense.is_split && !hasSplit && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>Dividido igualmente</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatCurrency(expense.amount)}</p>
          {!expense.is_split && (
            <p className="text-xs text-muted-foreground">Individual</p>
          )}
        </div>
      </div>
    </div>
  );
}

