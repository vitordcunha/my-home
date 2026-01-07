import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useAddExpense } from "./useAddExpense";
import { useUpdateExpense, useDeleteExpense } from "./useExpenseMutations";
import { EXPENSE_QUICK_ACTIONS, ExpenseCategory, Expense } from "./types";
import { useHouseholdQuery } from "@/features/households/useHouseholdQuery";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  ChevronRight,
  Rocket,
  Pencil,
  CheckCircle2,
  Trash2,
  Calendar,
  Repeat,
} from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";

interface AddExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  userId: string;
  expenseToEdit?: Expense | null;
}

export function AddExpenseSheet({
  open,
  onOpenChange,
  householdId,
  userId,
  expenseToEdit,
}: AddExpenseSheetProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategory | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [isSplit, setIsSplit] = useState(false);
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [paidAt, setPaidAt] = useState<string>("");
  const [competenceDate, setCompetenceDate] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<
    "monthly" | "weekly" | null
  >(null);
  const [recurrenceDay, setRecurrenceDay] = useState<string>("");

  const { data: household } = useHouseholdQuery(householdId);
  const addExpense = useAddExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const { trigger } = useHaptic();

  const isEditMode = !!expenseToEdit;

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (expenseToEdit && open) {
      setSelectedCategory(expenseToEdit.category as ExpenseCategory);
      setAmount(expenseToEdit.amount.toString());
      setDescription(expenseToEdit.description);
      setCustomCategory(expenseToEdit.custom_category || "");
      setIsSplit(expenseToEdit.is_split);
      setSelectedMembers(expenseToEdit.split_with || []);
      setCompetenceDate(
        (expenseToEdit as any).competence_date
          ? new Date((expenseToEdit as any).competence_date).toISOString().slice(0, 10)
          : ""
      );
      setPaidAt(
        expenseToEdit.paid_at
          ? new Date(expenseToEdit.paid_at).toISOString().slice(0, 16)
          : ""
      );
      setIsRecurring(expenseToEdit.is_recurring);
      setRecurrenceFrequency(expenseToEdit.recurrence_frequency as any);
      setRecurrenceDay(expenseToEdit.recurrence_day?.toString() || "");
    } else if (open) {
      if (!paidAt) {
        setPaidAt(new Date().toISOString().slice(0, 16));
      }
    } else if (!open) {
      // Limpar formulário ao fechar
      resetForm();
    }
  }, [expenseToEdit, open]);

  // Filtrar membros (exceto o usuário atual)
  const otherMembers = household?.members?.filter((m) => m.id !== userId) || [];

  const handleQuickAction = (category: ExpenseCategory, label: string) => {
    trigger("light");
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

    trigger("success");

    // Calcular paid_at e competence_date
    const finalPaidAt = paidAt ? new Date(paidAt).toISOString() : new Date().toISOString();
    const finalCompetenceDate = competenceDate || finalPaidAt.slice(0, 10);

    // Se é recorrente, calcular next_occurrence_date
    let nextOccurrenceDate: string | undefined = undefined;
    if (isRecurring && recurrenceFrequency && recurrenceDay) {
      const today = new Date();
      const day = parseInt(recurrenceDay);

      if (recurrenceFrequency === "monthly") {
        const nextMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          day
        );
        nextOccurrenceDate = nextMonth.toISOString();
      } else if (recurrenceFrequency === "weekly") {
        // Para semanal, usar o próximo dia da semana
        const daysUntilNext = (day - today.getDay() + 7) % 7 || 7;
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + daysUntilNext);
        nextOccurrenceDate = nextWeek.toISOString();
      }
    }

    if (isEditMode && expenseToEdit) {
      // Modo de edição
      updateExpense.mutate(
        {
          id: expenseToEdit.id,
          description: finalDescription,
          amount: numAmount,
          category: selectedCategory,
          custom_category:
            selectedCategory === "custom" ? customCategory : undefined,
          is_split: isSplit,
          split_with: isSplit
            ? selectedMembers.length > 0
              ? selectedMembers
              : undefined
            : [],
          split_type: isSplit ? "equal" : "individual",
          paid_at: finalPaidAt,
          competence_date: finalCompetenceDate,
          is_recurring: isRecurring,
          recurrence_frequency: recurrenceFrequency || null,
          recurrence_day: recurrenceDay ? parseInt(recurrenceDay) : null,
          next_occurrence_date: nextOccurrenceDate,
        } as any,
        {
          onSuccess: () => {
            onOpenChange(false);
            resetForm();
          },
        }
      );
    } else {
      // Modo de criação
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
          paid_at: finalPaidAt,
          competence_date: finalCompetenceDate,
          is_recurring: isRecurring,
          recurrence_frequency: recurrenceFrequency || null,
          recurrence_day: recurrenceDay ? parseInt(recurrenceDay) : null,
          next_occurrence_date: nextOccurrenceDate,
        } as any,
        {
          onSuccess: () => {
            onOpenChange(false);
            resetForm();
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!expenseToEdit) return;

    deleteExpense.mutate(expenseToEdit.id, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setShowSplitOptions(false);
    setDescription("");
    setCustomCategory("");
    setCompetenceDate("");
    setPaidAt("");
    setIsRecurring(false);
    setRecurrenceFrequency(null);
    setRecurrenceDay("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <div className="space-y-6 pb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {isEditMode ? "Editar Despesa" : "Adicionar Despesa"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditMode
                ? "Atualize os dados da despesa"
                : "Registre uma despesa e ganhe +10 pts"}
            </p>
          </div>

          {!selectedCategory ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Atalhos Rápidos
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
                    <Pencil className="h-5 w-5 text-primary" />
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
                disabled={
                  isEditMode ? updateExpense.isPending : addExpense.isPending
                }
                className="w-full h-14 text-base font-semibold"
              >
                {isEditMode ? (
                  updateExpense.isPending ? (
                    "Salvando..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Atualizar Despesa
                    </>
                  )
                ) : addExpense.isPending ? (
                  "Salvando..."
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Salvar Despesa • +10 pts
                  </>
                )}
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

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data da Despesa
                </label>
                <input
                  type="datetime-local"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="w-full mt-1.5 px-4 h-12 rounded-xl border border-border bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>

              {/* Campo de Competência */}
              <div>
                <label className="text-sm font-medium">Mês de Competência (Opcional)</label>
                <input
                  type="date"
                  value={competenceDate}
                  onChange={(e) => setCompetenceDate(e.target.value)}
                  className="w-full mt-1.5 px-4 h-12 rounded-xl border border-border bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Use para contabilizar em outro mês do orçamento
                </p>
              </div>

              {/* Opção de Recorrência */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <Checkbox
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                  />
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Despesa Recorrente</p>
                    </div>
                  </div>
                </label>

                {isRecurring && (
                  <div className="pl-7 space-y-3">
                    <div>
                      <label className="text-sm font-medium">Frequência</label>
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() => setRecurrenceFrequency("monthly")}
                          className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${recurrenceFrequency === "monthly"
                            ? "border-primary bg-primary/10"
                            : "border-border"
                            }`}
                        >
                          Mensal
                        </button>
                        <button
                          onClick={() => setRecurrenceFrequency("weekly")}
                          className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${recurrenceFrequency === "weekly"
                            ? "border-primary bg-primary/10"
                            : "border-border"
                            }`}
                        >
                          Semanal
                        </button>
                      </div>
                    </div>

                    {recurrenceFrequency && (
                      <div>
                        <label className="text-sm font-medium">
                          {recurrenceFrequency === "monthly"
                            ? "Dia do mês"
                            : "Dia da semana (0=Dom, 1=Seg, ...)"}
                        </label>
                        <input
                          type="number"
                          min={recurrenceFrequency === "monthly" ? 1 : 0}
                          max={recurrenceFrequency === "monthly" ? 31 : 6}
                          value={recurrenceDay}
                          onChange={(e) => setRecurrenceDay(e.target.value)}
                          className="w-full mt-1.5 px-4 h-12 rounded-xl border border-border bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                          placeholder={
                            recurrenceFrequency === "monthly"
                              ? "Ex: 5"
                              : "Ex: 1"
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
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
                  {addExpense.isPending ? (
                    "Salvando..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Salvar Despesa • +10 pts
                    </>
                  )}
                </Button>
              )}

              <Button variant="ghost" onClick={resetForm} className="w-full">
                ← Voltar
              </Button>

              {isEditMode && (
                <ConfirmButton
                  variant="outline"
                  onConfirm={handleDelete}
                  className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  disabled={deleteExpense.isPending}
                  confirmText="Você tem certeza?"
                  defaultText="Apagar Despesa"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Apagar Despesa
                </ConfirmButton>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
