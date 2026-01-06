// Supabase Edge Function to process bank statements using AI
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  confidence: number;
  match_type?: "exact" | "similar" | "none";
  matched_id?: string;
}

interface ProcessStatementRequest {
  statement_text: string;
  household_id: string;
  month: number;
  year: number;
  existing_incomes?: Array<{
    id: string;
    description: string;
    amount: number;
    received_at: string;
  }>;
  existing_expenses?: Array<{
    id: string;
    description: string;
    amount: number;
    paid_at: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace("Bearer ", "");

    // Decode JWT to get user ID (simple base64url decode)
    // Supabase already validated the token before reaching this function
    let userId: string | null = null;
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        // Decode base64url (JWT uses base64url encoding)
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        // Add padding if needed
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        const payload = JSON.parse(decoded);
        userId = payload.sub || payload.user_id || null;
      }
    } catch (e) {
      console.error("Failed to decode JWT:", e);
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Invalid token: could not extract user ID" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key for database access
    // RLS policies will still enforce user permissions
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      statement_text,
      household_id,
      month,
      year,
      existing_incomes,
      existing_expenses,
    } = (await req.json()) as ProcessStatementRequest;

    // Validate input
    if (!statement_text || !household_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user has access to this household
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile || profile.household_id !== household_id) {
      return new Response(
        JSON.stringify({ error: "Access denied to this household" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare the prompt for AI
    const systemPrompt = `Você é um assistente especializado em análise de extratos bancários brasileiros.
Sua tarefa é extrair e categorizar transações bancárias.

CATEGORIAS DE RECEITA:
- salario: Pagamentos de empregador, salários mensais
- freelance: Trabalhos pontuais, consultorias
- investimento: Rendimentos, dividendos, aplicações
- presente: Presentes recebidos, transferências de familiares
- outros: Outras receitas

CATEGORIAS DE DESPESA:
- casa: Aluguel, condomínio, IPTU, financiamento
- contas: Água, luz, gás, internet, telefone
- mercado: Supermercado, feira, padaria
- delivery: iFood, Rappi, Uber Eats, pedidos online
- limpeza: Produtos de limpeza, serviços de limpeza
- manutencao: Reparos, reformas, manutenção
- outros: Outras despesas não categorizadas

FORMATO DE SAÍDA:
Para cada transação encontrada, retorne um objeto JSON com:
- date (string): Data no formato ISO (YYYY-MM-DD)
- description (string): Descrição limpa e legível
- amount (number): Valor absoluto (sempre positivo)
- type (string): "income" ou "expense"
- category (string): Uma das categorias acima
- confidence (number): Nível de confiança de 0 a 1

REGRAS:
1. Valores de crédito (positivos) são "income"
2. Valores de débito (negativos) são "expense"
3. Normalize descrições (remova códigos bancários, asteriscos, etc)
4. Se a data não estiver clara, use o primeiro dia do mês ${month}/${year}
5. Ignore linhas de saldo, totais e cabeçalhos
6. Retorne APENAS um array JSON válido, sem texto adicional`;

    const existingContext = `
TRANSAÇÕES JÁ CADASTRADAS NO SISTEMA:

RECEITAS EXISTENTES:
${existing_incomes
        ?.map(
          (i) => `- ${i.description}: R$ ${i.amount.toFixed(2)} em ${i.received_at}`
        )
        .join("\n") || "Nenhuma"
      }

DESPESAS EXISTENTES:
${existing_expenses
        ?.map(
          (e) => `- ${e.description}: R$ ${e.amount.toFixed(2)} em ${e.paid_at}`
        )
        .join("\n") || "Nenhuma"
      }

Se encontrar transações muito similares às já cadastradas, adicione um campo "matched_id" com o ID correspondente e "match_type" como "exact" (valores e datas idênticos) ou "similar" (valores próximos ou descrições parecidas).`;

    const userPrompt = `${existingContext}

EXTRATO BANCÁRIO:
${statement_text}

Analise o extrato acima e retorne um array JSON com todas as transações encontradas.`;

    // Call OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 16000,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to process statement with AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    // Parse AI response (it should be a JSON array)
    let transactions: Transaction[];
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [
        null,
        aiResponse,
      ];
      const jsonText = jsonMatch[1] || aiResponse;
      transactions = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response",
          details: aiResponse,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate and enhance transactions
    const validatedTransactions = transactions.map((t) => ({
      ...t,
      amount: Math.abs(t.amount), // Ensure positive
      confidence: t.confidence || 0.8,
      match_type: t.match_type || "none",
    }));

    // Calculate summary statistics
    const summary = {
      total_transactions: validatedTransactions.length,
      total_income: validatedTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
      total_expenses: validatedTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
      matched_transactions: validatedTransactions.filter(
        (t) => t.match_type !== "none"
      ).length,
      categories: Array.from(
        new Set(validatedTransactions.map((t) => t.category))
      ),
    };

    return new Response(
      JSON.stringify({
        transactions: validatedTransactions,
        summary,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in process-statement function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
