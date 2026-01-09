import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface FinancialInsight {
    emoji: string;
    title: string;
    explanation: string;
    whenImproves?: string;
    tip: string;
    tone: "celebratory" | "motivational" | "cautious" | "critical";
}

interface GenerateInsightParams {
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

interface CachedInsight {
    insight: FinancialInsight;
    timestamp: number;
    fingerprint: string;
}

// Função para gerar fingerprint da situação financeira
function generateFingerprint(params: GenerateInsightParams): string {
    const {
        dailyBudget,
        currentBalance,
        status,
        bottleneckInfo,
        insightType = "general",
        chartData,
    } = params;

    // Para insights de gráfico, incluir dados do chart no fingerprint
    if (insightType === "chart" && chartData) {
        return [
            insightType,
            Math.floor(chartData.currentValue),
            Math.floor(chartData.futureAverage),
            chartData.trend,
            chartData.peakDay || 0,
            new Date().toISOString().split('T')[0], // Dia atual
            new Date().getHours(), // Hora atual
        ].join('_');
    }

    // Para insights gerais
    return [
        insightType,
        Math.floor(dailyBudget), // Arredonda para baixo
        Math.floor(currentBalance / 100) * 100, // Agrupa em centenas
        status,
        bottleneckInfo?.hasBottleneck ? '1' : '0',
        bottleneckInfo?.daysUntilBottleneck || 0,
        new Date().toISOString().split('T')[0], // Dia atual
        new Date().getHours(), // Hora atual (muda a cada hora)
    ].join('_');
}

// Constantes de cache
const CACHE_PREFIX = "financial_insight_";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas
const COOLDOWN_PERIOD = 30 * 1000; // 30 segundos
const LAST_CALL_KEY = "last_insight_api_call";

export function useFinancialInsight() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Cache em memória para a sessão atual
    const sessionCache = useRef<Map<string, FinancialInsight>>(new Map());

    const generateInsight = async (params: GenerateInsightParams): Promise<FinancialInsight | null> => {
        const fingerprint = generateFingerprint(params);
        const cacheKey = CACHE_PREFIX + fingerprint;

        // 1. Verificar cache em memória (React state) - instantâneo
        if (sessionCache.current.has(fingerprint)) {
            console.log("✅ Cache hit (memory):", fingerprint);
            return sessionCache.current.get(fingerprint)!;
        }

        // 2. Verificar localStorage
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { insight, timestamp }: CachedInsight = JSON.parse(cached);
                const age = Date.now() - timestamp;

                // Se ainda está válido
                if (age < CACHE_TTL) {
                    console.log(`✅ Cache hit (localStorage) - ${Math.floor(age / 1000)}s old`);
                    sessionCache.current.set(fingerprint, insight);
                    return insight;
                }

                // Cache expirado - limpar
                localStorage.removeItem(cacheKey);
            }
        } catch (err) {
            console.error("Error reading cache:", err);
        }

        // 3. Verificar cooldown (rate limiting suave)
        try {
            const lastCallStr = localStorage.getItem(LAST_CALL_KEY);
            if (lastCallStr) {
                const lastCall = parseInt(lastCallStr, 10);
                const timeSinceLastCall = Date.now() - lastCall;

                if (timeSinceLastCall < COOLDOWN_PERIOD) {
                    const secondsRemaining = Math.ceil((COOLDOWN_PERIOD - timeSinceLastCall) / 1000);

                    toast({
                        title: "Aguarde um momento",
                        description: `Você poderá gerar um novo insight em ${secondsRemaining}s`,
                        duration: 3000,
                    });

                    // Retornar null para não mostrar nada
                    return null;
                }
            }
        } catch (err) {
            console.error("Error checking cooldown:", err);
        }

        // 4. Nenhum cache válido - chamar API
        setIsLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error("Usuário não autenticado");
            }

            console.log("🌐 Calling OpenAI API for new insight...");

            // Registrar timestamp da chamada
            localStorage.setItem(LAST_CALL_KEY, Date.now().toString());

            const response = await supabase.functions.invoke<FinancialInsight>(
                "generate-financial-insight",
                {
                    body: params,
                }
            );

            if (response.error) {
                throw response.error;
            }

            if (!response.data) {
                throw new Error("Nenhum dado retornado");
            }

            const insight = response.data;

            // 5. Salvar em cache
            try {
                // Cache em memória
                sessionCache.current.set(fingerprint, insight);

                // Cache em localStorage
                const cacheData: CachedInsight = {
                    insight,
                    timestamp: Date.now(),
                    fingerprint,
                };
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));

                console.log("✅ Insight cached successfully");
            } catch (err) {
                console.error("Error saving cache:", err);
                // Não falhar se o cache não funcionar
            }

            return insight;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erro ao gerar insight";
            setError(errorMessage);
            console.error("Error generating financial insight:", err);

            toast({
                title: "Erro ao gerar insight",
                description: errorMessage,
                variant: "destructive",
                duration: 4000,
            });

            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Função para limpar todo o cache (útil para debug/admin)
    const clearCache = () => {
        sessionCache.current.clear();

        // Limpar todos os insights do localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });

        localStorage.removeItem(LAST_CALL_KEY);

        console.log("🗑️ All insight cache cleared");
    };

    return {
        generateInsight,
        clearCache,
        isLoading,
        error,
    };
}
