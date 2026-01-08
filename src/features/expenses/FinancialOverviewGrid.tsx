import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    Wallet,
    PiggyBank,
    CalendarClock,
    ShieldCheck,
    AlertCircle,
    Coins,
    Info
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useFinancialHealth } from "@/features/analytics/hooks/useFinancialHealth";
import { TimelineItem } from "./useFinancialBalance";
import { CashFlowChart } from "./CashFlowChart";

import { TopCategoriesCard } from "./TopCategoriesCard";
import { LargestExpenseCard } from "./LargestExpenseCard";
import { Card } from "@/components/ui/card";


interface FinancialOverviewGridProps {
    householdId?: string;
    userId?: string;
    month: number;
    year: number;
    timeline?: TimelineItem[];
}

// Animation variants para framer-motion
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: custom * 0.1,
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1] as any
        }
    })
};

export function FinancialOverviewGrid({
    householdId,
    userId,
    month,
    year,
    timeline = [],
}: FinancialOverviewGridProps) {
    const health = useFinancialHealth({ householdId, userId });

    // Preparar dados para o donut e top categorias
    const expensesForCategories = useMemo(() => {
        return timeline
            .filter(t => t.type === 'expense')
            .map(t => ({
                category: t.category,
                amount: Math.abs(t.amount)
            }));
    }, [timeline]);

    // Preparar dados para maior despesa
    const expensesWithDetails = useMemo(() => {
        return timeline
            .filter(t => t.type === 'expense')
            .map(t => ({
                id: t.item_id,
                description: t.description,
                amount: t.amount,
                category: t.category,
                paid_at: t.date
            }));
    }, [timeline]);

    if (!health) {
        return <div className="h-64 animate-pulse bg-muted/20 rounded-3xl" />;
    }

    const {
        currentBalance,
        minimumReserve,
        futureCommitments,
        dailyBudget,
        autonomy,
        dailyProjections,
        status,
        alerts
    } = health;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

    // Cor do status
    const statusColor = status === "HEALTHY" ? "text-emerald-500" :
        status === "CAUTION" ? "text-amber-500" : "text-red-500";

    const statusBg = status === "HEALTHY" ? "bg-emerald-500/10" :
        status === "CAUTION" ? "bg-amber-500/10" : "bg-red-500/10";

    // Calcular "Disponível para Gastar" (Current - Reserva - Compromissos)
    // Se for negativo, é 0 (mas mostra alerta)
    // const trulyAvailable = Math.max(0, currentBalance - minimumReserve - futureCommitments);

    // Calcular Saldo Disponível (Saldo Real - Total Agendado)
    const totalScheduled = futureCommitments + (health.flexibleCommitments || 0);
    const availableAfterBills = currentBalance - totalScheduled;

    return (
        <div className="space-y-4">

            {/* 1. STATUS ALERT (Se houver alertas críticos) */}
            {alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    <div className={`p-4 rounded-2xl border ${status === 'DANGER' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
                        }`}>
                        <div className="flex items-start gap-3">
                            <AlertCircle className={`w-5 h-5 mt-0.5 ${status === 'DANGER' ? 'text-red-500' : 'text-amber-500'
                                }`} />
                            <div className="space-y-1">
                                <h4 className={`text-sm font-semibold ${status === 'DANGER' ? 'text-red-600' : 'text-amber-600'
                                    }`}>
                                    Atenção Necessária
                                </h4>
                                {alerts.filter(a => a.severity !== 'info').map((alert, idx) => (
                                    <p key={idx} className="text-xs text-muted-foreground leading-relaxed">
                                        • {alert.message}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 2. MAIN METRICS GRID (Bento Layout) */}
            <div className="grid grid-cols-2 gap-3">

                {/* CARD PRINCIPAL: Orçamento Diário Saudável */}
                <motion.div
                    custom={0} initial="hidden" animate="visible" variants={cardVariants}
                    className="col-span-2"
                >
                    <Card className="border-none shadow-soft p-5 relative overflow-hidden bg-gradient-to-br from-background to-muted/20">
                        <div className={`absolute top-0 left-0 w-1 h-full ${status === 'HEALTHY' ? 'bg-emerald-500' : status === 'CAUTION' ? 'bg-amber-500' : 'bg-red-500'}`} />
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <Wallet className="w-3.5 h-3.5" />
                                        Pode gastar hoje
                                    </span>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="focus:outline-none">
                                                <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-3" align="start">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Lógica de Proteção (Gargalo)</h4>
                                                <p className="text-xs leading-relaxed">
                                                    Para sua segurança, o sistema identifica o dia futuro com <strong>menor saldo previsto</strong>.
                                                </p>
                                                <p className="text-xs leading-relaxed text-muted-foreground">
                                                    Se houver um momento de aperto no futuro (ex: antes de receber), o orçamento de hoje é reduzido para garantir que você não fique no negativo nesse dia.
                                                </p>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBg} ${statusColor}`}>
                                    {status === 'HEALTHY' ? 'Saudável' : status === 'CAUTION' ? 'Atenção' : 'Crítico'}
                                </span>
                            </div>

                            <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-3xl font-bold tracking-tight">
                                    {formatCurrency(dailyBudget)}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground">
                                    / dia
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground mt-1">
                                Considerando compromissos futuros e reserva de {formatCurrency(minimumReserve)}
                            </p>
                        </div>
                    </Card>
                </motion.div>

                {/* CARD: Saldo Real */}
                <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                    <Card className="h-full border-none shadow-soft p-4 flex flex-col justify-between group hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <PiggyBank className="w-3.5 h-3.5 text-primary" />
                                Saldo Real
                            </span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="focus:outline-none">
                                        <Info className="w-3 h-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3" align="end">
                                    <div className="space-y-1.5">
                                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Saldo Atual</h4>
                                        <p className="text-xs leading-relaxed">
                                            Dinheiro disponível agora em suas contas, considerando entradas e saídas efetivadas.
                                        </p>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <span className="text-lg font-bold block mt-2">
                                {formatCurrency(currentBalance)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                Em conta agora
                            </span>
                        </div>
                    </Card>
                </motion.div>

                {/* CARD: Compromissos */}
                <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
                    <Card className="h-full border-none shadow-soft p-4 flex flex-col justify-between group hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                                A Pagar
                            </span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="focus:outline-none">
                                        <Info className="w-3 h-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3" align="end">
                                    <div className="space-y-1.5">
                                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Compromissos Futuros</h4>
                                        <p className="text-xs leading-relaxed">
                                            Soma de todas as despesas agendadas para este mês (Contas, Cartão de Crédito, Pix Agendado).
                                        </p>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <span className="text-lg font-bold block mt-2 text-amber-600">
                                {formatCurrency(futureCommitments + (health.flexibleCommitments || 0))}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                Total Agendado
                            </span>
                        </div>
                    </Card>
                </motion.div>

                {/* CARD: Autonomia */}
                <motion.div custom={2.5} initial="hidden" animate="visible" variants={cardVariants} className="col-span-2">
                    <Card className="border-none shadow-soft p-4 flex items-center justify-between bg-primary/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                <Coins className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Saldo Disponível</h4>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="focus:outline-none">
                                                <Info className="w-3 h-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-3" align="start">
                                            <div className="space-y-1.5">
                                                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Liquidez Real</h4>
                                                <p className="text-xs leading-relaxed">
                                                    Quanto sobra do seu dinheiro hoje se você pagasse todas as contas futuras agora.
                                                </p>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <p className="text-[10px] text-muted-foreground">Livre após todas contas agendadas</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-xl font-bold ${availableAfterBills >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                                {formatCurrency(availableAfterBills)}
                            </span>
                        </div>
                    </Card>
                </motion.div>

                {/* CARD: Autonomia */}
                <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants} className="col-span-2">
                    <Card className="border-none shadow-soft p-4 flex items-center justify-between bg-muted/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Autonomia Estimada</h4>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="focus:outline-none">
                                                <Info className="w-3 h-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-3" align="start">
                                            <div className="space-y-1.5">
                                                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Sobrevivência Financeira</h4>
                                                <p className="text-xs leading-relaxed">
                                                    Quantos dias seu dinheiro dura com base na sua média de gastos variáveis (não recorrentes) dos últimos 7 dias.
                                                </p>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-bold">{autonomy > 90 ? '+90' : Math.floor(autonomy)}</span>
                                    <span className="text-sm text-muted-foreground">dias</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-muted-foreground block">
                                Se manter média variável de
                            </span>
                            <span className="text-xs font-medium">
                                {formatCurrency(health.averageDailySpend)}/dia
                            </span>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* 3. CHART: PROJECTED BALANCE (Composed) */}
            <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
            >
                <Card className="border-none shadow-soft h-[240px] flex flex-col pt-4">
                    <div className="px-5 mb-1 flex items-start justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                Projeção de Saldo
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                Linha sólida: Realista | Pontilhada: Meta
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="focus:outline-none">
                                            <Info className="w-3 h-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3" align="start">
                                        <div className="space-y-1.5">
                                            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Futuro Financeiro</h4>
                                            <p className="text-xs leading-relaxed">
                                                Simulação dia a dia do seu saldo até o fim do mês, considerando todas as entradas e saídas previstas.
                                            </p>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-bold block leading-none">
                                {formatCurrency(health.projectedEndBalance)}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                                Final do Mês
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0 px-1 pb-1">
                        <CashFlowChart
                            dailyProjections={dailyProjections}
                            variant="composed-projection"
                        />
                    </div>
                </Card>
            </motion.div>

            {/* 4. CHART: DAILY POTENTIAL (New) */}
            <motion.div
                custom={4.5}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
            >
                <Card className="border-none shadow-soft h-[240px] flex flex-col pt-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Coins className="w-24 h-24 text-primary" />
                    </div>
                    <div className="px-5 mb-1 flex items-start justify-between relative z-10">
                        <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                Poder de Compra Diário
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                Evolução do seu orçamento se você economizar
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="focus:outline-none">
                                            <Info className="w-3 h-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3" align="start">
                                        <div className="space-y-1.5">
                                            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Recompensa por Economia</h4>
                                            <p className="text-xs leading-relaxed">
                                                Este gráfico simula o futuro: se você pagar todas as contas agendadas e <strong>não gastar nada extra</strong> até um certo dia, quanto seu orçamento diário aumentará?
                                            </p>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0 px-1 pb-1 relative z-10">
                        <CashFlowChart
                            dailyProjections={dailyProjections}
                            variant="potential-daily"
                        />
                    </div>
                </Card>
            </motion.div>

            {/* 4. BREAKDOWN CARDS */}
            {/* 4. BREAKDOWN: Entradas vs Saídas (Full Width) */}
            <motion.div
                custom={5}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
            >
                <Card className="border-none shadow-soft h-[280px] flex flex-col p-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Entradas vs Saídas
                        </span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="focus:outline-none">
                                    <Info className="w-3 h-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" align="end">
                                <div className="space-y-1.5">
                                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Fluxo Diário</h4>
                                    <p className="text-xs leading-relaxed">
                                        Volume de dinheiro entrando (verde) e saindo (vermelho) a cada dia do mês.
                                    </p>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <CashFlowChart
                            timeline={timeline}
                            year={year}
                            month={month}
                            variant="bar-flow"
                        />
                    </div>
                </Card>
            </motion.div>

            {/* 5. TOP CATEGORIAS & MAIOR DESPESA */}
            <div className="grid grid-cols-2 gap-3">
                <motion.div
                    custom={6}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className={expensesWithDetails.length > 0 ? "col-span-1" : "col-span-2"}
                >
                    <Card className="border-none shadow-soft h-[220px] p-4">
                        <TopCategoriesCard expenses={expensesForCategories} />
                    </Card>
                </motion.div>

                {expensesWithDetails.length > 0 && (
                    <motion.div
                        custom={7}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        className="col-span-1"
                    >
                        <LargestExpenseCard expenses={expensesWithDetails} />
                    </motion.div>
                )}
            </div>

        </div>
    );
}
