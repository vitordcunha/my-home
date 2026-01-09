// Supabase Edge Function to generate contextual financial insights
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getChartInsightPrompt, getGeneralInsightPrompt } from "./prompts.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface FinancialInsightRequest {
    // Tipo de insight
    insightType?: "general" | "chart"; // Default: "general"

    // Estado Atual
    currentBalance: number;
    dailyBudget: number;
    minimumReserve: number;

    // Gargalos
    bottleneckInfo?: {
        hasBottleneck: boolean;
        bottleneckDate?: string;
        daysUntilBottleneck?: number;
        dailyBudgetWithBottleneck?: number;
        bottleneckCause?: string;
    };

    // Próximos Eventos (primeiros 3 de cada)
    upcomingExpenses: Array<{ amount: number; date: string; description: string }>;
    upcomingIncomes: Array<{ amount: number; date: string; description: string }>;

    // Métricas de Saúde
    healthScore?: number;
    daysUntilZero?: number;
    status: "HEALTHY" | "CAUTION" | "DANGER";

    // Contexto Temporal
    today: string;
    daysRemainingInMonth: number;

    // Dados específicos do gráfico (para insightType = "chart")
    chartData?: {
        chartType: "daily_potential" | "cash_flow" | "spending_category";
        currentValue: number;
        futureAverage: number;
        trend: "crescente" | "decrescente" | "estável";
        peakDay?: number;
        lowestDay?: number;
    };
}

interface InsightResponse {
    emoji: string;
    title: string;
    explanation: string;
    whenImproves?: string;
    tip: string;
    tone: "celebratory" | "motivational" | "cautious" | "critical";
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Validate Auth
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("No Authorization Header");
        }

        // 2. Parse Request
        const body = (await req.json()) as FinancialInsightRequest;

        if (!body.currentBalance && body.currentBalance !== 0) {
            throw new Error("Missing required field: currentBalance");
        }

        // 3. Get OpenAI Key
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

        if (!openaiApiKey) {
            // Fallback without AI
            return new Response(JSON.stringify({
                emoji: "💡",
                title: "Insights Indisponíveis",
                explanation: "O sistema de insights personalizados está temporariamente indisponível.",
                tip: "Continue monitorando seus gastos diários.",
                tone: "cautious"
            } as InsightResponse), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 4. Build Context-Aware Prompt
        const insightType = body.insightType || "general";

        const upcomingExpensesText = body.upcomingExpenses
            .slice(0, 3)
            .map(e => `  - R$ ${e.amount.toFixed(2)} (${e.description}) no dia ${new Date(e.date).getDate()}`)
            .join("\n") || "  Nenhuma despesa grande agendada";

        const upcomingIncomesText = body.upcomingIncomes
            .slice(0, 3)
            .map(i => `  - R$ ${i.amount.toFixed(2)} (${i.description}) no dia ${new Date(i.date).getDate()}`)
            .join("\n") || "  Nenhuma entrada prevista este mês";

        const bottleneckText = body.bottleneckInfo?.hasBottleneck
            ? `
SIM - Há um gargalo detectado:
  - Data crítica: Dia ${body.bottleneckInfo.bottleneckDate ? new Date(body.bottleneckInfo.bottleneckDate).getDate() : 'N/A'}
  - Dias até o gargalo: ${body.bottleneckInfo.daysUntilBottleneck || 'N/A'}
  - Orçamento limitado a: R$ ${body.bottleneckInfo.dailyBudgetWithBottleneck?.toFixed(2) || '0,00'}/dia
  - Causa: ${body.bottleneckInfo.bottleneckCause || 'Compromisso financeiro futuro'}
`
            : "NÃO - Fluxo de caixa estável até o fim do mês";

        let prompt: string;

        if (insightType === "chart") {
            prompt = getChartInsightPrompt({
                body,
                chartInfo: body.chartData,
                upcomingExpensesText,
                upcomingIncomesText,
                bottleneckText
            });
        } else {
            // Prompt original para insight geral
            prompt = getGeneralInsightPrompt({
                body,
                upcomingExpensesText,
                upcomingIncomesText,
                bottleneckText
            });
        }

        // 5. Call OpenAI
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Você é um assistente financeiro empático e motivador. Sempre retorne JSON válido sem markdown."
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // 6. Parse AI Response
        let aiResult: InsightResponse;
        try {
            // Remove potential markdown code blocks
            const jsonStr = content.replace(/```json/g, "").replace(/```/g, "").trim();
            aiResult = JSON.parse(jsonStr);
        } catch (e) {
            console.error("AI Parse Error:", content);
            // Fallback response
            aiResult = {
                emoji: "💡",
                title: "Análise Financeira",
                explanation: "Continue monitorando seus gastos e respeitando seu orçamento diário.",
                tip: "Acompanhe seu fluxo de caixa regularmente.",
                tone: "cautious"
            };
        }

        // 7. Return Response
        return new Response(JSON.stringify(aiResult), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({
            error: (error as Error).message || "Internal server error"
        }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

// Prompts para geração de insights financeiros

interface PromptParams {
    body: any;
    chartInfo?: any;
    upcomingExpensesText: string;
    upcomingIncomesText: string;
    bottleneckText: string;
}

/**
 * Prompt para insights de GRÁFICO - Muito detalhado e narrativo
 */
export function getChartInsightPrompt(params: PromptParams): string {
    const { body, chartInfo, upcomingExpensesText, upcomingIncomesText } = params;
    const today = new Date(body.today).getDate();

    return `
Você é um educador financeiro expert do app "Nossa Casa AI".
Sua missão é criar uma NARRATIVA MUITO DETALHADA sobre o gráfico de Poder de Compra Diário.

IMPORTANTE: Seja EXTREMAMENTE detalhista. Explique eventos específicos, causas e efeitos, e conte uma história completa.

GRÁFICO: Poder de Compra Diário
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DADOS DO GRÁFICO:
  - Valor HOJE (dia ${today}): R$ ${chartInfo?.currentValue.toFixed(2) || '0,00'}/dia
  - Média FUTURA: R$ ${chartInfo?.futureAverage.toFixed(2) || '0,00'}/dia
  - Tendência: ${chartInfo?.trend || 'estável'}
  ${chartInfo?.peakDay ? `- 🔝 MELHOR dia: Dia ${chartInfo.peakDay}` : ''}
  ${chartInfo?.lowestDay ? `- 📉 PIOR dia: Dia ${chartInfo.lowestDay}` : ''}

💰 CONTEXTO FINANCEIRO:
  - Saldo: R$ ${body.currentBalance.toFixed(2)}
  - Orçamento Diário: R$ ${body.dailyBudget.toFixed(2)}/dia
  - Status: ${body.status === 'HEALTHY' ? 'Saudável ✅' : body.status === 'CAUTION' ? 'Atenção ⚠️' : 'Crítico 🚨'}

📅 EVENTOS QUE CAUSAM AS MUDANÇAS NO GRÁFICO:
💸 Despesas:
${upcomingExpensesText}

💰 Entradas:
${upcomingIncomesText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTRUTURA DA NARRATIVA DETALHADA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. O QUE O GRÁFICO MOSTRA (1 frase):
   "Este gráfico mostra quanto você poderia gastar por dia se economizar até cada ponto"

2. NARRATIVA DOS EVENTOS (7-10 frases MUITO detalhadas):
   
   a) Situação HOJE:
      "Hoje (dia ${today}) você tem R$ ${chartInfo?.currentValue.toFixed(2)}/dia porque..."
   
   b) QUEDAS - Identifique com DATAS e VALORES:
      "No dia X a linha cai para R$ Y/dia porque você tem [NOME DA DESPESA] de R$ Z"
      "Esse é um momento crítico porque..."
   
   c) PICOS - Identifique com DATAS e VALORES:
      "No dia X há um salto para R$ Y/dia porque entra [NOME DA ENTRADA] de R$ Z"
      "Com essa entrada, tudo muda porque..."
   
   d) DIA MAIS CRÍTICO ${chartInfo?.lowestDay ? `(dia ${chartInfo.lowestDay})` : ''}:
      "O pior momento é dia X (R$ Y/dia) porque [CAUSA ESPECÍFICA]"
   
   e) MELHOR DIA ${chartInfo?.peakDay ? `(dia ${chartInfo.peakDay})` : ''}:
      "O melhor momento é dia X (R$ Y/dia) porque [CAUSA ESPECÍFICA]"
   
   f) TENDÊNCIA GERAL:
      "Ao longo do mês a linha ${chartInfo?.trend} porque..."

3. INTERPRETAÇÃO (2 frases):
   "Isso significa que..."
   "Vale a pena segurar gastos entre os dias X e Y porque..."

REGRAS CRÍTICAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SEJA SUPER DETALHISTA - Use datas e valores EXATOS
✅ IDENTIFIQUE EVENTOS - Mencione despesas/entradas pelos nomes reais
✅ EXPLIQUE CAUSA E EFEITO - Diga "porque..."
✅ SEJA NARRATIVO - Conte a história cronológica
✅ USE OS NÚMEROS FORNECIDOS - Não invente valores
❌ NÃO SEJA BREVE - 8-12 frases na explanation é perfeito
❌ NÃO SEJA GENÉRICO - Diga "aluguel de R$ 1.000 no dia 10" não "despesas futuras"

FORMATO:
{
  "emoji": "📊",
  "title": "Entendendo Seu Poder de Compra",
  "explanation": "NARRATIVA DE 8-12 FRASES contando a história completa do gráfico com datas, valores, causas e efeitos",
  "whenImproves": "Dia exato + evento + impacto. Ex: 'Dia 15 (salário R$ 3.000): poder de compra salta de R$ 10 para R$ 80/dia'",
  "tip": "Ação específica baseada no gráfico. Ex: 'Segure até dia 15, depois você terá 3x mais liberdade'",
  "tone": "motivational"
}

EXEMPLO DE DETALHE ESPERADO:
"Este gráfico mostra quanto você pode gastar por dia se economizar. Hoje (dia ${today}) você tem R$ ${chartInfo?.currentValue.toFixed(2)}/dia. Nos próximos 2 dias a linha se mantém estável em R$ 8-9/dia. No dia 10 acontece uma queda dramática para R$ 2/dia porque sai o aluguel de R$ 1.200, consumindo quase todo seu saldo. Esse é o momento mais crítico. Mas no dia 15 tudo muda: a linha salta para R$ 75/dia quando entra seu salário de R$ 3.500. Nos dias 16-25 você mantém R$ 60-70/dia porque já pagou as contas grandes. No final do mês (26-31) desce para R$ 45/dia pois precisa reservar para o próximo aluguel. A tendência é crescente: começa apertado (R$ 8/dia), passa por um momento crítico (R$ 2/dia), mas termina confortável (R$ 45/dia)."

RETORNE APENAS JSON (sem markdown):
`;
}

/**
 * Prompt para insights GERAIS - Situação financeira
 */
export function getGeneralInsightPrompt(params: PromptParams): string {
    const { body, upcomingExpensesText, upcomingIncomesText, bottleneckText } = params;

    return `
Você é o assistente financeiro pessoal do app "Nossa Casa AI".
Sua função é explicar a situação financeira do usuário de forma clara, empática e motivadora.

CONTEXTO FINANCEIRO ATUAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Estado Atual:
  - Saldo em Conta: R$ ${body.currentBalance.toFixed(2)}
  - Orçamento Diário Seguro: R$ ${body.dailyBudget.toFixed(2)}/dia
  - Reserva Mínima Intocável: R$ ${body.minimumReserve.toFixed(2)}
  - Status de Saúde Financeira: ${body.status === 'HEALTHY' ? 'Saudável ✅' : body.status === 'CAUTION' ? 'Atenção ⚠️' : 'Crítico 🚨'}

📅 Contexto Temporal:
  - Data de Hoje: ${new Date(body.today).toLocaleDateString('pt-BR')}
  - Dias Restantes no Mês: ${body.daysRemainingInMonth}

⚠️ Há Gargalo (momento crítico futuro)?
${bottleneckText}

💸 Próximas Despesas Agendadas (top 3):
${upcomingExpensesText}

💰 Próximas Entradas Previstas (top 3):
${upcomingIncomesText}

SUA MISSÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analise a situação financeira e explique de forma empática:

1. **Por que o orçamento está nesse valor?** (principal causa)
2. **Quando vai melhorar?** (se aplicável, baseado nas entradas futuras)
3. **O que o usuário deve fazer?** (dica prática e acionável)

TOM E ESTILO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 🤝 **Empático**: Mostre que você entende a situação
- 💪 **Motivador**: Foque em soluções, não em problemas
- 📊 **Claro**: Use números e datas específicas
- 🎯 **Direto**: Vá ao ponto sem rodeios
- ❤️ **Humano**: Fale como um amigo que quer ajudar

REGRAS CRÍTICAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ✅ Identifique a causa PRINCIPAL do orçamento (gargalo? despesa grande? saldo baixo?)
2. ✅ Se houver gargalo, EXPLIQUE qual despesa está causando e quando passa
3. ✅ Se houver entrada futura, mencione QUANDO e QUANTO melhora
4. ✅ Dê uma dica PRÁTICA e ESPECÍFICA
5. ❌ NUNCA julgue negativamente ("você gastou demais")
6. ❌ NUNCA seja alarmista sem necessidade
7. ✅ Celebre se a situação estiver boa!

ESCOLHA DO TOM:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Se HEALTHY (> R$ 50/dia): tone = "celebratory" 🎉
- Se CAUTION (R$ 20-50/dia): tone = "motivational" 💪
- Se DANGER (< R$ 20/dia): tone = "cautious" ⚠️ (mas ainda empático!)
- Se CRÍTICO (< R$ 5/dia): tone = "critical" 🚨 (mas nunca julgador)

FORMATO DE RESPOSTA:
{
  "emoji": "🎉/💪/⚠️/🚨" (escolha baseado no status),
  "title": "Título curto e direto (3-5 palavras)" (ex: "Semana de Aperto", "Tudo Sob Controle", "Reta Final Tranquila"),
  "explanation": "Explicação clara do POR QUÊ o orçamento está assim (3-5 frases, seja específico sobre a causa principal)",
  "whenImproves": "QUANDO melhora e POR QUÊ (se aplicável). Ex: 'No dia 15 quando entra o salário de R$ 3.000'. Se já está bom, omita este campo.",
  "tip": "Dica prática e acionável (1-2 frases). Ex: 'Segure gastos não-essenciais até dia 15'",
  "tone": "celebratory/motivational/cautious/critical"
}

EXEMPLOS DE BOM INSIGHT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Exemplo 1 (CRITICAL):
{
  "emoji": "🛡️",
  "title": "Modo de Sobrevivência",
  "explanation": "Seu orçamento está em R$ 2,86/dia porque você tem o pagamento do aluguel (R$ 1.200) agendado para o dia 14, e precisa garantir que terá esse dinheiro disponível. O sistema está 'guardando' esse valor para você não correr risco.",
  "whenImproves": "A situação melhora drasticamente no dia 15, quando entra seu salário de R$ 3.500. Seu orçamento vai saltar para R$ 85/dia.",
  "tip": "Segure as pontas nos próximos 6 dias. Priorize apenas o essencial. Depois do dia 15, você terá muito mais liberdade.",
  "tone": "critical"
}

Exemplo 2 (HEALTHY):
{
  "emoji": "✨",
  "title": "Tudo Sob Controle",
  "explanation": "Você está com R$ 67/dia porque já passou pelas principais despesas do mês e ainda tem um bom saldo em conta. A reserva mínima está protegida e você tem folga para gastar.",
  "tip": "Aproveite esse momento confortável, mas mantenha o controle. Você está no caminho certo!",
  "tone": "celebratory"
}

RETORNE APENAS UM JSON VÁLIDO (sem markdown):
`;
}
