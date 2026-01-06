import { useMemo } from "react";
import { ExpenseWithPaidBy } from "./types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXPENSE_CATEGORY_LABELS } from "./types";

// Cores baseadas nas categorias
const COLORS: Record<string, string> = {
  mercado: "hsl(142 65% 52%)", // Verde
  limpeza: "hsl(199 89% 48%)", // Azul
  contas: "hsl(271 91% 65%)", // Roxo
  manutencao: "hsl(43 96% 56%)", // Amarelo
  delivery: "hsl(12 76% 61%)", // Laranja/Vermelho
  casa: "hsl(330 81% 60%)", // Rosa
  outros: "hsl(240 5% 50%)", // Cinza
  custom: "hsl(220 14% 96%)", // Off-white
};

interface ExpensesAnalyticsProps {
  expenses: ExpenseWithPaidBy[];
  periodLabel: string;
  budgets?: Array<{
    category: string;
    limit_amount: number;
  }>;
}

export function ExpensesAnalytics({
  expenses,
  periodLabel,
  budgets,
}: ExpensesAnalyticsProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  // 1. Agrupar por Categoria (Gráfico de Rosca)
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();

    expenses.forEach((exp) => {
      const cat = exp.category || "outros";
      const current = map.get(cat) || 0;
      map.set(cat, current + Number(exp.amount));
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name: EXPENSE_CATEGORY_LABELS[name as keyof typeof EXPENSE_CATEGORY_LABELS] || name,
        value,
        category: name,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // 2. Agrupar por Dia (Gráfico de Barras)
  const dailyData = useMemo(() => {
    const map = new Map<string, number>();

    expenses.forEach((exp) => {
      const date = new Date(exp.paid_at || exp.created_at);
      const dayKey = date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
      const current = map.get(dayKey) || 0;
      map.set(dayKey, current + Number(exp.amount));
    });

    return Array.from(map.entries())
      .map(([day, amount]) => ({ day, amount }))
      .sort((a, b) => {
        // Ordenar por data
        const dateA = new Date(a.day.split(" ")[1] + " " + a.day.split(" ")[0]);
        const dateB = new Date(b.day.split(" ")[1] + " " + b.day.split(" ")[0]);
        return dateA.getTime() - dateB.getTime();
      });
  }, [expenses]);

  // 3. Dados de Orçamento vs Realizado (se houver budgets)
  const budgetComparisonData = useMemo(() => {
    if (!budgets || budgets.length === 0) return null;

    const map = new Map<string, { spent: number; limit: number }>();

    // Inicializar com limites
    budgets.forEach((budget) => {
      map.set(budget.category, { spent: 0, limit: budget.limit_amount });
    });

    // Somar gastos
    expenses.forEach((exp) => {
      const cat = exp.category || "outros";
      const current = map.get(cat);
      if (current) {
        current.spent += Number(exp.amount);
      }
    });

    return Array.from(map.entries())
      .map(([category, data]) => ({
        category:
          EXPENSE_CATEGORY_LABELS[category as keyof typeof EXPENSE_CATEGORY_LABELS] ||
          category,
        spent: data.spent,
        limit: data.limit,
        percentage: (data.spent / data.limit) * 100,
      }))
      .filter((item) => item.limit > 0);
  }, [expenses, budgets]);

  if (!expenses.length) return null;

  const totalSpent = expenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Gasto</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Despesas</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Distribuição por Categoria - {periodLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.category] || COLORS["outros"]}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Tendência Diária */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução Diária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis
                  dataKey="day"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  hide
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo Orçamento vs Realizado */}
      {budgetComparisonData && budgetComparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Orçamento vs Realizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetComparisonData.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.category}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
                    </span>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.percentage > 100
                          ? "bg-red-500"
                          : item.percentage > 80
                          ? "bg-amber-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                    {item.percentage > 100 && (
                      <div
                        className="absolute top-0 h-full bg-red-600 opacity-50"
                        style={{
                          left: "100%",
                          width: `${item.percentage - 100}%`,
                        }}
                      />
                    )}
                  </div>
                  {item.percentage > 100 && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Excedido em{" "}
                      {formatCurrency(item.spent - item.limit)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

