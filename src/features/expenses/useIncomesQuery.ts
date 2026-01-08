import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type Income = Database["public"]["Tables"]["incomes"]["Row"];
export type IncomeInsert = Database["public"]["Tables"]["incomes"]["Insert"];
export type IncomeUpdate = Database["public"]["Tables"]["incomes"]["Update"];

export type IncomeWithReceivedBy = Income & {
  received_by_profile?: {
    id: string;
    nome: string;
    avatar: string | null;
  };
};

export type MonthlyIncomes = {
  month: string; // formato: "YYYY-MM"
  monthLabel: string; // formato: "Janeiro 2026"
  total: number;
  incomes: IncomeWithReceivedBy[];
};

export function useIncomesQuery(householdId?: string) {
  return useQuery({
    queryKey: ["incomes", householdId],
    queryFn: async (): Promise<IncomeWithReceivedBy[]> => {
      if (!householdId) return [];

      const { data, error } = await supabase
        .from("incomes")
        .select(
          `
          *,
          received_by_profile:profiles!incomes_received_by_fkey(
            id,
            nome,
            avatar
          )
        `
        )
        .eq("household_id", householdId)
        .order("received_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      return (data || []).map((income: any) => ({
        ...income,
        received_by_profile: Array.isArray(income.received_by_profile)
          ? income.received_by_profile[0]
          : income.received_by_profile,
      })) as IncomeWithReceivedBy[];
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook para agrupar receitas por mês
export function useMonthlyIncomesQuery(householdId?: string) {
  const { data: incomes, ...rest } = useIncomesQuery(householdId);

  const monthlyIncomes: MonthlyIncomes[] = React.useMemo(() => {
    if (!incomes) return [];

    const grouped = incomes.reduce((acc, income) => {
      const date = income.received_at
        ? new Date(income.received_at)
        : income.next_occurrence_date
          ? new Date(income.next_occurrence_date)
          : new Date(income.created_at || new Date());
      const monthKey = format(date, "yyyy-MM");

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          monthLabel: format(date, "MMMM yyyy", { locale: ptBR }),
          total: 0,
          incomes: [],
        };
      }

      acc[monthKey].total += Number(income.amount);
      acc[monthKey].incomes.push(income);

      return acc;
    }, {} as Record<string, MonthlyIncomes>);

    // Converter para array e ordenar por mês (mais recente primeiro)
    return Object.values(grouped).sort((a, b) =>
      b.month.localeCompare(a.month)
    );
  }, [incomes]);

  return {
    data: monthlyIncomes,
    incomes,
    ...rest,
  };
}

