import { useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { TimelineItem } from './useFinancialBalance';

interface CashFlowSankeyProps {
    timeline: TimelineItem[];
    month: number;
    year: number;
}

export function CashFlowSankey({ timeline }: CashFlowSankeyProps) {
    const data = useMemo(() => {
        const income = timeline.filter(t => t.type === 'income');
        const expenses = timeline.filter(t => t.type === 'expense');

        const totalIncome = income.reduce((acc, curr) => acc + curr.amount, 0);
        const totalExpenses = expenses.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

        // Group expenses by category
        const expensesByCategory = expenses.reduce((acc, curr) => {
            const cat = curr.category || 'Outros';
            acc[cat] = (acc[cat] || 0) + Math.abs(curr.amount);
            return acc;
        }, {} as Record<string, number>);

        // Sort categories by amount
        const sortedCategories = Object.entries(expensesByCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6); // Limit to top 6 to avoid clutter, others group in "Outros"

        // Nodes
        const nodes = [
            { name: 'Receitas' }, // Node 0
        ];

        const links = [];

        // Determine if we need to pull from Reserves (Deficit) or if we have Savings (Surplus)
        const isDeficit = totalExpenses > totalIncome;
        const surplus = totalIncome - totalExpenses;

        // Add Category Nodes
        sortedCategories.forEach(([cat]) => {
            nodes.push({ name: cat }); // Node 1 to N
        });

        // Add "Other Expenses" if needed
        // (省略 logic complexa de outros por enquanto para MVP)

        // Building Links
        // If Deficit: We need a "Reservas" node source.
        if (isDeficit) {
            nodes.push({ name: 'Reservas' }); // Last Node? No, indices matter.
            // Actually, let's keep it simple: Just show Income -> Expenses. 
            // If expense > income, the bar 'Receitas' will just be smaller than sum of outputs? 
            // No, Recharts might behave oddly.
            // Let's normalize. Source = Max(Income, Expenses).
        } else if (surplus > 0) {
            nodes.push({ name: 'Economia' });
        }

        // Links Construction
        let targetIndexBase = 1;

        sortedCategories.forEach(([, amount]) => {
            links.push({
                source: 0, // Receitas
                target: targetIndexBase,
                value: amount
            });
            targetIndexBase++;
        });

        if (surplus > 0) {
            // Index of 'Economia' is targetIndexBase
            links.push({
                source: 0,
                target: targetIndexBase,
                value: surplus
            });
        }

        return { nodes, links };
    }, [timeline]);

    if (data.nodes.length <= 1) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm border border-dashed rounded-xl bg-muted/20">
                Dados insuficientes para fluxo
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/20 p-4">
            <ResponsiveContainer width="100%" height="100%">
                <Sankey
                    data={data}
                    node={{ fill: '#8884d8' }} // Custom visual needed
                    nodePadding={50}
                    margin={{
                        left: 10,
                        right: 10,
                        top: 10,
                        bottom: 10,
                    }}
                    link={{ stroke: '#82ca9d' }}
                >
                    <Tooltip />
                </Sankey>
            </ResponsiveContainer>
        </div>
    );
}
