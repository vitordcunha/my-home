import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { FinancialInsight } from "@/features/analytics/hooks/useFinancialInsight";

interface FinancialInsightSheetProps {
    isOpen: boolean;
    onClose: () => void;
    insight: FinancialInsight | null;
    isLoading: boolean;
    error: string | null;
}

export function FinancialInsightSheet({
    isOpen,
    onClose,
    insight,
    isLoading,
    error,
}: FinancialInsightSheetProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent
                side="bottom"
                className="h-[85vh] p-0 glass border-t"
            >
                <div className="h-full flex flex-col">
                    {/* Header Ultra Minimalista */}
                    <div className="relative px-6 pt-6 pb-4">
                        {/* Logo e Título Simplificados */}
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-foreground">
                                    Insight Financeiro
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-safe">
                        <AnimatePresence mode="wait">
                            {isLoading && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-8 pb-8 pt-2"
                                >
                                    {/* Skeleton: Emoji + Title */}
                                    <div className="text-center space-y-4 pt-8">
                                        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 animate-pulse"></div>
                                        <div className="w-40 h-6 mx-auto rounded-lg bg-muted/50 animate-pulse"></div>
                                    </div>

                                    {/* Skeleton: Explanation */}
                                    <div className="space-y-3">
                                        <div className="w-16 h-3 bg-muted/50 rounded animate-pulse"></div>
                                        <div className="space-y-2">
                                            <div className="w-full h-3.5 bg-muted/50 rounded animate-pulse"></div>
                                            <div className="w-5/6 h-3.5 bg-muted/50 rounded animate-pulse"></div>
                                            <div className="w-4/6 h-3.5 bg-muted/50 rounded animate-pulse"></div>
                                        </div>
                                    </div>

                                    {/* Skeleton: When Improves */}
                                    <div className="space-y-3">
                                        <div className="w-24 h-3 bg-muted/50 rounded animate-pulse"></div>
                                        <div className="space-y-2">
                                            <div className="w-full h-3.5 bg-primary/10 rounded animate-pulse"></div>
                                            <div className="w-3/4 h-3.5 bg-primary/10 rounded animate-pulse"></div>
                                        </div>
                                    </div>

                                    {/* Skeleton: Tip */}
                                    <div className="space-y-3">
                                        <div className="w-12 h-3 bg-muted/50 rounded animate-pulse"></div>
                                        <div className="space-y-2">
                                            <div className="w-full h-3.5 bg-muted/50 rounded animate-pulse"></div>
                                            <div className="w-4/5 h-3.5 bg-muted/50 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {error && !isLoading && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-center justify-center h-full gap-3 text-center p-6"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                                        <X className="w-6 h-6 text-destructive" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-1">
                                            Não foi possível gerar o insight
                                        </h3>
                                        <p className="text-xs text-muted-foreground max-w-xs">
                                            {error}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {insight && !isLoading && !error && (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-8 pb-8 pt-2"
                                >
                                    {/* Emoji + Title - Mais limpo */}
                                    <div className="text-center space-y-4 pt-8">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{
                                                delay: 0.1,
                                                type: "spring",
                                                stiffness: 260,
                                                damping: 20
                                            }}
                                            className="text-5xl leading-none"
                                        >
                                            {insight.emoji}
                                        </motion.div>
                                        <motion.h3
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-xl font-semibold text-foreground tracking-tight"
                                        >
                                            {insight.title}
                                        </motion.h3>
                                    </div>

                                    {/* Explanation - Sem bordas, mais clean */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                        className="space-y-2"
                                    >
                                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Análise
                                        </h4>
                                        <p className="text-sm leading-relaxed text-foreground/80">
                                            {insight.explanation}
                                        </p>
                                    </motion.div>

                                    {/* When Improves - Destaque sutil */}
                                    {insight.whenImproves && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="space-y-2"
                                        >
                                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                Quando Melhora
                                            </h4>
                                            <div className="pl-3 border-l-2 border-primary/30">
                                                <p className="text-sm leading-relaxed text-primary">
                                                    {insight.whenImproves}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Tip - Design ainda mais clean */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.35 }}
                                        className="space-y-2"
                                    >
                                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            💡 Dica
                                        </h4>
                                        <p className="text-sm leading-relaxed text-foreground">
                                            {insight.tip}
                                        </p>
                                    </motion.div>

                                    {/* Footer note - Mais discreto */}
                                    <p className="text-[10px] text-center text-muted-foreground/60 pt-6 pb-2">
                                        Análise gerada por IA baseada nos seus dados financeiros
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
