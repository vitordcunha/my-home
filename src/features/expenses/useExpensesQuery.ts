import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ExpenseWithPaidBy, MonthlyExpenses } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useExpensesQuery(householdId?: string) {
  return useQuery({
    queryKey: ["expenses", householdId],
    queryFn: async (): Promise<ExpenseWithPaidBy[]> => {
      if (!householdId) return [];

      const { data, error } = await supabase
        .from("expenses")
        .select(
          `
          *,
          paid_by_profile:profiles!expenses_paid_by_fkey(
            id,
            nome,
            avatar
          )
        `
        )
        .eq("household_id", householdId)
        .order("paid_at", { ascending: false });

      if (error) throw error;

      // Buscar perfis dos usuários com quem foi dividido
      const expensesWithProfiles = await Promise.all(
        (data || []).map(async (expense: any) => {
          let split_with_profiles = undefined;
          
          if (expense.split_with && Array.isArray(expense.split_with) && expense.split_with.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, nome, avatar")
              .in("id", expense.split_with);
            
            split_with_profiles = profiles || [];
          }

          return {
            ...expense,
            paid_by_profile: Array.isArray(expense.paid_by_profile)
              ? expense.paid_by_profile[0]
              : expense.paid_by_profile,
            split_with_profiles,
          };
        })
      );

      return expensesWithProfiles as ExpenseWithPaidBy[];
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook para agrupar despesas por mês
export function useMonthlyExpensesQuery(householdId?: string) {
  const { data: expenses, ...rest } = useExpensesQuery(householdId);

  const monthlyExpenses: MonthlyExpenses[] = React.useMemo(() => {
    if (!expenses) return [];

    const grouped = expenses.reduce((acc, expense) => {
      const date = new Date(expense.paid_at || expense.created_at);
      const monthKey = format(date, "yyyy-MM");
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          monthLabel: format(date, "MMMM yyyy", { locale: ptBR }),
          total: 0,
          expenses: [],
        };
      }
      
      acc[monthKey].total += Number(expense.amount);
      acc[monthKey].expenses.push(expense);
      
      return acc;
    }, {} as Record<string, MonthlyExpenses>);

    // Converter para array e ordenar por mês (mais recente primeiro)
    return Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));
  }, [expenses]);

  return {
    data: monthlyExpenses,
    expenses,
    ...rest,
  };
}


