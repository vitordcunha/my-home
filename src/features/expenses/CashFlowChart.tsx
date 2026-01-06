import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle } from "lucide-react";

interface TimelineItem {
  date: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: string;
  is_projected: boolean;
  item_id: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      day: number;
      balance: number;
      incomes: number;
      expenses: number;
      hasTransaction: boolean;
    };
  }>;
}

interface CashFlowChartProps {
  timeline: TimelineItem[];
  month: number;
  year: number;
  openingBalance?: number;
}

export function CashFlowChart({
  timeline,
  month,
  year,
  openingBalance = 0,
}: CashFlowChartProps) {
  const chartData = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];

    // Obter número de dias no mês
    const daysInMonth = new Date(year, month, 0).getDate();

    // Criar array com todos os dias do mês
    const dailyData: Record<
      number,
      {
        day: number;
        balance: number;
        incomes: number;
        expenses: number;
        hasTransaction: boolean;
      }
    > = {};

    for (let day = 1; day <= daysInMonth; day++) {
      dailyData[day] = {
        day,
        balance: 0,
        incomes: 0,
        expenses: 0,
        hasTransaction: false,
      };
    }

    // Processar timeline e calcular saldo acumulado
    // Começa com o saldo inicial (opening balance) do mês anterior
    let runningBalance = openingBalance;

    timeline.forEach((item) => {
      const date = new Date(item.date);
      const day = date.getDate();

      if (day >= 1 && day <= daysInMonth) {
        if (item.type === "income") {
          dailyData[day].incomes += item.amount;
        } else {
          dailyData[day].expenses += Math.abs(item.amount);
        }
        dailyData[day].hasTransaction = true;
      }
    });

    // Calcular saldo acumulado dia a dia
    for (let day = 1; day <= daysInMonth; day++) {
      runningBalance += dailyData[day].incomes - dailyData[day].expenses;
      dailyData[day].balance = runningBalance;
    }

    return Object.values(dailyData);
  }, [timeline, month, year, openingBalance]);

  const stats = useMemo(() => {
    if (chartData.length === 0)
      return {
        minBalance: 0,
        maxBalance: 0,
        hasNegative: false,
        negativeDay: null,
      };

    let minBalance = Infinity;
    let maxBalance = -Infinity;
    let hasNegative = false;
    let negativeDay: number | null = null;

    chartData.forEach((data) => {
      if (data.balance < minBalance) minBalance = data.balance;
      if (data.balance > maxBalance) maxBalance = data.balance;
      if (data.balance < 0 && !hasNegative) {
        hasNegative = true;
        negativeDay = data.day;
      }
    });

    return { minBalance, maxBalance, hasNegative, negativeDay };
  }, [chartData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold mb-2">Dia {data.day}</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Saldo:</span>
              <span
                className={`font-semibold ${
                  data.balance >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(data.balance)}
              </span>
            </div>
            {data.hasTransaction && (
              <>
                {data.incomes > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Receitas:</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      +{formatCurrency(data.incomes)}
                    </span>
                  </div>
                )}
                {data.expenses > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Despesas:</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      -{formatCurrency(data.expenses)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fluxo de Caixa
          </CardTitle>
          {stats.hasNegative && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">
                Negativo no dia {stats.negativeDay}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Alerta de Saldo Negativo */}
          {stats.hasNegative && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-900 dark:text-red-100">
                <span className="font-semibold">Atenção:</span> Seu saldo ficará
                negativo antes do final do mês. Considere postergar despesas ou
                antecipar receitas.
              </p>
            </div>
          )}

          {/* Gráfico */}
          <div className="w-full h-[280px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorPositive"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorNegative"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="day"
                  className="text-xs"
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  tickFormatter={(value) =>
                    value % 5 === 0 || value === 1 ? value : ""
                  }
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={0}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="stroke-muted-foreground"
                  opacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#colorPositive)"
                  fillOpacity={1}
                  className="drop-shadow-sm"
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda Personalizada */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Saldo Positivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Saldo Negativo</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
