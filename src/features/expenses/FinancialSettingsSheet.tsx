import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useFinancialSettings, useUpdateFinancialSettings } from "@/features/analytics/hooks/useFinancialSettings";
import { useHaptic } from "@/hooks/useHaptic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { ExpensePriority, EXPENSE_PRIORITY_LABELS, EXPENSE_PRIORITY_DESCRIPTIONS } from "./types";

interface FinancialSettingsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    householdId: string;
}

export function FinancialSettingsSheet({
    open,
    onOpenChange,
    householdId,
}: FinancialSettingsSheetProps) {
    const { data: settings, isLoading } = useFinancialSettings(householdId);
    const updateSettings = useUpdateFinancialSettings();
    const { trigger } = useHaptic();

    // Local state for form
    const [minReserveType, setMinReserveType] = useState<"fixed" | "percentage">("percentage");
    const [minReserveValue, setMinReserveValue] = useState<number>(0);
    const [weekendWeight, setWeekendWeight] = useState<number>(1.0);
    const [defaultPriority, setDefaultPriority] = useState<ExpensePriority>("P3");
    const [dailyAlert, setDailyAlert] = useState<boolean>(true);
    const [lowBalanceAlert, setLowBalanceAlert] = useState<number>(100);

    // Sync state with data
    useEffect(() => {
        if (settings) {
            setMinReserveType(settings.minimum_reserve_type);
            setMinReserveValue(settings.minimum_reserve_value);
            setWeekendWeight(settings.weekend_weight);
            setDefaultPriority(settings.default_expense_priority);
            setDailyAlert(settings.receive_daily_alert ?? true); // default true
            setLowBalanceAlert(settings.alert_low_balance_threshold ?? 100);
        }
    }, [settings]);

    const handleSave = () => {
        trigger("success");
        updateSettings.mutate(
            {
                household_id: householdId,
                minimum_reserve_type: minReserveType,
                minimum_reserve_value: minReserveValue,
                weekend_weight: weekendWeight,
                default_expense_priority: defaultPriority,
                receive_daily_alert: dailyAlert,
                alert_low_balance_threshold: lowBalanceAlert,
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    if (isLoading) {
        return null;
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl">Configurações Financeiras</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 pb-20">

                    {/* 1. RESERVA MÍNIMA */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                🛡️ Reserva de Segurança
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Valor que deve ser mantido na conta além das despesas.
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={minReserveType === "percentage" ? "default" : "outline"}
                                    onClick={() => setMinReserveType("percentage")}
                                    className="text-xs"
                                >
                                    Porcentagem (%)
                                </Button>
                                <Button
                                    variant={minReserveType === "fixed" ? "default" : "outline"}
                                    onClick={() => setMinReserveType("fixed")}
                                    className="text-xs"
                                >
                                    Valor Fixo (R$)
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Valor da Reserva</Label>
                                    <span className="text-sm font-bold text-primary">
                                        {minReserveType === "percentage" ? `${minReserveValue}%` : `R$ ${minReserveValue}`}
                                    </span>
                                </div>

                                {minReserveType === "percentage" ? (
                                    <Slider
                                        value={[minReserveValue]}
                                        min={0}
                                        max={50}
                                        step={1}
                                        onValueChange={(vals: number[]) => setMinReserveValue(vals[0])}
                                    />
                                ) : (
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border rounded-md"
                                        value={minReserveValue}
                                        onChange={(e) => setMinReserveValue(Number(e.target.value))}
                                    />
                                )}
                                <p className="text-xs text-muted-foreground italic">
                                    {minReserveType === "percentage"
                                        ? "Recomendado: 5% a 20% da renda mensal."
                                        : "Valor fixo que nunca deve ser gasto."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. DIA DE FINAL DE SEMANA */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                🎉 Gastos no Fim de Semana
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Permite gastar mais nos finais de semana ajustando o orçamento diário.
                            </p>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label>Peso do Orçamento (x{weekendWeight})</Label>
                                </div>
                                <div className="pt-2">
                                    <Slider
                                        value={[weekendWeight]}
                                        min={1.0}
                                        max={3.0}
                                        step={0.1}
                                        onValueChange={(vals: number[]) => setWeekendWeight(vals[0])}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground px-1">
                                    <span>Igual (1x)</span>
                                    <span>Dobro (2x)</span>
                                    <span>Triplo (3x)</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Atualmente configurado para gastar <strong>{weekendWeight}x</strong> mais em Sábados e Domingos.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. ALERTAS */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                🔔 Notificações e Alertas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            <div className="flex items-center justify-between">
                                <Label htmlFor="daily-alert" className="flex flex-col">
                                    <span>Alerta de Saldo Baixo</span>
                                    <span className="text-xs text-muted-foreground">Valor limite para considerar crítico</span>
                                </Label>
                                <div className="w-24">
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 text-right border rounded-md text-sm"
                                        value={lowBalanceAlert}
                                        onChange={(e) => setLowBalanceAlert(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-border pt-3">
                                <Label htmlFor="daily-notif" className="font-normal">
                                    Receber resumo diário
                                </Label>
                                <Switch
                                    id="daily-notif"
                                    checked={dailyAlert}
                                    onCheckedChange={setDailyAlert}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. PADRÕES */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                🏷️ Padrões
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Label>Prioridade Padrão</Label>
                                <Select value={defaultPriority} onValueChange={(v: ExpensePriority) => setDefaultPriority(v)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(Object.keys(EXPENSE_PRIORITY_LABELS) as ExpensePriority[]).map((p) => (
                                            <SelectItem key={p} value={p}>
                                                {p} - {EXPENSE_PRIORITY_LABELS[p]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {EXPENSE_PRIORITY_DESCRIPTIONS[defaultPriority]}
                            </p>
                        </CardContent>
                    </Card>

                    <Button
                        onClick={handleSave}
                        className="w-full py-6 text-lg font-bold shadow-lg shadow-primary/20"
                        disabled={updateSettings.isPending}
                    >
                        {updateSettings.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-5 w-5" />
                                Salvar Configurações
                            </>
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
