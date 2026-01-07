import { useMemo } from "react";
import { useFinancialBalance } from "@/features/expenses/useFinancialBalance";
import { useExpensesQuery } from "@/features/expenses/useExpensesQuery";
import { useIncomesQuery } from "@/features/expenses/useIncomesQuery";
import { startOfDay, endOfMonth, differenceInDays, isSameMonth, isAfter, isBefore, getDay } from "date-fns";

export type FinancialHealthStatus = "HEALTHY" | "CAUTION" | "DANGER";

export interface FinancialHealth {
    daysRemaining: number;
    effectiveDaysRemaining: number;
    projectedFixedExpenses: number;
    freeBalance: number;
    safeDailyBudget: number;
    weekendSafeDailyBudget: number;
    projectedEndBalance: number;
    status: FinancialHealthStatus;
    averageDailySpend: number;
    monthProgress: number; // 0 to 1
    accumulatedBalance: number;
    dailyBaseBudget: number;
    // New fields for detail view
    realizedIncome: number;
    projectedIncome: number;
    realizedExpenses: number;
    projectedExpenses: number;
}

interface UseFinancialHealthProps {
    householdId?: string;
    userId?: string;
    weekendWeight?: number; // Default 1.5
}

export function useFinancialHealth({
    householdId,
    weekendWeight = 1.5,
}: UseFinancialHealthProps) {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const { data: balanceData } = useFinancialBalance(householdId, currentMonth, currentYear);
    const { data: expenses } = useExpensesQuery(householdId);
    // Note: useExpensesQuery in this codebase currently fetches ALL expenses or has pagination? 
    // Based on previous file exploration, useExpensesQuery fetches with filters. 
    // We might need to ensure we have the right data. 
    // For now, let's assume it returns a list and we filter client-side or we rely on the query to be broad enough.
    // Actually, looking at the previous list_dir, `useExpensesQuery` exists.

    const { data: incomes } = useIncomesQuery(householdId);

    return useMemo(() => {
        if (!balanceData || !expenses || !incomes) return null;

        const now = new Date();
        const today = startOfDay(now);
        const monthEnd = endOfMonth(today);
        const monthStart = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
        const totalDaysInMonth = parseInt(monthEnd.getDate().toString());
        const daysRemaining = Math.max(1, differenceInDays(monthEnd, today));
        const monthProgress = (totalDaysInMonth - daysRemaining) / totalDaysInMonth;

        // --- 1. Weight Calculations (Total & Passed) ---
        let totalMonthWeights = 0;
        let effectiveDaysRemaining = 0;
        let effectiveDaysPassed = 0;

        let tempDate = new Date(monthStart);
        // Loop through every day of the month
        for (let i = 0; i < totalDaysInMonth; i++) {
            const dayOfWeek = getDay(tempDate); // 0 = Sunday, 6 = Saturday
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const weight = isWeekend ? weekendWeight : 1;

            totalMonthWeights += weight;

            if (isBefore(tempDate, today)) {
                effectiveDaysPassed += weight;
            } else if (isSameMonth(tempDate, today) && tempDate.getDate() === today.getDate()) {
                effectiveDaysPassed += weight; // Include today in "passed" for "Available Today" logic
            } else {
                effectiveDaysRemaining += weight;
            }

            tempDate.setDate(tempDate.getDate() + 1);
        }

        // Safety for effectiveDaysRemaining (used for legacy calculation)
        effectiveDaysRemaining = Math.max(0.01, effectiveDaysRemaining);

        // --- 2. Financial Aggregates ---

        // Incomes
        const currentMonthIncomes = (incomes || []).filter(i => isSameMonth(new Date(i.received_at || i.created_at), today));
        const totalIncome = currentMonthIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
        const openingBalance = balanceData?.opening_balance || 0;

        // Helpers for Expenses
        const isFixed = (e: any) => e.category === 'contas' || e.category === 'casa' || e.is_recurring;
        const isVariable = (e: any) => !isFixed(e);

        // Fixed Expenses (Paid + Future)
        // We assume ALL 'contas'/'casa' for this month are fixed obligations.
        const allMonthExpenses = (expenses || []).filter(e => isSameMonth(new Date(e.paid_at || e.created_at), today));

        const fixedExpensesPaid = allMonthExpenses.filter(e => isFixed(e) && !isAfter(new Date(e.paid_at || e.created_at), now));
        const totalFixedPaid = fixedExpensesPaid.reduce((sum, e) => sum + Number(e.amount), 0);

        // All Future Expenses (Fixed AND Variable) should be subtracted from the "Budget Pot"
        // Why? Because if I schedule a BBQ (Variable) next week, that money is already committed.
        const projectedExpenses = (expenses || [])
            .filter(e => {
                const expDate = new Date(e.paid_at || e.created_at);
                return (
                    isAfter(expDate, now) &&
                    isBefore(expDate, monthEnd)
                );
            })
            .reduce((sum, e) => sum + Number(e.amount), 0);

        // We track totals separately for display/logic if needed, but for the MAIN calculation:
        // Total Committed = Paid Fixed + Paid Variable + Future Fixed + Future Variable
        // Actually, simpler: Total Spent So Far + Total Future (Planned)

        const totalSpentSoFar = allMonthExpenses
            .filter(e => !isAfter(new Date(e.paid_at || e.created_at), now))
            .reduce((sum, e) => sum + Number(e.amount), 0);



        // Variable Expenses (Paid So Far)
        const variableExpensesPaid = allMonthExpenses.filter(e => isVariable(e) && !isAfter(new Date(e.paid_at || e.created_at), now));
        const totalVariableSpent = variableExpensesPaid.reduce((sum, e) => sum + Number(e.amount), 0);

        // --- 3. Core Calculations ---

        // Total "Pot" available for Variable Spending for the WHOLE month
        // logic: Total Income + Opening - (Fixed Expenses + Future Variable)
        // If we want "Safe Daily" to reflect "Unscheduled Money", we should subtract everything scheduled.

        // Variable Expenses (Paid So Far) are part of the consumption of this pot.
        // But to find the DAILY budget, we look at what is FREE.

        // Let's stick to the "Accumulated Available" logic requested:
        // The goal: "Accumulated daily budget".

        // Revised Logic for "Accumulated Balance":
        // 1. Total Disposable Income = Opening + Income - Annual/Fixed Obligations (Projected Fixed)
        // 2. BUT user wants scheduled *variable* expenses to also reduce the daily limit today.

        // So: Total Disposable = Opening + Income - (Projected Fixed + Projected Variable) - (Paid Fixed)
        // Then we distribute this "True Free Cash" across the days.
        // And subtract "Paid Variable" to see if we are on track.

        // Let's refine:
        // Pot = Opening + Income - Total_Committed_Future_Expenses - Total_Paid_Fixed_Expenses
        // NOTE: Total_Committed_Future_Expenses includes BOTH fixed and variable future expenses.

        const netDisposableIncome = (openingBalance + totalIncome) - projectedExpenses - totalFixedPaid;

        // Base Spending Power per Unit of Weight
        // Logic: How much can I spend on Variable stuff per day, assuming I stick to the plan?
        const dailyBaseBudget = netDisposableIncome / Math.max(1, totalMonthWeights);

        // Calculate "Accumulated Available" (Rollover Logic)
        const accumulatedCap = dailyBaseBudget * effectiveDaysPassed;
        const rawAccumulatedBalance = accumulatedCap - totalVariableSpent;
        const accumulatedBalance = rawAccumulatedBalance; // Allow negatives to show "Over budget"



        // Recalculated Safe Daily
        // Effectively: How much uncommitted money do I have left, divided by remaining days?
        const currentAvailable = openingBalance + totalIncome - totalSpentSoFar;
        const trueFreeBalance = currentAvailable - projectedExpenses; // Money in account minus reserved for future

        // We use trueFreeBalance instead of 'freeBalance' (legacy name)
        const safeDailyBudget = Math.max(0, trueFreeBalance / effectiveDaysRemaining);
        const weekendSafeDailyBudget = safeDailyBudget * weekendWeight;

        // --- 4. Projection & Status ---
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const last7DaysExpenses = (expenses || []).filter(e => {
            const d = new Date(e.paid_at || e.created_at);
            return isAfter(d, sevenDaysAgo) && isBefore(d, today);
        });
        const variableExpensesLast7Days = last7DaysExpenses.filter(isVariable);
        const avgVariableDailySpend = variableExpensesLast7Days.reduce((sum, e) => sum + Number(e.amount), 0) / 7;

        const projectedEndBalance = trueFreeBalance - (avgVariableDailySpend * daysRemaining);


        // Status Logic
        let status: FinancialHealthStatus = "HEALTHY";
        if (rawAccumulatedBalance < 0) { // If accumulated is negative, we are "behind schedule"
            status = "CAUTION";
        }
        if (trueFreeBalance < 0) {
            status = "DANGER";
        }


        return {
            daysRemaining,
            effectiveDaysRemaining,
            projectedFixedExpenses: projectedExpenses, // Renaming prop in interface might break consumers, so we keep name but pass Total Projected
            freeBalance: trueFreeBalance,
            safeDailyBudget,
            weekendSafeDailyBudget,
            projectedEndBalance,
            status,
            averageDailySpend: avgVariableDailySpend,
            monthProgress,
            accumulatedBalance,
            dailyBaseBudget,
            // Export detailed metrics
            realizedIncome: totalIncome - currentMonthIncomes.filter(i => isAfter(new Date(i.received_at || i.created_at), now)).reduce((sum, i) => sum + Number(i.amount), 0),
            projectedIncome: currentMonthIncomes.filter(i => isAfter(new Date(i.received_at || i.created_at), now)).reduce((sum, i) => sum + Number(i.amount), 0),
            realizedExpenses: totalSpentSoFar,
            projectedExpenses: projectedExpenses // "projectedExpenses" var already holds the Sum of Future Expenses
        };
    }, [balanceData, expenses, incomes, weekendWeight]);
}
