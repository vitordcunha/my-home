import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAddExpense } from "./useAddExpense";
import { EXPENSE_QUICK_ACTIONS, ExpenseCategory } from "./types";
import { useHouseholdQuery } from "@/features/households/useHouseholdQuery";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, ChevronRight } from "lucide-react";

interface AddExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  userId: string;
}

export function AddExpenseSheet({
  open,
  onOpenChange,
  householdId,
  userId,
}: AddExpenseSheetProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategory | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [isSplit, setIsSplit] = useState(false);
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { data: household } = useHouseholdQuery(householdId);
  const addExpense = useAddExpense();

  // Filtrar membros (exceto o usuário atual)
  const otherMembers = household?.members?.filter((m) => m.id !== userId) || [];

  const handleQuickAction = (category: ExpenseCategory, label: string) => {
    setSelectedCategory(category);
    setDescription(label);
  };

  const handleCustomCategory = () => {
    setSelectedCategory("custom");
    setDescription("");
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = () => {
    if (!amount || !selectedCategory) return;
    if (selectedCategory === "custom" && !customCategory) return;
    if (!description && selectedCategory !== "custom") return;

    const numAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numAmount) || numAmount <= 0) return;

    const finalDescription =
      selectedCategory === "custom" ? customCategory : description;

    addExpense.mutate(
      {
        household_id: householdId,
        description: finalDescription,
        amount: numAmount,
        category: selectedCategory,
        custom_category:
          selectedCategory === "custom" ? customCategory : undefined,
        paid_by: userId,
        is_split: isSplit,
        split_with: isSplit
          ? selectedMembers.length > 0
            ? selectedMembers
            : undefined
          : [],
        split_type: isSplit ? "equal" : "individual",
        created_by: userId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setAmount("");
          setDescription("");
          setCustomCategory("");
          setSelectedCategory(null);
          setIsSplit(false);
          setShowSplitOptions(false);
          setSelectedMembers([]);
        },
      }
    );
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setShowSplitOptions(false);
    setDescription("");
    setCustomCategory("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <div className="space-y-6 pb-6">
          <div>
            <h2 className="text-2xl font-bold">Adicionar Despesa</h2>
            <p className="text-sm text-muted-foreground">
              Registre uma despesa e ganhe +10 pts
            </p>
          </div>

          {!selectedCategory ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  🚀 Atalhos Rápidos
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {EXPENSE_QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() =>
                        handleQuickAction(action.category, action.label)
                      }
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors thumb-friendly"
                    >
                      <span className="text-3xl">{action.emoji}</span>
                      <span className="text-xs font-medium">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleCustomCategory}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✏️</span>
                    <span className="text-sm font-medium">Outra categoria</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ) : showSplitOptions ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  <Users className="inline h-4 w-4 mr-1" />
                  Dividir com quem?
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Deixe vazio para dividir igualmente com todos
                </p>

                {otherMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum outro membro na casa
                  </p>
                ) : (
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
                        <span className="text-sm font-medium">
                          {member.nome}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={addExpense.isPending}
                className="w-full h-14 text-base font-semibold"
              >
                {addExpense.isPending
                  ? "Salvando..."
                  : "✅ Salvar Despesa • +10 pts"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowSplitOptions(false)}
                className="w-full"
              >
                ← Voltar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {selectedCategory === "custom"
                    ? "Nome da categoria"
                    : "Descrição"}
                </label>
                <input
                  type="text"
                  value={
                    selectedCategory === "custom" ? customCategory : description
                  }
                  onChange={(e) =>
                    selectedCategory === "custom"
                      ? setCustomCategory(e.target.value)
                      : setDescription(e.target.value)
                  }
                  className="w-full mt-1.5 px-4 h-12 rounded-xl border border-border bg-background text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder={
                    selectedCategory === "custom"
                      ? "Ex: Streaming"
                      : "Ex: Conta de luz"
                  }
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium">Valor (R$)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mt-1.5 px-4 h-12 rounded-xl border border-border bg-background text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="0,00"
                />
              </div>

              {/* Opção de dividir */}
              <div className="bg-accent/50 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={isSplit}
                    onCheckedChange={(checked) =>
                      setIsSplit(checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Dividir despesa</p>
                    <p className="text-xs text-muted-foreground">
                      Marque se a despesa será dividida com outros
                    </p>
                  </div>
                </label>
              </div>

              {isSplit ? (
                <Button
                  onClick={() => setShowSplitOptions(true)}
                  className="w-full h-14 text-base font-semibold"
                  disabled={
                    !amount ||
                    (selectedCategory === "custom"
                      ? !customCategory
                      : !description)
                  }
                >
                  Escolher com quem dividir
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !amount ||
                    (selectedCategory === "custom"
                      ? !customCategory
                      : !description) ||
                    addExpense.isPending
                  }
                  className="w-full h-14 text-base font-semibold"
                >
                  {addExpense.isPending
                    ? "Salvando..."
                    : "✅ Salvar Despesa • +10 pts"}
                </Button>
              )}

              <Button variant="ghost" onClick={resetForm} className="w-full">
                ← Voltar
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
