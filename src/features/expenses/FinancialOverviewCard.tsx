import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialBalance } from "./useFinancialBalance";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FinancialOverviewCardProps {
  householdId?: string;
  month?: number;
  year?: number;
}

export function FinancialOverviewCard({
  householdId,
  month,
  year,
}: FinancialOverviewCardProps) {
  const { data: balance, isLoading } = useFinancialBalance(
    householdId,
    month,
    year
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const currentMonth = month || new Date().getMonth() + 1;
  const currentYear = year || new Date().getFullYear();
  const monthLabel = format(
    new Date(currentYear, currentMonth - 1, 1),
    "MMMM yyyy",
    { locale: ptBR }
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) return null;

  const {
    opening_balance,
    total_income,
    total_expenses,
    net_balance,
    projected_income,
    projected_expenses,
    projected_balance,
  } = balance;

  const isPositive = projected_balance >= 0;
  const isWarning = projected_balance < 0 && projected_balance > -500;
  const isCritical = projected_balance <= -500;

  return (
    <div className="space-y-4">
      {/* Card Principal - Saldo */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {monthLabel}
            </CardTitle>
            <div
              className={cn("px-3 py-1 rounded-full text-xs font-semibold",
                isCritical ? "bg-destructive/10 text-destructive" :
                  isWarning ? "bg-warning/10 text-warning" :
                    "bg-success/10 text-success")
              }
            >
              {isCritical
                ? "Crítico"
                : isWarning
                  ? "Atenção"
                  : "Saudável"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Saldo Projetado */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Saldo Projetado</p>
            <p
              className={cn("text-3xl font-bold", isPositive ? "text-success" : "text-destructive")}
            >
              {formatCurrency(projected_balance)}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {isPositive ? "Saldo positivo" : "Saldo negativo"}
              </span>
            </div>
          </div>

          {/* Grid de Resumo */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Receitas Realizadas
              </p>
              <p className="text-lg font-semibold text-success">
                {formatCurrency(total_income)}
              </p>
              {projected_income > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{formatCurrency(projected_income)} projetadas
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Despesas Pagas
              </p>
              <p className="text-lg font-semibold text-destructive">
                {formatCurrency(total_expenses)}
              </p>
              {projected_expenses > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{formatCurrency(projected_expenses)} projetadas
                </p>
              )}
            </div>
          </div>

          {/* Saldo Inicial */}
          {opening_balance !== 0 && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">
                Saldo Inicial (do mês anterior)
              </p>
              <p
                className={cn("text-lg font-semibold", opening_balance >= 0 ? "text-success" : "text-destructive")}
              >
                {formatCurrency(opening_balance)}
              </p>
            </div>
          )}

          {/* Saldo Realizado */}
          {net_balance !== projected_balance && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">
                Saldo Realizado (até agora)
              </p>
              <p
                className={cn("text-xl font-semibold", net_balance >= 0 ? "text-success" : "text-destructive")}
              >
                {formatCurrency(net_balance)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de Insights */}
      {(isWarning || isCritical) && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingDown className="h-5 w-5 text-warning mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground/90">
                  {isCritical
                    ? "Atenção: Saldo crítico"
                    : "Atenção: Saldo baixo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isCritical
                    ? `Você está projetado para fechar o mês com ${formatCurrency(
                      Math.abs(projected_balance)
                    )} de déficit. Considere revisar seus gastos.`
                    : `Saldo projetado está abaixo do ideal. Fique atento aos gastos futuros.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isPositive && projected_balance > 1000 && (
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-success mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground/90">
                  Excelente planejamento!
                </p>
                <p className="text-xs text-muted-foreground">
                  Você está projetado para fechar o mês com saldo positivo. Ótimo
                  trabalho!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

