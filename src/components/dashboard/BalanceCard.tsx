import { Wallet, TrendingDown, AlertCircle } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { useNavigate } from "react-router-dom";

interface BalanceCardProps {
  balance: number;
  monthBudget?: number;
  totalSpent?: number;
}

export function BalanceCard({ balance, monthBudget, totalSpent = 0 }: BalanceCardProps) {
  const navigate = useNavigate();
  const isNegative = balance < 0;
  const remaining = monthBudget ? monthBudget - totalSpent : null;
  const isOverBudget = remaining !== null && remaining < 0;

  return (
    <BentoCard
      className="h-full"
      onClick={() => navigate("/expenses")}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-muted">
            <Wallet className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-sm">Saldo</h3>
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className={`text-2xl font-bold ${isNegative ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                R$ {typeof balance === 'number' && !isNaN(balance) ? Math.abs(balance).toFixed(2) : '0,00'}
              </span>
            </div>
            {isNegative && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Saldo negativo
              </p>
            )}
          </div>

          {remaining !== null && (
            <div className="pt-2 mt-2 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3" />
                <span className={isOverBudget ? "text-destructive font-medium" : ""}>
                  {isOverBudget ? "Acima" : "Faltam"} R$ {Math.abs(remaining).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isOverBudget ? "do orçamento" : "p/ bater orçamento"}
              </p>
            </div>
          )}
        </div>
      </div>
    </BentoCard>
  );
}

