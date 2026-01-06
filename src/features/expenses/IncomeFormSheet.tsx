import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAddIncome, useUpdateIncome } from "./useIncomeMutations";
import { CheckCircle2, Calendar, Repeat } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";
import { Income } from "./useIncomesQuery";

interface IncomeFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  userId: string;
  incomeToEdit?: Income | null;
}

const INCOME_CATEGORIES = [
  { id: "salario" as const, label: "Salário", emoji: "💰" },
  { id: "freelance" as const, label: "Freelance", emoji: "💼" },
  { id: "investimento" as const, label: "Investimento", emoji: "📈" },
  { id: "presente" as const, label: "Presente", emoji: "🎁" },
  { id: "outros" as const, label: "Outros", emoji: "💵" },
];

export function IncomeFormSheet({
  open,
  onOpenChange,
  householdId,
  userId,
  incomeToEdit,
}: IncomeFormSheetProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<
    "salario" | "freelance" | "investimento" | "presente" | "outros" | null
  >(null);
  const [receivedAt, setReceivedAt] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<
    "monthly" | "weekly" | null
  >(null);
  const [recurrenceDay, setRecurrenceDay] = useState<string>("");
  const [competenceDate, setCompetenceDate] = useState<string>("");

  const addIncome = useAddIncome();
  const updateIncome = useUpdateIncome();
  const { trigger } = useHaptic();

  const isEditMode = !!incomeToEdit;

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (incomeToEdit && open) {
      setDescription(incomeToEdit.description);
      setAmount(incomeToEdit.amount.toString());
      setCategory(
        incomeToEdit.category as
        | "salario"
        | "freelance"
        | "investimento"
        | "presente"
        | "outros"
      );
      setReceivedAt(
        incomeToEdit.received_at
          ? new Date(incomeToEdit.received_at).toISOString().slice(0, 16)
          : ""
      );
      setIsRecurring(incomeToEdit.is_recurring);
      setRecurrenceFrequency(
        incomeToEdit.recurrence_frequency as "monthly" | "weekly" | null
      );
      setRecurrenceDay(
        incomeToEdit.recurrence_day
          ? incomeToEdit.recurrence_day.toString()
          : ""
      );
      setCompetenceDate(
        (incomeToEdit as any).competence_date
          ? new Date((incomeToEdit as any).competence_date).toISOString().slice(0, 10)
          : ""
      );
    } else if (!open) {
      // Limpar formulário ao fechar
      resetForm();
    }
  }, [incomeToEdit, open]);

  const handleSubmit = () => {
    if (!amount || !category || !description) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

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

    trigger("success");

    // Calcular competence_date
    // Se não foi especificada, usar a data de recebimento ou next_occurrence_date
    let finalCompetenceDate: string | null = null;
    if (competenceDate) {
      finalCompetenceDate = competenceDate;
    } else if (receivedAt) {
      finalCompetenceDate = new Date(receivedAt).toISOString().slice(0, 10);
    } else if (nextOccurrenceDate) {
      finalCompetenceDate = new Date(nextOccurrenceDate).toISOString().slice(0, 10);
    }

    if (isEditMode && incomeToEdit) {
      // Modo de edição
      updateIncome.mutate(
        {
          id: incomeToEdit.id,
          description,
          amount: numAmount,
          category,
          received_at: receivedAt || null,
          is_recurring: isRecurring,
          recurrence_frequency: recurrenceFrequency || null,
          recurrence_day: recurrenceDay ? parseInt(recurrenceDay) : null,
          next_occurrence_date: nextOccurrenceDate,
          competence_date: finalCompetenceDate,
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
      addIncome.mutate(
        {
          household_id: householdId,
          description,
          amount: numAmount,
          category,
          received_at: receivedAt || null,
          received_by: userId,
          is_recurring: isRecurring,
          recurrence_frequency: recurrenceFrequency || null,
          recurrence_day: recurrenceDay ? parseInt(recurrenceDay) : null,
          next_occurrence_date: nextOccurrenceDate,
          created_by: userId,
          competence_date: finalCompetenceDate,
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

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory(null);
    setReceivedAt("");
    setIsRecurring(false);
    setRecurrenceFrequency(null);
    setRecurrenceDay("");
    setCompetenceDate("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <div className="space-y-6 pb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {isEditMode ? "Editar Receita" : "Adicionar Receita"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditMode
                ? "Atualize os dados da receita"
                : "Registre uma receita para planejamento financeiro"}
            </p>
          </div>

          {!category ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  Selecione a categoria
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {INCOME_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        trigger("light");
                        setCategory(cat.id);
                      }}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors thumb-friendly"
                    >
                      <span className="text-3xl">{cat.emoji}</span>
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1.5 px-4 h-12 rounded-xl border border-border bg-background text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Ex: Salário de Janeiro"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mt-1.5 px-4 h-12 rounded-xl border border-border bg-background text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de recebimento (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  className="w-full mt-1.5 px-4 h-12 rounded-xl border border-border bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe vazio para marcar como receita futura/projetada
                </p>
              </div>

              {/* Campo de Competência */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Mês de Competência (Opcional)
                </label>
                <input
                  type="date"
                  value={competenceDate}
                  onChange={(e) => setCompetenceDate(e.target.value)}
                  className="w-full mt-1.5 px-4 h-12 rounded-xl border border-border bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Use para contabilizar em outro mês. Ex: Salário recebido dia 31/Jan pode ser contabilizado em Fevereiro
                </p>
                {receivedAt && (() => {
                  const receivedDate = new Date(receivedAt);
                  const dayOfMonth = receivedDate.getDate();
                  // Sugestão inteligente: se recebeu após dia 25, sugerir mês seguinte
                  if (dayOfMonth >= 25 && !competenceDate && category === "salario") {
                    const nextMonth = new Date(receivedDate);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    nextMonth.setDate(1);
                    return (
                      <div className="mt-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                          💡 Sugestão: Este salário foi recebido no fim do mês. Deseja contabilizar em {nextMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}?
                        </p>
                        <button
                          type="button"
                          onClick={() => setCompetenceDate(nextMonth.toISOString().slice(0, 10))}
                          className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          Sim, usar mês seguinte
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Receita recorrente
                    </span>
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

              <Button
                onClick={handleSubmit}
                disabled={
                  (isEditMode ? updateIncome.isPending : addIncome.isPending) ||
                  !amount ||
                  !description
                }
                className="w-full h-14 text-base font-semibold"
              >
                {isEditMode ? (
                  updateIncome.isPending ? (
                    "Salvando..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Atualizar Receita
                    </>
                  )
                ) : addIncome.isPending ? (
                  "Salvando..."
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Salvar Receita
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setCategory(null);
                  resetForm();
                }}
                className="w-full"
              >
                ← Voltar
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
