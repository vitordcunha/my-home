import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialBalance } from "./useFinancialBalance";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isCritical
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : isWarning
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-green-500/10 text-green-600 dark:text-green-400"
              }`}
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
              className={`text-3xl font-bold ${
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
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
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
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
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
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
                className={`text-lg font-semibold ${
                  opening_balance >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
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
                className={`text-xl font-semibold ${
                  net_balance >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(net_balance)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de Insights */}
      {(isWarning || isCritical) && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  {isCritical
                    ? "Atenção: Saldo crítico"
                    : "Atenção: Saldo baixo"}
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200">
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
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Excelente planejamento!
                </p>
                <p className="text-xs text-green-800 dark:text-green-200">
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

