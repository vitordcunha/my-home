import { useState, useEffect } from "react";
import { DebtsService, Debt } from "../DebtsService";
import { DebtForm } from "./DebtForm";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Percent } from "lucide-react";


interface DebtManagerProps {
    householdId: string;
}

export function DebtManager({ householdId }: DebtManagerProps) {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    const fetchDebts = () => {
        DebtsService.list(householdId).then(setDebts).catch(console.error);
    };

    useEffect(() => {
        fetchDebts();
    }, [householdId]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Cartões e Dívidas
                </h2>
                {!isAdding && (
                    <Button size="sm" onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Novo
                    </Button>
                )}
            </div>

            {isAdding && (
                <DebtForm
                    onSuccess={() => { setIsAdding(false); fetchDebts(); }}
                    onCancel={() => setIsAdding(false)}
                />
            )}

            <div className="grid gap-3">
                {debts.map(debt => (
                    <div key={debt.id} className="p-4 border rounded-xl flex items-center justify-between bg-card hover:bg-accent/50 transition-colors">
                        <div>
                            <h3 className="font-semibold">{debt.name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Percent className="w-3 h-3" />
                                Juros: {debt.interest_rate}% a.m. • Min: {debt.minimum_payment_percentage || 15}%
                            </p>
                        </div>
                        <div className="text-xs px-2 py-1 bg-secondary rounded text-secondary-foreground">
                            Vence dia {debt.due_day || "?"}
                        </div>
                    </div>
                ))}
                {!isAdding && debts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        Nenhum cartão ou dívida cadastrada.
                    </div>
                )}
            </div>
        </div>
    );
}
