import { useMemo } from "react";
import { useFinancialBalance } from "@/features/expenses/useFinancialBalance";
import { useExpensesQuery } from "@/features/expenses/useExpensesQuery";
import { useIncomesQuery } from "@/features/expenses/useIncomesQuery";
import { useFinancialSettings } from "./useFinancialSettings";
import {
    startOfDay,
    endOfMonth,
    differenceInDays,
    isSameMonth,
    isAfter,
    isBefore,
    getDay,
    startOfMonth,
    eachDayOfInterval,
    format,
} from "date-fns";
import { ExpensePriority } from "@/features/expenses/types";

export type FinancialHealthStatus = "HEALTHY" | "CAUTION" | "DANGER";

export interface DailyProjection {
    date: Date;
    dateLabel: string; // "1", "2", "3"...
    projectedBalance: number;
    budgetedBalance: number; // Se gastar o orçamento diário
    hasIncome: boolean;
    hasExpense: boolean;
    incomeAmount: number;
    expenseAmount: number;
}

export interface FinancialAlert {
    type: "low_balance" | "negative_balance" | "over_budget" | "insufficient_for_commitments";
    severity: "info" | "warning" | "critical";
    message: string;
    actionable: boolean;
    affectedDate?: Date;
}

export interface FinancialHealth {
    // Saldo e orçamento
    currentBalance: number; // Dinheiro disponível agora
    minimumReserve: number; // Colchão intocável
    availableBalance: number; // currentBalance - minimumReserve
    futureCommitments: number; // Total de despesas futuras (P1+P2)
    flexibleCommitments: number; // Total de despesas futuras (P3+P4)
    dailyBudget: number; // Quanto pode gastar por dia
    weekendDailyBudget: number; // Quanto pode gastar em fins de semana

    // Projeções
    daysRemaining: number;
    effectiveDaysRemaining: number; // Considerando peso de fins de semana
    projectedEndBalance: number; // Saldo projetado no fim do mês
    autonomy: number; // Quantos dias o dinheiro atual dura

    // Status
    status: FinancialHealthStatus;
    alerts: FinancialAlert[];

    // Detalhes (para cards)
    realizedIncome: number;
    projectedIncome: number;
    realizedExpenses: number;
    projectedExpenses: number;
    averageDailySpend: number;
    monthProgress: number; // 0 to 1

    // Gráfico de projeção diária
    dailyProjections: DailyProjection[];

    // Breakdown de compromissos
    commitmentsByPriority: {
        P1: number;
        P2: number;
        P3: number;
        P4: number;
    };
}

interface UseFinancialHealthProps {
    householdId?: string;
    userId?: string;
    weekendWeight?: number;
}

export function useFinancialHealth({ householdId, weekendWeight: overrideWeekendWeight }: UseFinancialHealthProps) {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const { data: balanceData } = useFinancialBalance(householdId, currentMonth, currentYear);
    const { data: expenses } = useExpensesQuery(householdId);
    const { data: incomes } = useIncomesQuery(householdId);
    const { data: settings } = useFinancialSettings(householdId);

    return useMemo(() => {
        if (!balanceData || !expenses || !incomes || !settings) return null;

        const now = new Date();
        const todayStart = startOfDay(now);
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const totalDaysInMonth = parseInt(monthEnd.getDate().toString());
        const daysRemaining = Math.max(1, differenceInDays(monthEnd, todayStart) + 1);
        const monthProgress = (totalDaysInMonth - daysRemaining) / totalDaysInMonth;

        // Weekend weight from settings or override
        const weekendWeight = overrideWeekendWeight ?? (settings.weekend_weight || 1.5);

        // --- 1. CALCULAR PESOS E DIAS EFETIVOS ---
        const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        let totalMonthWeights = 0;
        let effectiveDaysRemaining = 0;

        allDaysInMonth.forEach((date) => {
            const dayOfWeek = getDay(date);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const weight = isWeekend ? weekendWeight : 1;

            totalMonthWeights += weight;

            if (!isBefore(date, todayStart)) {
                effectiveDaysRemaining += weight;
            }
        });

        effectiveDaysRemaining = Math.max(0.01, effectiveDaysRemaining);

        // --- 2. SEPARAR RECEITAS E DESPESAS (PASSADAS vs FUTURAS) ---
        const currentMonthIncomes = incomes.filter((i) =>
            isSameMonth(new Date(i.received_at || i.created_at || new Date()), today)
        );

        const realizedIncomes = currentMonthIncomes.filter(
            (i) => !isAfter(new Date(i.received_at || i.created_at || new Date()), now)
        );
        const totalRealizedIncome = realizedIncomes.reduce((sum, i) => sum + Number(i.amount), 0);

        const futureIncomes = currentMonthIncomes.filter((i) =>
            isAfter(new Date(i.received_at || i.created_at || new Date()), now)
        );
        const totalProjectedIncome = futureIncomes.reduce((sum, i) => sum + Number(i.amount), 0);

        // Despesas do mês
        const currentMonthExpenses = expenses.filter((e) =>
            isSameMonth(new Date(e.paid_at || e.created_at || new Date()), today)
        );

        const realizedExpenses = currentMonthExpenses.filter(
            (e) => !isAfter(new Date(e.paid_at || e.created_at || new Date()), now)
        );
        const totalRealizedExpenses = realizedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        const futureExpenses = currentMonthExpenses.filter((e) =>
            isAfter(new Date(e.paid_at || e.created_at || new Date()), now)
        );

        // --- 3. SEPARAR COMPROMISSOS POR PRIORIDADE ---
        const commitmentsByPriority = {
            P1: 0,
            P2: 0,
            P3: 0,
            P4: 0,
        };

        futureExpenses.forEach((e) => {
            const priority = (e.priority as ExpensePriority) || "P3";
            commitmentsByPriority[priority] += Number(e.amount);
        });

        const futureCommitments = commitmentsByPriority.P1 + commitmentsByPriority.P2;
        const flexibleCommitments = commitmentsByPriority.P3 + commitmentsByPriority.P4;
        const totalProjectedExpenses = futureCommitments + flexibleCommitments;

        // --- 4. CALCULAR SALDO ATUAL E ORÇAMENTO DIÁRIO ---
        const openingBalance = balanceData?.opening_balance || 0;
        const currentBalance = openingBalance + totalRealizedIncome - totalRealizedExpenses;

        // Calcular reserva mínima
        let minimumReserve = 0;
        if (settings.minimum_reserve_type === "percentage") {
            // Porcentagem da renda total do mês
            const totalMonthIncome = totalRealizedIncome + totalProjectedIncome;
            minimumReserve = (totalMonthIncome * settings.minimum_reserve_value) / 100;
        } else {
            // Valor fixo
            minimumReserve = settings.minimum_reserve_value;
        }

        const availableBalance = currentBalance - minimumReserve;

        // LÓGICA DE GARGALO (The Bottleneck Method)
        // Não importa se sobra dinheiro no fim do mês, se no dia 15 falta dinheiro.
        // O orçamento diário deve ser limitado pelo "vale" mais fundo do gráfico de fluxo de caixa futuro.

        // 1. Calcular orçamento padrão (visão otimista / global)
        const budgetableBalanceGlobal = Math.max(0, availableBalance - futureCommitments - flexibleCommitments);
        const standardDailyBudget = budgetableBalanceGlobal / Math.max(1, effectiveDaysRemaining);

        // 2. Encontrar o gargalo (o dia futuro onde o saldo é menor)
        let daysUntilBottleneck = 0;

        let runningSimulatedBalance = currentBalance;

        // Simular dia a dia para encontrar o vale
        // Precisamos reconstruir a projeção aqui pois 'dailyProjections' ainda não existe nesse ponto do código
        // (Seria ideal refatorar, mas vamos calcular inline para não quebrar a ordem do hook)
        const sortedFutureTransactions = [
            ...futureIncomes.map(i => ({ date: new Date(i.received_at || i.created_at || new Date()), amount: Number(i.amount), type: 'income' })),
            ...futureExpenses.map(e => ({ date: new Date(e.paid_at || e.created_at || new Date()), amount: Number(e.amount), type: 'expense' }))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        let lowestBalancePoint = Infinity;

        // Verificar saldo ao final de cada dia até o fim do mês
        let tempDate = new Date(todayStart);
        let accumulatedWeight = 0;

        // Iterar até o fim do mês
        while (tempDate <= monthEnd) {
            // Somar transações do dia
            const dayTransactions = sortedFutureTransactions.filter(t => isSameMonth(t.date, tempDate) && t.date.getDate() === tempDate.getDate());
            const dayNet = dayTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

            runningSimulatedBalance += dayNet;

            // Peso do dia (fds gasta mais)
            const dayOfWeek = getDay(tempDate);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const weight = isWeekend ? weekendWeight : 1;
            accumulatedWeight += weight;

            // Identificar se esse é o novo "ponto mais baixo" antes de uma entrada salvadora
            // Subtraímos a reserva pois ela não deve ser tocada
            const availableAtThisPoint = runningSimulatedBalance - minimumReserve;

            if (availableAtThisPoint < lowestBalancePoint) {
                lowestBalancePoint = availableAtThisPoint;
                daysUntilBottleneck = accumulatedWeight;
            }

            // Avançar um dia
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // 3. O "bottleneck budget" é: Quanto posso gastar por dia até chegar nesse ponto baixo zerado?
        // Se o ponto mais baixo é 500 reais daqui a 10 dias, posso gastar 50 por dia.
        // Se o ponto mais baixo é -100 reais, meu budget é Zero (e já estou em perigo).

        // Garantir que não seja negativo
        const safeLiquidity = Math.max(0, lowestBalancePoint);

        // Se já passamos do gargalo (ex: fim do mês), usa-se o effectiveDaysRemaining total
        const daysToConsider = lowestBalancePoint === Infinity ? effectiveDaysRemaining : daysUntilBottleneck;

        const bottleneckDailyBudget = safeLiquidity / Math.max(1, daysToConsider);

        // O orçamento final é o MENOR entre o global (se tudo der certo) e o do gargalo (curto prazo)
        // Isso impede que future income "financie" o presente se houver um vale no meio
        const dailyBudget = Math.min(standardDailyBudget, bottleneckDailyBudget);
        const weekendDailyBudget = dailyBudget * weekendWeight;

        // --- 5. CALCULAR AUTONOMIA (QUANTOS DIAS O DINHEIRO DURA) ---
        const last7DaysExpenses = expenses.filter((e) => {
            const d = new Date(e.paid_at || e.created_at || new Date());
            const sevenDaysAgo = new Date(todayStart);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return isAfter(d, sevenDaysAgo) && isBefore(d, now);
        });

        const last7DaysTotal = last7DaysExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const avgDailySpend = last7DaysTotal / 7;
        const autonomy = avgDailySpend > 0 ? currentBalance / avgDailySpend : 999;

        // --- 6. PROJEÇÃO DIÁRIA (PARA O GRÁFICO) ---
        const dailyProjections: DailyProjection[] = [];

        let runningBalance = currentBalance;
        let budgetedBalance = currentBalance;

        const remainingDays = eachDayOfInterval({
            start: todayStart,
            end: monthEnd,
        });

        remainingDays.forEach((date) => {
            const dayOfWeek = getDay(date);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const todayWeight = isWeekend ? weekendWeight : 1;
            const todayBudget = dailyBudget * todayWeight;

            // Receitas deste dia
            const dayIncomes = futureIncomes.filter((i) => {
                const incomeDate = startOfDay(new Date(i.received_at || i.created_at || new Date()));
                return incomeDate.getTime() === date.getTime();
            });
            const dayIncomeAmount = dayIncomes.reduce((sum, i) => sum + Number(i.amount), 0);

            // Despesas deste dia
            const dayExpenses = futureExpenses.filter((e) => {
                const expenseDate = startOfDay(new Date(e.paid_at || e.created_at || new Date()));
                return expenseDate.getTime() === date.getTime();
            });
            const dayExpenseAmount = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

            // Atualizar saldo projetado
            runningBalance = runningBalance + dayIncomeAmount - dayExpenseAmount;

            // Atualizar saldo orçado (se gastar o budget todo dia)
            budgetedBalance = budgetedBalance + dayIncomeAmount - dayExpenseAmount - todayBudget;

            dailyProjections.push({
                date,
                dateLabel: format(date, "d"),
                projectedBalance: runningBalance,
                budgetedBalance: budgetedBalance,
                hasIncome: dayIncomeAmount > 0,
                hasExpense: dayExpenseAmount > 0,
                incomeAmount: dayIncomeAmount,
                expenseAmount: dayExpenseAmount,
            });
        });

        const projectedEndBalance = dailyProjections[dailyProjections.length - 1]?.projectedBalance || currentBalance;

        // --- 7. CALCULAR STATUS E ALERTAS ---
        const alerts: FinancialAlert[] = [];
        let status: FinancialHealthStatus = "HEALTHY";

        // Alerta 1: Saldo insuficiente para compromissos obrigatórios
        if (availableBalance < futureCommitments) {
            alerts.push({
                type: "insufficient_for_commitments",
                severity: "critical",
                message: `Saldo insuficiente para cobrir compromissos essenciais (faltam R$ ${(futureCommitments - availableBalance).toFixed(2)})`,
                actionable: true,
            });
            status = "DANGER";
        }

        // Alerta 2: Saldo vai ficar negativo em algum dia futuro
        // Alerta 2: Saldo vai ficar negativo ou abaixo do limite em algum dia futuro
        const lowBalanceThreshold = settings.alert_low_balance_threshold || minimumReserve;

        const criticalDays = dailyProjections.filter(
            (day) => day.projectedBalance < lowBalanceThreshold
        );

        if (criticalDays.length > 0) {
            alerts.push({
                type: "low_balance",
                severity: "warning",
                message: `Atenção: Seu saldo cairá abaixo de R$ ${lowBalanceThreshold} no dia ${format(criticalDays[0].date, 'dd/MM')}`,
                actionable: true,
                affectedDate: criticalDays[0].date,
            });
            if (status !== "DANGER") status = "CAUTION";
        }

        // Alerta 3: Gastando acima do orçamento diário
        if (avgDailySpend > dailyBudget * 1.2) {
            const isZeroBudget = dailyBudget < 0.01;
            const message = isZeroBudget
                ? `Você está gastando acima do permitido (Orçamento esgotado)`
                : `Você está gastando ${((avgDailySpend / dailyBudget - 1) * 100).toFixed(0)}% acima do orçamento saudável`;

            alerts.push({
                type: "over_budget",
                severity: "warning",
                message,
                actionable: true,
            });
            if (status !== "DANGER") status = "CAUTION";
        }

        // Alerta 4: Saldo atual já está negativo
        if (currentBalance < 0) {
            alerts.push({
                type: "negative_balance",
                severity: "critical",
                message: "Seu saldo atual está negativo",
                actionable: false,
            });
            status = "DANGER";
        }

        // Alerta informativo: Tudo ok
        if (alerts.length === 0) {
            alerts.push({
                type: "low_balance",
                severity: "info",
                message: "Suas finanças estão saudáveis! Continue assim.",
                actionable: false,
            });
        }

        // --- 8. RETORNAR RESULTADO ---
        return {
            currentBalance,
            minimumReserve,
            availableBalance,
            futureCommitments,
            flexibleCommitments,
            dailyBudget,
            weekendDailyBudget,
            daysRemaining,
            effectiveDaysRemaining,
            projectedEndBalance,
            autonomy,
            status,
            alerts,
            realizedIncome: totalRealizedIncome,
            projectedIncome: totalProjectedIncome,
            realizedExpenses: totalRealizedExpenses,
            projectedExpenses: totalProjectedExpenses,
            averageDailySpend: avgDailySpend,
            monthProgress,
            dailyProjections,
            commitmentsByPriority,
        } as FinancialHealth;
    }, [balanceData, expenses, incomes, settings, today]);
}
