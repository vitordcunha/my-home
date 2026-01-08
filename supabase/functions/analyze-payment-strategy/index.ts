// Supabase Edge Function to analyze payment strategies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
    expense: {
        amount: number;
        due_date?: string;
        description: string;
    };
    debt: {
        name: string;
        interest_rate: number; // Monthly %
        minimum_payment_percentage?: number;
        minimum_payment_fixed?: number;
    };
    financialHealth: {
        freeBalance: number;
        safeDailyBudget: number;

        daysRemaining: number;
    };
    manualMinimum?: number;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Auth & Body
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("No Auth Header");
        }

        // Note: In a real app we would validate the JWT properly or use the supabase client to getUser.
        // For speed/mvp we often skip strict validation if just prototyping, but let's do rudimentary check.
        // Copying pattern from analyze-document which does basic decoding or calls getUser.

        const reqBody = (await req.json()) as AnalyzeRequest;
        const { expense, debt, financialHealth } = reqBody;

        if (!expense || !debt || !financialHealth) {
            throw new Error("Missing required data");
        }

        // 2. Calculate Scenarios (Math First)
        const amount = Number(expense.amount);
        const interestRate = Number(debt.interest_rate) / 100;

        // Scenario A: Pay Full
        const scenarioFull = {
            name: "Pagar Total",
            pay_amount: amount,
            remainder: 0,
            interest_cost: 0,
            immediate_impact: -amount,
            projected_free_balance: financialHealth.freeBalance - amount
        };

        // Scenario B: Pay Minimum
        // Calc Min
        let minPay = 0;

        // Priority 1: Manual Minimum from User
        if (reqBody.manualMinimum) {
            minPay = Number(reqBody.manualMinimum);
        } else {
            // Priority 2: Configured Fixed/Percentage
            if (debt.minimum_payment_fixed) minPay = Math.max(minPay, Number(debt.minimum_payment_fixed));
            if (debt.minimum_payment_percentage) minPay = Math.max(minPay, amount * (Number(debt.minimum_payment_percentage) / 100));
            // Fallback if no min defined: say 15%
            if (minPay === 0) minPay = amount * 0.15;
        }

        const remainderMin = amount - minPay;
        const nextMonthDebtMin = remainderMin * (1 + interestRate);
        const interestCostMin = nextMonthDebtMin - remainderMin;

        const scenarioMin = {
            name: "Pagar Mínimo",
            pay_amount: minPay,
            remainder: remainderMin,
            interest_cost: interestCostMin,
            immediate_impact: -minPay,
            projected_free_balance: financialHealth.freeBalance - minPay
        };

        // 3. AI Analysis
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

        // Construct Prompt
        const prompt = `
    Atue como um Especialista em Finanças Comportamentais.
    Analise a situação do Vitor e sugira a melhor estratégia de pagamento para a fatura: "${expense.description}" de R$ ${amount.toFixed(2)}.

    DADOS DO USUÁRIOHOJE:
    - Disponível Líquido (FreeBalance): R$ ${financialHealth.freeBalance.toFixed(2)}
    - Orçamento Diário Seguro: R$ ${financialHealth.safeDailyBudget.toFixed(2)}
    - Dias Restantes no Mês: ${financialHealth.daysRemaining}

    DÍVIDA:
    - Nome: ${debt.name}
    - Juros Mensais: ${debt.interest_rate}%

    CENÁRIOS MATEMÁTICOS JÁ CALCULADOS:
    1. PAGAR TUDO:
       - Paga: R$ ${scenarioFull.pay_amount.toFixed(2)}
       - Juros Futuro: R$ 0
       - Saldo Final do Usuário: R$ ${scenarioFull.projected_free_balance.toFixed(2)}
    
    2. PAGAR MÍNIMO:
       - Paga: R$ ${scenarioMin.pay_amount.toFixed(2)}
       - Juros Gerados (Custo): R$ ${scenarioMin.interest_cost.toFixed(2)}
       - Saldo Final do Usuário: R$ ${scenarioMin.projected_free_balance.toFixed(2)}

    SUA TAREFA:
    1. Analise o risco. Se pagar tudo deixar o usuário negativo ou com "Daily Budget" muito baixo (< 10 reais), é perigoso.
    2. Se pagar o mínimo gerar juros absurdos, é ruim.
    3. Sugira um "Cenário Smart" (Intermediário) se necessário. Ou recomende o Total se for seguro.
    
    RETORNE APENAS UM JSON (sem markdown):
    {
      "analysis": "Texto curto e direto (max 2 frases) explicando a lógica. Fale diretamente com o Vitor.",
      "recommended_scenario": "FULL" | "MIN" | "SMART",
      "smart_suggestion": {
         "pay_amount": number (valor sugerido),
         "reason": "Explicação curta"
      }
    }
    `;

        // Call OpenAI
        let aiResult = null;
        if (openaiApiKey) {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openaiApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "Você é um assistente financeiro pragmático." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.2
                }),
            });
            const data = await response.json();
            const content = data.choices[0].message.content;

            // Parse JSON
            try {
                // Remove potential markdown code blocks
                const jsonStr = content.replace(/```json/g, "").replace(/```/g, "");
                aiResult = JSON.parse(jsonStr);
            } catch (e) {
                console.error("AI Parse Error", content);
                aiResult = {
                    analysis: "Não foi possível gerar análise detalhada. Baseado nos números, cuidado com juros.",
                    recommended_scenario: financialHealth.freeBalance > amount ? "FULL" : "MIN",
                    smart_suggestion: { pay_amount: amount, reason: "Fallback" }
                };
            }
        } else {
            // Fallback without AI
            aiResult = {
                analysis: "Modo offline (sem chave de API).",
                recommended_scenario: "FULL",
                smart_suggestion: { pay_amount: amount, reason: "Offline" }
            };
        }

        // 4. Construct Final Response
        // Calculate Smart Scenario based on AI input
        const smartAmount = aiResult.smart_suggestion?.pay_amount || amount;
        const remainderSmart = Math.max(0, amount - smartAmount);
        const nextMonthDebtSmart = remainderSmart * (1 + interestRate);
        const interestCostSmart = Math.max(0, nextMonthDebtSmart - remainderSmart);

        const scenarioSmart = {
            name: "Recomendação IA",
            pay_amount: smartAmount,
            remainder: remainderSmart,
            interest_cost: interestCostSmart,
            immediate_impact: -smartAmount,
            projected_free_balance: financialHealth.freeBalance - smartAmount,
            reason: aiResult.smart_suggestion?.reason
        };

        return new Response(JSON.stringify({
            scenarios: [scenarioFull, scenarioMin, scenarioSmart],
            recommendation: aiResult.analysis,
            best_option: aiResult.recommended_scenario
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
