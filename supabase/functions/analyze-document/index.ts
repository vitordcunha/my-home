// Supabase Edge Function to analyze documents using GPT-4o-mini Vision
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

// Initialize environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AnalyzeDocumentRequest {
    image_base64: string;
}

interface AnalyzedDocument {
    title: string;
    category: 'bill' | 'manual' | 'contract' | 'identity' | 'other';
    keywords: string[];
    summary: string;
    expiry_date?: string | null; // YYYY-MM-DD
}

// Helper function to decode JWT payload
function decodeJWT(token: string): { sub?: string; role?: string } | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Auth Validation 
        const authHeader = req.headers.get("Authorization");
        let userId: string | null = null;
        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const payload = decodeJWT(token);
            if (payload?.sub) userId = payload.sub;
        }

        if (!userId) {
            const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
            const { data: { user } } = await supabaseClient.auth.getUser(authHeader?.replace("Bearer ", "") ?? "");
            if (user) userId = user.id;
        }

        if (!userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 2. Parse Body
        const { image_base64 } = (await req.json()) as AnalyzeDocumentRequest;

        if (!image_base64) {
            return new Response(JSON.stringify({ error: "Missing image data" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 3. OpenAI Setup
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiApiKey) {
            return new Response(JSON.stringify({ error: "Server misconfiguration: No AI Key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 4. Clean Base64 if needed
        const cleanBase64 = image_base64.replace(/^data:image\/[a-z]+;base64,/, "");

        // 5. Call OpenAI GPT-4o-mini
        const systemPrompt = `Você é um assistente pessoal inteligente especializado em organizar documentos domésticos.
    Analise a imagem do documento fornecida.
    Extraia as informações solicitadas em JSON.
    
    Campos:
    - title: Um título curto e descritivo (ex: "Conta de Luz Enel Jan 2026", "Manual Geladeira Brastemp").
    - category: Escolha uma das categorias: 'bill' (contas), 'manual' (manuais), 'contract' (contratos), 'identity' (documentos pessoais), 'other' (outros).
    - keywords: Lista de 5 a 10 palavras-chave relevantes para busca posterior. Inclua nome da empresa, tipo de serviço, datas importantes, nomes de pessoas citadas.
    - summary: Um resumo de uma frase do que é este documento.
    - expiry_date: Se houver uma data de vencimento ou validade CLARA, extraia no formato YYYY-MM-DD. Senão, null.

    Retorne APENAS o JSON válido.`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analise este documento." },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${cleanBase64}`,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.1
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenAI Error:", err);
            throw new Error("Failed to process image with AI");
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // 6. Parse JSON from AI response
        let result: AnalyzedDocument;
        try {
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
            result = JSON.parse(jsonMatch[1] || content);
        } catch (e) {
            console.error("JSON Parse Error:", content);
            throw new Error("AI returned invalid JSON");
        }

        // 7. Return Result
        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
