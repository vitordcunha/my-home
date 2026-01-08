import { FinancialHealth } from "./useFinancialHealth";

export interface PurchaseSimulationResult {
    newSafeDailyBudget: number;
    budgetDropAmount: number; // How much the daily budget drops
    budgetDropPercentage: number;
    daysToRecover: number; // How many days of "Zero Spend" to recover this amount
    impactSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export function usePurchaseSimulator(
    currentHealth: FinancialHealth | null
) {
    const simulatePurchase = (amount: number): PurchaseSimulationResult | null => {
        if (!currentHealth) return null;

        const { availableBalance: freeBalance, effectiveDaysRemaining, dailyBudget: safeDailyBudget } = currentHealth;

        // New Balance after purchase
        const newFreeBalance = freeBalance - amount;

        // New Daily Budget
        const newSafeDailyBudget = newFreeBalance / effectiveDaysRemaining;

        // Drop
        const budgetDropAmount = safeDailyBudget - newSafeDailyBudget;
        const budgetDropPercentage = safeDailyBudget > 0
            ? (budgetDropAmount / safeDailyBudget) * 100
            : 100;

        // Days to Recover
        // Logic: How many days of "Safe Budget" does this purchase represent?
        // Or: How many days do I need to not spend ANYTHING to make up for this?
        // If I spend X, I 'consumed' X / DailyBudget days of budget.
        const daysToRecover = safeDailyBudget > 0 ? amount / safeDailyBudget : 0;

        // Severity
        let impactSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
        if (newSafeDailyBudget < 0) {
            impactSeverity = "CRITICAL";
        } else if (budgetDropPercentage > 40) {
            impactSeverity = "HIGH";
        } else if (budgetDropPercentage > 15) {
            impactSeverity = "MEDIUM";
        }

        return {
            newSafeDailyBudget,
            budgetDropAmount,
            budgetDropPercentage,
            daysToRecover,
            impactSeverity
        };
    };

    return { simulatePurchase };
}
