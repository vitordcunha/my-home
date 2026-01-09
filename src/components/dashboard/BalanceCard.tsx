import { Wallet } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { useNavigate } from "react-router-dom";



export function BalanceCard({ availableBalance, dailySpendingPower }: { availableBalance: number; dailySpendingPower: number }) {
  const navigate = useNavigate();
  const isNegative = availableBalance < 0;

  return (
    <BentoCard
      className="h-full"
      onClick={() => navigate("/expenses")}
    >
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
            <Wallet className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Finanças</h3>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">Disponível</span>
            <span className={`text-lg font-bold leading-none ${isNegative ? 'text-destructive' : 'text-foreground'}`}>
              R$ {Math.abs(availableBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-2 border-t border-border/50">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Pode gastar hoje</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-emerald-600">
                R$ {dailySpendingPower.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

