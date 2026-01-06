import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ImportedTransaction } from "./import-types";
import { Database } from "@/types/database";

type IncomeInsert = Database["public"]["Tables"]["incomes"]["Insert"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];

interface SaveImportedTransactionsParams {
  transactions: ImportedTransaction[];
  householdId: string;
  userId: string;
}

export function useSaveImportedTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactions,
      householdId,
      userId,
    }: SaveImportedTransactionsParams) => {
      // Save all selected transactions, even if they were marked as matched
      // The user has manually reviewed and selected them, so they should be saved
      const selectedTransactions = transactions.filter(
        (t) => t.selected === true
      );

      // Separate matched vs new transactions for logging
      const matchedTransactions = selectedTransactions.filter(
        (t) => t.match_type !== "none"
      );
      const newTransactions = selectedTransactions.filter(
        (t) => t.match_type === "none"
      );

      console.log(
        `[SaveTransactions] Total transactions: ${transactions.length}`
      );
      console.log(
        `[SaveTransactions] Selected transactions: ${selectedTransactions.length} (${newTransactions.length} new, ${matchedTransactions.length} matched)`
      );

      if (selectedTransactions.length === 0) {
        console.warn("[SaveTransactions] No transactions selected to save.");
        return { incomes: [], expenses: [] };
      }

      // Use all selected transactions, not just unmatched ones
      // If user selected a matched transaction, they want to save it anyway
      const transactionsToSave = selectedTransactions;

      // Separate incomes and expenses
      const incomes = transactionsToSave.filter((t) => t.type === "income");
      const expenses = transactionsToSave.filter((t) => t.type === "expense");

      const results = {
        incomes: [] as any[],
        expenses: [] as any[],
      };

      // Insert incomes
      if (incomes.length > 0) {
        const incomesToInsert: IncomeInsert[] = incomes.map((income) => {
          // Ensure date is in ISO format (YYYY-MM-DD or full ISO string)
          // If it's just YYYY-MM-DD, convert to full ISO string with time
          let dateValue = income.date;
          if (dateValue && !dateValue.includes("T")) {
            // If it's just a date (YYYY-MM-DD), add time to make it a full ISO string
            dateValue = `${dateValue}T00:00:00.000Z`;
          }

          // Special handling for salaries received on the last business day of the month
          // They should be attributed to the next month (e.g., salary on 28/12 -> 01/01)
          if (income.category === "salario") {
            const transactionDate = new Date(dateValue);
            const year = transactionDate.getFullYear();
            const month = transactionDate.getMonth();

            // Find the last business day (Monday-Friday) of the month
            const lastDayOfMonth = new Date(year, month + 1, 0);
            const lastBusinessDay = new Date(lastDayOfMonth);

            // Go backwards from the last day until we find a weekday (Mon-Fri)
            while (
              lastBusinessDay.getDay() === 0 ||
              lastBusinessDay.getDay() === 6
            ) {
              lastBusinessDay.setDate(lastBusinessDay.getDate() - 1);
            }

            // Check if the transaction is on the last business day of the month
            // Also check if it's within the last 3 business days (to catch edge cases)
            const isLastBusinessDay =
              transactionDate.getDate() === lastBusinessDay.getDate() &&
              transactionDate.getMonth() === lastBusinessDay.getMonth();

            // Check if it's in the last 3 business days of the month
            let isInLastBusinessDays = false;
            let checkDate = new Date(lastBusinessDay);
            for (let i = 0; i < 3; i++) {
              if (
                transactionDate.getDate() === checkDate.getDate() &&
                transactionDate.getMonth() === checkDate.getMonth()
              ) {
                isInLastBusinessDays = true;
                break;
              }
              // Move to previous business day
              checkDate.setDate(checkDate.getDate() - 1);
              while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
                checkDate.setDate(checkDate.getDate() - 1);
              }
            }

            if (isLastBusinessDay || isInLastBusinessDays) {
              // Move to the first day of the next month
              const nextMonth = new Date(transactionDate);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              nextMonth.setDate(1);
              dateValue = nextMonth.toISOString();
              console.log(
                `[SaveTransactions] Adjusted salary date from ${transactionDate.toISOString()} to ${dateValue} (last business day(s) of month -> first day of next month)`
              );
            }
          }

          return {
            household_id: householdId,
            description: income.description,
            amount: income.amount,
            category: income.category as IncomeInsert["category"],
            received_at: dateValue,
            received_by: userId,
            is_recurring: false,
            created_by: userId,
          };
        });

        const { data: insertedIncomes, error: incomeError } = await supabase
          .from("incomes")
          .insert(incomesToInsert)
          .select();

        if (incomeError) {
          console.error("Error inserting incomes:", incomeError);
          throw new Error(`Erro ao salvar receitas: ${incomeError.message}`);
        }

        results.incomes = insertedIncomes || [];
        console.log(
          `[SaveTransactions] Saved ${results.incomes.length} incomes`
        );
      }

      // Insert expenses
      if (expenses.length > 0) {
        const expensesToInsert: ExpenseInsert[] = expenses.map((expense) => {
          // Ensure date is in ISO format (YYYY-MM-DD or full ISO string)
          // If it's just YYYY-MM-DD, convert to full ISO string with time
          let dateValue = expense.date;
          if (dateValue && !dateValue.includes("T")) {
            // If it's just a date (YYYY-MM-DD), add time to make it a full ISO string
            dateValue = `${dateValue}T00:00:00.000Z`;
          }

          return {
            household_id: householdId,
            description: expense.description,
            amount: expense.amount,
            category: expense.category as ExpenseInsert["category"],
            paid_at: dateValue,
            paid_by: userId,
            split_type: "individual",
            split_data: {},
            is_split: false,
            is_recurring: false,
            created_by: userId,
          };
        });

        const { data: insertedExpenses, error: expenseError } = await supabase
          .from("expenses")
          .insert(expensesToInsert)
          .select();

        if (expenseError) {
          console.error("Error inserting expenses:", expenseError);
          throw new Error(`Erro ao salvar despesas: ${expenseError.message}`);
        }

        results.expenses = insertedExpenses || [];
        console.log(
          `[SaveTransactions] Saved ${results.expenses.length} expenses`
        );
      }

      return results;
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refresh the data
      // Use predicate to invalidate all queries that start with these keys
      // This includes queries with householdId parameter
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            key === "incomes" ||
            key === "expenses" ||
            key === "financial-timeline" ||
            key === "financial-balance" ||
            key === "totalSpent"
          );
        },
      });

      console.log(
        `[SaveTransactions] Invalidated queries for household ${variables.householdId}`
      );
      console.log(
        `[SaveTransactions] Successfully saved ${data.incomes.length} incomes and ${data.expenses.length} expenses`
      );
    },
  });
}
