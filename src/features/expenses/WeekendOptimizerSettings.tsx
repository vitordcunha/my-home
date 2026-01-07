import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface WeekendOptimizerSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    weight: number;
    onWeightChange: (weight: number) => void;
}

export function WeekendOptimizerSettings({ open, onOpenChange, weight, onWeightChange }: WeekendOptimizerSettingsProps) {

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom">
                <SheetHeader>
                    <SheetTitle>Otimizador de Fim de Semana</SheetTitle>
                    <SheetDescription>
                        Ajuste quanto você costuma gastar a mais nos fins de semana.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Peso do Fim de Semana</span>
                            <span className="text-sm font-bold text-primary">{weight}x</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">Igual (1x)</span>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.1"
                                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                value={weight}
                                onChange={(e) => onWeightChange(parseFloat(e.target.value))}
                            />
                            <span className="text-xs text-muted-foreground">Dobro (2x)</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Exemplo: Se o peso for <strong>2x</strong>, o app vai reservar o dobro de dinheiro para Sábados e Domingos, deixando a meta dos dias úteis mais apertada para compensar.
                        </p>
                    </div>

                    <Button className="w-full" onClick={() => onOpenChange(false)}>
                        Concluído
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
