import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DebtsService } from "../DebtsService";
import { useHaptic } from "@/hooks/useHaptic";

interface DebtFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function DebtForm({ onSuccess, onCancel }: DebtFormProps) {
    const [name, setName] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [dueDay, setDueDay] = useState("");
    const [minimumPaymentPercentage, setMinimumPaymentPercentage] = useState("15");
    const [loading, setLoading] = useState(false);
    const { trigger } = useHaptic();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !interestRate) return;

        setLoading(true);
        try {
            await DebtsService.create({
                name,
                interest_rate: parseFloat(interestRate),
                due_day: dueDay ? parseInt(dueDay) : undefined,
                minimum_payment_percentage: parseFloat(minimumPaymentPercentage) || 15,
            });
            trigger("success");
            onSuccess();
        } catch (err) {
            console.error(err);
            trigger("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl bg-card">
            <h3 className="text-lg font-semibold">Novo Cartão / Dívida</h3>

            <div>
                <label className="text-sm font-medium">Nome (Ex: Nubank)</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full mt-1 px-4 py-2 rounded-lg border bg-background"
                    placeholder="Nome do cartão"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Juros Mensal (%)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={interestRate}
                        onChange={e => setInterestRate(e.target.value)}
                        className="w-full mt-1 px-4 py-2 rounded-lg border bg-background"
                        placeholder="Ex: 14.5"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Dia Vencimento</label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        value={dueDay}
                        onChange={e => setDueDay(e.target.value)}
                        className="w-full mt-1 px-4 py-2 rounded-lg border bg-background"
                        placeholder="Ex: 10"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Mínimo (%)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={minimumPaymentPercentage}
                        onChange={e => setMinimumPaymentPercentage(e.target.value)}
                        className="w-full mt-1 px-4 py-2 rounded-lg border bg-background"
                        placeholder="Padrao: 15"
                    />
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Salvando..." : "Salvar"}
                </Button>
            </div>
        </form>
    );
}
