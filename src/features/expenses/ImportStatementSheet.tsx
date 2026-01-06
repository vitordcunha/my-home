import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Link2,
  AlertCircle,
  Loader2,
  FileText,
  Calendar,
} from "lucide-react";
import { useImportStatement } from "./useImportStatement";
import { useSaveImportedTransactions } from "./useSaveImportedTransactions";
import type { ImportedTransaction } from "./import-types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIncomesQuery } from "./useIncomesQuery";
import { useExpensesQuery } from "./useExpensesQuery";

interface ImportStatementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  userId: string;
  month: number;
  year: number;
}

type ImportStep = "upload" | "review" | "success";

export function ImportStatementSheet({
  open,
  onOpenChange,
  householdId,
  userId,
  month,
  year,
}: ImportStatementSheetProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [statementText, setStatementText] = useState("");
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  const { data: existingIncomes } = useIncomesQuery(householdId);
  const { data: existingExpenses } = useExpensesQuery(householdId);

  const importMutation = useImportStatement({
    onSuccess: (data) => {
      // Mark all as selected by default
      const transactionsWithSelection = data.transactions.map((t) => ({
        ...t,
        selected: true,
      }));
      setTransactions(transactionsWithSelection);
      setStep("review");
    },
    onError: (error) => {
      alert(`Erro ao processar extrato: ${error.message}`);
    },
  });

  const saveMutation = useSaveImportedTransactions();

  const handleProcessStatement = () => {
    if (!statementText.trim()) {
      alert("Por favor, cole o texto do extrato bancário");
      return;
    }

    // Filter existing transactions for the selected month/year
    const monthIncomes = existingIncomes?.filter((i) => {
      const date = new Date(i.received_at || i.created_at);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });

    const monthExpenses = existingExpenses?.filter((e) => {
      const date = new Date(e.paid_at);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });

    importMutation.mutate({
      statement_text: statementText,
      household_id: householdId,
      month,
      year,
      existing_incomes: monthIncomes?.map((i) => ({
        id: i.id,
        description: i.description,
        amount: i.amount,
        received_at: i.received_at || i.created_at,
      })),
      existing_expenses: monthExpenses?.map((e) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        paid_at: e.paid_at,
      })),
    });
  };

  const handleSaveTransactions = async () => {
    const selectedTransactions = transactions.filter((t) => t.selected);

    if (selectedTransactions.length === 0) {
      alert("Selecione pelo menos uma transação para importar");
      return;
    }

    try {
      await saveMutation.mutateAsync({
        transactions: selectedTransactions,
        householdId,
        userId,
      });
      setStep("success");
    } catch (error) {
      console.error("Error saving transactions:", error);
    }
  };

  const handleToggleTransaction = (index: number) => {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleToggleAll = () => {
    const newValue = !selectAll;
    setSelectAll(newValue);
    setTransactions((prev) =>
      prev.map((t) => ({ ...t, selected: newValue }))
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("upload");
      setStatementText("");
      setTransactions([]);
      setSelectAll(true);
    }, 300);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  // Helper function to check if a salary is on the last business day(s) of the month
  const isSalaryOnLastBusinessDay = (transaction: ImportedTransaction): boolean => {
    if (transaction.type !== "income" || transaction.category !== "salario") {
      return false;
    }
    const transactionDate = new Date(transaction.date);
    const year = transactionDate.getFullYear();
    const month = transactionDate.getMonth();

    // Find the last business day (Monday-Friday) of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    let lastBusinessDay = new Date(lastDayOfMonth);

    // Go backwards from the last day until we find a weekday (Mon-Fri)
    while (lastBusinessDay.getDay() === 0 || lastBusinessDay.getDay() === 6) {
      lastBusinessDay.setDate(lastBusinessDay.getDate() - 1);
    }

    // Check if the transaction is on the last business day of the month
    const isLastBusinessDay = transactionDate.getDate() === lastBusinessDay.getDate() &&
      transactionDate.getMonth() === lastBusinessDay.getMonth();

    // Also check if it's within the last 3 business days (to catch edge cases)
    let isInLastBusinessDays = false;
    let checkDate = new Date(lastBusinessDay);
    for (let i = 0; i < 3; i++) {
      if (transactionDate.getDate() === checkDate.getDate() &&
        transactionDate.getMonth() === checkDate.getMonth()) {
        isInLastBusinessDays = true;
        break;
      }
      // Move to previous business day
      checkDate.setDate(checkDate.getDate() - 1);
      while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    return isLastBusinessDay || isInLastBusinessDays;
  };

  // Helper function to get the adjusted date for display
  const getAdjustedDate = (transaction: ImportedTransaction): Date => {
    if (isSalaryOnLastBusinessDay(transaction)) {
      const transactionDate = new Date(transaction.date);
      const nextMonth = new Date(transactionDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      return nextMonth;
    }
    return new Date(transaction.date);
  };

  const summary = useMemo(() => {
    const selected = transactions.filter((t) => t.selected);
    const salariesOnLastBusinessDay = selected.filter((t) => isSalaryOnLastBusinessDay(t)).length;
    return {
      total: selected.length,
      incomes: selected.filter((t) => t.type === "income").length,
      expenses: selected.filter((t) => t.type === "expense").length,
      totalIncome: selected
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
      totalExpense: selected
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
      matched: selected.filter((t) => t.match_type !== "none").length,
      salariesOnLastBusinessDay,
    };
  }, [transactions]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] flex flex-col overflow-hidden"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Importar Extrato com IA
          </SheetTitle>
          <SheetDescription>
            Cole o texto do seu extrato bancário e deixe a IA categorizar
            automaticamente
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-6">
          {step === "upload" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm space-y-2">
                      <p className="font-semibold">Como usar:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Acesse o extrato no site/app do seu banco</li>
                        <li>Copie o texto das transações do mês</li>
                        <li>Cole abaixo e clique em "Processar com IA"</li>
                        <li>Revise as transações detectadas</li>
                        <li>Confirme para salvar no sistema</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Texto do Extrato
                </label>
                <textarea
                  value={statementText}
                  onChange={(e) => setStatementText(e.target.value)}
                  placeholder="Cole aqui o texto do extrato bancário...

Exemplo:
05/01/2026 DEPOSITO SALARIO           5000.00 C
10/01/2026 IFOOD *OSASCO               -45.00 D
12/01/2026 PAG CONTA ENERGIA          -150.00 D"
                  className="w-full min-h-[300px] p-4 rounded-lg border bg-background resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {statementText.length} caracteres
                </p>
              </div>

              <Button
                onClick={handleProcessStatement}
                disabled={!statementText.trim() || importMutation.isPending}
                className="w-full"
                size="lg"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Processar com IA
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold">
                        Encontramos {transactions.length} transações
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Receitas</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {summary.incomes} ({formatCurrency(summary.totalIncome)})
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Despesas</p>
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            {summary.expenses} ({formatCurrency(summary.totalExpense)})
                          </p>
                        </div>
                      </div>
                      {summary.matched > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {summary.matched} já cadastrada(s) no sistema
                        </p>
                      )}
                      {summary.salariesOnLastBusinessDay > 0 && (
                        <div className="mt-2 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {summary.salariesOnLastBusinessDay} salário(s) recebido(s) no último dia útil do mês serão atribuídos ao mês seguinte
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Select All */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleToggleAll}
                />
                <label className="text-sm font-medium">
                  Selecionar todas ({summary.total} selecionadas)
                </label>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                {transactions.map((transaction, index) => (
                  <Card
                    key={index}
                    className={`transition-all ${transaction.selected
                        ? "border-primary"
                        : "opacity-50 border-dashed"
                      } ${transaction.match_type !== "none"
                        ? "border-amber-500/50 bg-amber-500/5"
                        : ""
                      }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={transaction.selected}
                          onCheckedChange={() => handleToggleTransaction(index)}
                          className="mt-1"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {transaction.type === "income" ? (
                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                              )}
                              <span className="font-semibold truncate">
                                {transaction.description}
                              </span>
                            </div>
                            <p
                              className={`font-bold text-lg flex-shrink-0 ${transaction.type === "income"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                                }`}
                            >
                              {transaction.type === "income" ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              {format(getAdjustedDate(transaction), "dd/MM/yyyy")}
                              {isSalaryOnLastBusinessDay(transaction) && (
                                <span className="text-blue-600 dark:text-blue-400" title="Data ajustada para o mês seguinte">
                                  *
                                </span>
                              )}
                            </span>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {transaction.category}
                            </span>
                            {transaction.match_type !== "none" && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <Link2 className="h-3 w-3" />
                                  {transaction.match_type === "exact"
                                    ? "Match exato"
                                    : "Parecido"}
                                </span>
                              </>
                            )}
                            {transaction.confidence < 0.7 && (
                              <>
                                <span>•</span>
                                <span className="text-orange-600 dark:text-orange-400">
                                  Revisar categoria
                                </span>
                              </>
                            )}
                          </div>

                          {transaction.match_type !== "none" && (
                            <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                              <p className="text-xs text-amber-700 dark:text-amber-300">
                                Esta transação parece estar duplicada no
                                sistema. Desmarque se não quiser importar.
                              </p>
                            </div>
                          )}
                          {isSalaryOnLastBusinessDay(transaction) && (
                            <div className="mt-2 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                              <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Salário recebido no último dia útil do mês será atribuído ao mês seguinte ({format(getAdjustedDate(transaction), "MMMM yyyy", { locale: ptBR })})
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Importação Concluída!</h3>
                <p className="text-muted-foreground">
                  {summary.total} transações foram salvas com sucesso
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                      {summary.incomes}
                    </p>
                    <p className="text-xs text-muted-foreground">Receitas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                      {summary.expenses}
                    </p>
                    <p className="text-xs text-muted-foreground">Despesas</p>
                  </CardContent>
                </Card>
              </div>
              <Button onClick={handleClose} size="lg" className="w-full max-w-sm">
                Fechar
              </Button>
            </div>
          )}
        </div>

        {step === "review" && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {summary.total} de {transactions.length} selecionadas
              </span>
              <span>
                Saldo:{" "}
                <span
                  className={
                    summary.totalIncome - summary.totalExpense >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {formatCurrency(summary.totalIncome - summary.totalExpense)}
                </span>
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTransactions}
                disabled={summary.total === 0 || saveMutation.isPending}
                className="flex-1"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Importar {summary.total}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

