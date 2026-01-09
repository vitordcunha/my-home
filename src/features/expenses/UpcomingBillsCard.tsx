
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, CalendarClock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TimelineItem } from "./useFinancialBalance";

interface UpcomingBillsCardProps {
    transactions: TimelineItem[];
    onViewAll?: () => void;
}

export function UpcomingBillsCard({ transactions, onViewAll }: UpcomingBillsCardProps) {
    // Filtrar apenas despesas futuras
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingBills = transactions
        .filter(t => t.type === 'expense')
        .filter(t => {
            const date = new Date(t.date);
            // Considerar hoje e futuro
            return date >= today;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3); // Pegar as 3 primeiras

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(val));

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return "Hoje";
        if (isTomorrow(date)) return "Amanhã";
        return format(date, "dd MMM", { locale: ptBR });
    };

    return (
        <Card className="h-full border-none shadow-soft p-4 flex flex-col bg-card relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600">
                        <CalendarClock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Próximas Contas
                    </span>
                </div>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-[10px] font-medium text-primary hover:underline flex items-center gap-0.5"
                    >
                        Ver tudo <ArrowRight className="w-3 h-3" />
                    </button>
                )}
            </div>

            <div className="flex-1 space-y-2 relative z-10">
                {upcomingBills.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                        <CheckCircle2 className="w-8 h-8 opacity-20" />
                        <p className="text-xs">Tudo pago por enquanto!</p>
                    </div>
                ) : (
                    upcomingBills.map(bill => (
                        <div key={bill.item_id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`flex flex-col items-center justify-center w-8 h-8 rounded-lg ${isToday(new Date(bill.date)) ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    <span className="text-[10px] font-bold leading-none">
                                        {format(new Date(bill.date), "dd")}
                                    </span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate w-[100px] sm:w-auto">
                                        {bill.description}
                                    </span>
                                    <span className={`text-[10px] ${isToday(new Date(bill.date)) ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                                        }`}>
                                        {formatDate(bill.date)}
                                    </span>
                                </div>
                            </div>
                            <span className="text-sm font-semibold whitespace-nowrap">
                                {formatCurrency(bill.amount)}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Background Decor */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl z-0" />
        </Card>
    );
}
