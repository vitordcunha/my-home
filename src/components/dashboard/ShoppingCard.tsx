import { ShoppingCart, Package } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { useNavigate } from "react-router-dom";

interface ShoppingCardProps {
  totalItems: number;
  urgentItems?: number;
}

export function ShoppingCard({ totalItems, urgentItems = 0 }: ShoppingCardProps) {
  const navigate = useNavigate();

  return (
    <BentoCard 
      className="bg-gradient-to-br from-blue-500/10 via-background to-background h-full"
      onClick={() => navigate("/shopping")}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-sm">Lista de Compras</h3>
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalItems}
              </span>
              <span className="text-sm text-muted-foreground">
                {totalItems === 1 ? "item" : "itens"}
              </span>
            </div>
          </div>

          {urgentItems > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <Package className="h-3 w-3" />
              <span className="font-medium">{urgentItems} urgente{urgentItems !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>
    </BentoCard>
  );
}

