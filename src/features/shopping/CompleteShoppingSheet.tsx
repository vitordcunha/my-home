import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Users } from "lucide-react";
import { useHouseholdQuery } from "@/features/households/useHouseholdQuery";

interface CompleteShoppingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  xpToEarn: number;
  householdId?: string;
  userId: string;
  onComplete: (data: {
    amount?: number;
    isSplit: boolean;
    splitWith: string[];
  }) => void;
  isPending?: boolean;
}

export function CompleteShoppingSheet({
  open,
  onOpenChange,
  selectedCount,
  xpToEarn,
  householdId,
  userId,
  onComplete,
  isPending,
}: CompleteShoppingSheetProps) {
  const [step, setStep] = useState<"amount" | "split">("amount");
  const [amount, setAmount] = useState("");
  const [registerExpense, setRegisterExpense] = useState(true);
  const [isSplit, setIsSplit] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { data: household } = useHouseholdQuery(householdId);

  // Filtrar membros (exceto o usuário atual)
  const otherMembers = household?.members?.filter((m) => m.id !== userId) || [];

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleContinue = () => {
    if (!registerExpense || !amount) {
      // Se não vai registrar despesa ou não preencheu valor, completa direto
      handleComplete();
      return;
    }

    if (isSplit && otherMembers.length > 0) {
      setStep("split");
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const numAmount = amount ? parseFloat(amount.replace(",", ".")) : undefined;
    
    onComplete({
      amount: registerExpense && numAmount && numAmount > 0 ? numAmount : undefined,
      isSplit: registerExpense && isSplit,
      splitWith: registerExpense && isSplit ? selectedMembers : [],
    });

    // Reset state
    setStep("amount");
    setAmount("");
    setRegisterExpense(true);
    setIsSplit(false);
    setSelectedMembers([]);
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset state
    setStep("amount");
    setAmount("");
    setRegisterExpense(true);
    setIsSplit(false);
    setSelectedMembers([]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] overflow-y-auto">
        <div className="space-y-6 pb-6">
          {step === "amount" ? (
            <>
              {/* Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 mb-4">
                  <ShoppingCart className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold">Finalizar Compras</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedCount} {selectedCount === 1 ? "item selecionado" : "itens selecionados"}
                </p>
              </div>

              {/* XP Info */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Você ganhará</p>
                <p className="text-3xl font-bold text-primary">+{xpToEarn} pts</p>
              </div>

              {/* Register expense option */}
              <div className="space-y-4">
                <div className="bg-accent/50 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={registerExpense}
                      onCheckedChange={(checked) => setRegisterExpense(checked as boolean)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Registrar despesa</p>
                      <p className="text-xs text-muted-foreground">
                        Adicione quanto gastou nas compras (+10 pts)
                      </p>
                    </div>
                  </label>
                </div>

                {registerExpense && (
                  <div className="space-y-4 animate-in">
                    <div>
                      <label className="text-sm font-medium">Quanto gastou? (R$)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full mt-1.5 px-4 h-12 rounded-xl border border-border bg-background text-base"
                        placeholder="0,00"
                        autoFocus
                      />
                    </div>

                    {otherMembers.length > 0 && (
                      <div className="bg-accent/50 rounded-xl p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={isSplit}
                            onCheckedChange={(checked) => setIsSplit(checked as boolean)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Dividir despesa</p>
                            <p className="text-xs text-muted-foreground">
                              Marque se a despesa será dividida com outros
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleContinue}
                  className="w-full h-14 text-base font-semibold"
                  disabled={isPending || (registerExpense && !amount)}
                >
                  {isPending ? "Finalizando..." : "Finalizar Compras"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  className="w-full"
                  disabled={isPending}
                >
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Split selection */}
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  <Users className="inline h-5 w-5 mr-1" />
                  Dividir com quem?
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Deixe vazio para dividir igualmente com todos
                </p>

                <div className="space-y-2">
                  {otherMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <span className="text-sm font-medium">{member.nome}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleComplete}
                  className="w-full h-14 text-base font-semibold"
                  disabled={isPending}
                >
                  {isPending ? "Finalizando..." : "Confirmar"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStep("amount")}
                  className="w-full"
                  disabled={isPending}
                >
                  ← Voltar
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

