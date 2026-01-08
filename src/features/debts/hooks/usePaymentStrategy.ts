import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { FinancialHealth } from "@/features/analytics/hooks/useFinancialHealth";

interface AnalyzeParams {
    expense: {
        amount: number;
        description: string;
        due_date?: string;
    };
    debtId: string;
    financialHealth: FinancialHealth;
    manualMinimum?: number;
}

export interface PaymentScenario {
    name: string;
    pay_amount: number;
    remainder: number;
    interest_cost: number;
    immediate_impact: number;
    projected_free_balance: number;
    reason?: string;
}

interface AnalysisResult {
    scenarios: PaymentScenario[];
    recommendation: string;
    best_option: "FULL" | "MIN" | "SMART";
}

export function usePaymentStrategy() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const analyze = async ({ expense, debtId, financialHealth, manualMinimum }: AnalyzeParams) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch debt details
            const { data: debt, error: debtError } = await supabase
                .from("debts" as any)
                .select("*")
                .eq("id", debtId)
                .single();

            if (debtError) throw new Error("Erro ao buscar dados da dívida");

            // 2. Call Edge Function
            const { data, error: funcError } = await supabase.functions.invoke("analyze-payment-strategy", {
                body: {
                    expense,
                    debt,
                    financialHealth: {
                        freeBalance: financialHealth.availableBalance,
                        safeDailyBudget: financialHealth.dailyBudget,
                        daysRemaining: financialHealth.daysRemaining
                    },
                    manualMinimum
                }
            });

            if (funcError) throw funcError;
            setResult(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erro ao analisar estratégia");
        } finally {
            setLoading(false);
        }
    };

    return { analyze, loading, result, error, reset: () => setResult(null) };
}
