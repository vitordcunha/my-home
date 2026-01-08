import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Line,
} from "recharts";

interface DailyProjection {
  dateLabel: string;
  projectedBalance: number;
  budgetedBalance?: number;
  incomeAmount?: number;
  expenseAmount?: number;
}

interface TimelineItem {
  date: string;
  type: "income" | "expense";
  amount: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: any;
  }>;
}

interface CashFlowChartProps {
  // Legacy props
  timeline?: TimelineItem[];
  month?: number;
  year?: number;
  openingBalance?: number;
  currentDayBalance?: number;
  safeDailyBudget?: number;

  // New props
  dailyProjections?: DailyProjection[];
  variant?: "area" | "bar-balance" | "bar-flow" | "composed-projection";
}

export function CashFlowChart({
  timeline,
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear(),
  openingBalance = 0,
  variant = "area",
  dailyProjections,
}: CashFlowChartProps) {

  // Se temos dailyProjections, usamos direto (adaptando para formato do gráfico)
  const chartData = useMemo(() => {
    if (dailyProjections) {
      return dailyProjections.map(d => ({
        day: d.dateLabel,
        balance: d.projectedBalance,
        budgeted: d.budgetedBalance,
        incomes: d.incomeAmount || 0,
        expenses: d.expenseAmount || 0,
      }));
    }

    // Lógica antiga (fallback)
    if (!timeline || timeline.length === 0) return [];

    const daysInMonth = new Date(year, month, 0).getDate();
    const data = [];
    let runningBalance = openingBalance;

    // Criar mapa de transações por dia
    const transactionsByDay: Record<number, { incomes: number; expenses: number }> = {};
    timeline.forEach(item => {
      const day = new Date(item.date).getDate();
      if (!transactionsByDay[day]) transactionsByDay[day] = { incomes: 0, expenses: 0 };
      if (item.type === 'income') transactionsByDay[day].incomes += item.amount;
      else transactionsByDay[day].expenses += Math.abs(item.amount);
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const t = transactionsByDay[day] || { incomes: 0, expenses: 0 };
      runningBalance += t.incomes - t.expenses;

      data.push({
        day: day.toString(),
        balance: runningBalance,
        incomes: t.incomes,
        expenses: t.expenses,
      });
    }

    return data;
  }, [timeline, month, year, openingBalance, dailyProjections]);

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
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-xl p-3 text-xs">
          <p className="font-bold mb-2 text-muted-foreground uppercase tracking-wider">Dia {data.day}</p>
          <div className="space-y-1.5 ">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Saldo Real:</span>
              <span className={`font-semibold ${data.balance >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCurrency(data.balance)}
              </span>
            </div>

            {data.budgeted !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Se seguir meta:</span>
                <span className="text-blue-500 font-medium">
                  {formatCurrency(data.budgeted)}
                </span>
              </div>
            )}

            {(data.incomes > 0 || data.expenses > 0) && (
              <div className="pt-1.5 mt-1.5 border-t border-border/50 space-y-1">
                {data.incomes > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Entradas:</span>
                    <span className="text-emerald-500 font-medium">+{formatCurrency(data.incomes)}</span>
                  </div>
                )}
                {data.expenses > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Saídas:</span>
                    <span className="text-red-500 font-medium">-{formatCurrency(data.expenses)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) return null;

  return (
    <div className="w-full h-full min-h-[100px] flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        {variant === "composed-projection" ? (
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />

            {/* Saldo Real (Area) */}
            <Area
              type="monotone"
              dataKey="balance"
              name="Saldo Real"
              stroke="hsl(var(--primary))"
              fill="url(#balanceGradient)"
              strokeWidth={2}
            />

            {/* Saldo Orçado (Line Dashed) */}
            <Line
              type="monotone"
              dataKey="budgeted"
              name="Meta"
              stroke="hsl(var(--blue-500))"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        ) : variant === "bar-flow" ? (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <Bar
              dataKey="incomes"
              name="Entradas"
              fill="hsl(var(--success))"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              name="Saídas"
              fill="hsl(var(--destructive))"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        ) : (
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="day" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Legenda manual para melhor controle em modo dark/light */}
      {variant === "bar-flow" && (
        <div className="flex items-center justify-center gap-4 mt-2 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Entradas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Saídas</span>
          </div>
        </div>
      )}
    </div>
  );
}
