// Supabase Edge Function to process receipt images using GPT-4o-mini Vision
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

interface ShoppingListItem {
    id: string;
    name: string;
}

interface ProcessReceiptRequest {
    image_base64: string;
    household_id: string;
    shopping_list?: ShoppingListItem[]; // Optional list to match against
}

interface ReceiptItem {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category: "mercado" | "casa" | "lazer" | "farmacia" | "outros" | "limpeza";
    matched_shopping_item_id?: string | null; // ID from the shopping list if matched
}

interface ReceiptData {
    establishment_name: string;
    total_amount: number;
    purchase_date: string; // YYYY-MM-DD
    items: ReceiptItem[];
}

// Helper function to decode JWT payload (Same as process-statement)
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
        const { image_base64, household_id, shopping_list } = (await req.json()) as ProcessReceiptRequest;

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

        // 5. Call OpenAI GPT-4o-mini with Semantic Matching Logic
        const systemPrompt = `Você é um especialista em ler notas fiscais (NFC-e, SAT).
    Extraia os dados com EXTREMA precisão.
    
    Além de extrair, você deve COMPARAR cada item extraído com a 'Lista de Compras' fornecida pelo usuário.
    Se um item da nota corresponder SEMANTICAMENTE a um item da lista (ex: lista tem 'frango', note tem 'coxa e sobrecoxa'), preencha 'matched_shopping_item_id' com o ID do item da lista.
    Se não houver correspondência, deixe 'matched_shopping_item_id' como null.

    Retorne APENAS um JSON válido seguindo estritamente esta estrutura:
    {
      "establishment_name": "Nome do Local",
      "total_amount": 0.00,
      "purchase_date": "YYYY-MM-DD",
      "items": [
        { 
            "name": "Nome na Nota", 
            "quantity": 1, 
            "unit_price": 0.00, 
            "total_price": 0.00, 
            "category": "mercado" | "limpeza" | "farmacia" | "outros",
            "matched_shopping_item_id": "id-da-lista-ou-null"
        }
      ]
    }
    Categorias permitidas: 'mercado', 'limpeza', 'farmacia', 'casa', 'lazer', 'outros'.
    Se a data não for legível, use a data de hoje.`;

        // Format shopping list for the prompt
        let shoppingListText = "Nenhuma lista de compras fornecida.";
        if (shopping_list && shopping_list.length > 0) {
            shoppingListText = "Lista de Compras para comparação:\n" +
                shopping_list.map(i => `- ID: ${i.id}, Nome: ${i.name}`).join("\n");
        }

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
                            { type: "text", text: `Analise esta nota fiscal. \n\n${shoppingListText}` },
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
                max_tokens: 2000,
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
        let receiptData: ReceiptData;
        try {
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
            receiptData = JSON.parse(jsonMatch[1] || content);
        } catch (e) {
            console.error("JSON Parse Error:", content);
            throw new Error("AI returned invalid JSON");
        }

        // 7. Return Result
        return new Response(JSON.stringify(receiptData), {
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
