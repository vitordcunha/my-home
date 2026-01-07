import { useState, useMemo } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ReceiptCapture } from "@/components/scanner/ReceiptCapture";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Check, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Types matching the Edge Function response
export interface ReceiptItem {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category: "mercado" | "casa" | "lazer" | "farmacia" | "outros" | "limpeza";
    matched_shopping_item_id?: string | null;
}

export interface ReceiptData {
    establishment_name: string;
    total_amount: number;
    purchase_date: string;
    items: ReceiptItem[];
}

interface ReceiptPreviewSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    householdId?: string;
    onSave: (data: ReceiptData) => void;
    shoppingListItems?: { id: string; name: string }[]; // To match against
}

export function ReceiptPreviewSheet({
    open,
    onOpenChange,
    householdId,
    onSave,
    shoppingListItems = []
}: ReceiptPreviewSheetProps) {
    const { user } = useAuth();
    const { toast } = useToast();

    const [step, setStep] = useState<"capture" | "review">("capture");
    const [isProcessing, setIsProcessing] = useState(false);
    const [data, setData] = useState<ReceiptData | null>(null);

    // Reset when opening
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            // Delay reset to allow animation to finish
            setTimeout(() => {
                setStep("capture");
                setData(null);
            }, 300);
        }
        onOpenChange(newOpen);
    };

    const processImage = async (base64: string) => {
        if (!householdId || !user) return;
        setIsProcessing(true);

        try {
            const { data: result, error } = await supabase.functions.invoke('process-receipt-image', {
                body: {
                    image_base64: base64,
                    household_id: householdId,
                    shopping_list: shoppingListItems
                }
            });

            if (error) throw error;
            if (result.error) throw new Error(result.error);

            setData(result);
            setStep("review");
        } catch (error) {
            console.error("Scanning Error:", error);
            toast({
                title: "Erro ao ler nota",
                description: "Tente novamente com uma foto mais clara e focada.",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const matchedItemCount = useMemo(() => {
        if (!data) return 0;
        return data.items.filter(i => !!i.matched_shopping_item_id).length;
    }, [data]);

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full" side="bottom">
                <SheetHeader>
                    <SheetTitle>Scanner de Cupom Fiscal</SheetTitle>
                    <SheetDescription>
                        {step === "capture"
                            ? "Tire uma foto do cupom fiscal (NFC-e) para importar os itens automaticamente."
                            : "Confira os dados extraídos antes de salvar."}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 py-4 overflow-hidden flex flex-col">
                    {step === "capture" && (
                        <div className="flex flex-col items-center justify-center flex-1 gap-4">
                            <ReceiptCapture onCapture={processImage} isProcessing={isProcessing} />
                        </div>
                    )}

                    {step === "review" && data && (
                        <div className="flex flex-col h-full gap-4">
                            {/* Header Info */}
                            <div className="bg-muted/30 p-3 rounded-lg border flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Estabelecimento</p>
                                        <h3 className="font-semibold text-lg leading-tight">{data.establishment_name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total</p>
                                        <h3 className="font-bold text-xl text-primary">
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.total_amount)}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{format(new Date(data.purchase_date), "dd/MM/yyyy")}</span>
                                    <span>•</span>
                                    <span>{data.items.length} itens encontrados</span>
                                </div>
                            </div>

                            {/* Smart Match Banner */}
                            {matchedItemCount > 0 && (
                                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    <span className="font-medium">
                                        Identificamos {matchedItemCount} itens da sua lista de compras!
                                    </span>
                                </div>
                            )}

                            {/* Items List */}
                            <div className="flex-1 -mx-2 px-2 overflow-y-auto">
                                <div className="space-y-2 pb-4">
                                    {data.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition-all">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                                    {!!item.matched_shopping_item_id && (
                                                        <Badge variant="secondary" className="h-5 text-[10px] bg-green-100 text-green-800 hover:bg-green-100">
                                                            Lista de Compras
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize font-normal">
                                                        {item.category}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.quantity}x {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.unit_price)}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-sm whitespace-nowrap">
                                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.total_price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <SheetFooter className="mt-auto">
                    {step === "review" && (
                        <div className="flex w-full gap-2">
                            <Button variant="outline" onClick={() => setStep("capture")} className="flex-1">
                                Retirar Foto
                            </Button>
                            <Button onClick={() => onSave(data!)} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                <Check className="mr-2 h-4 w-4" />
                                Confirmar e Salvar
                            </Button>
                        </div>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
