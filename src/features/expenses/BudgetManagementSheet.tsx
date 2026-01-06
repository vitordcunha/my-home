import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useBudgetsQuery } from "./useBudgetsQuery";
import { useCreateBudget, useUpdateBudget, useDeleteBudget } from "./useBudgetMutations";
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS } from "./types";
import { Trash2, Plus, Edit2 } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";
import { Card, CardContent } from "@/components/ui/card";

interface BudgetManagementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  userId: string;
}

export function BudgetManagementSheet({
  open,
  onOpenChange,
  householdId,
  userId,
}: BudgetManagementSheetProps) {
  const { data: budgets, isLoading } = useBudgetsQuery(householdId);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();
  const { trigger } = useHaptic();

  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [newBudgetCategory, setNewBudgetCategory] = useState<ExpenseCategory | null>(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [editingAmount, setEditingAmount] = useState("");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleCreateBudget = () => {
    if (!newBudgetCategory || !newBudgetAmount) return;

    const amount = parseFloat(newBudgetAmount);
    if (isNaN(amount) || amount <= 0) return;

    trigger("success");
    createBudget.mutate(
      {
        household_id: householdId,
        category: newBudgetCategory,
        limit_amount: amount,
        created_by: userId,
      },
      {
        onSuccess: () => {
          setNewBudgetCategory(null);
          setNewBudgetAmount("");
        },
      }
    );
  };

  const handleUpdateBudget = (id: string) => {
    if (!editingAmount) return;

    const amount = parseFloat(editingAmount);
    if (isNaN(amount) || amount <= 0) return;

    trigger("success");
    updateBudget.mutate(
      {
        id,
        limit_amount: amount,
      },
      {
        onSuccess: () => {
          setEditingBudget(null);
          setEditingAmount("");
        },
      }
    );
  };

  const handleDeleteBudget = (id: string) => {
    trigger("light");
    deleteBudget.mutate(id);
  };

  const startEditing = (budget: { id: string; limit_amount: number }) => {
    setEditingBudget(budget.id);
    setEditingAmount(budget.limit_amount.toString());
  };

  const cancelEditing = () => {
    setEditingBudget(null);
    setEditingAmount("");
  };

  // Categorias disponíveis
  const categories: ExpenseCategory[] = [
    "casa",
    "contas",
    "mercado",
    "delivery",
    "limpeza",
    "manutencao",
    "outros",
  ];

  // Categorias já com orçamento
  const budgetedCategories = new Set(budgets?.map((b) => b.category) || []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">Gerenciar Orçamentos</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Lista de Orçamentos Existentes */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : budgets && budgets.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Orçamentos Configurados</h3>
              {budgets.map((budget) => (
                <Card key={budget.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">
                          {EXPENSE_CATEGORY_LABELS[budget.category]}
                        </p>
                        {editingBudget === budget.id ? (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingAmount}
                              onChange={(e) => setEditingAmount(e.target.value)}
                              placeholder="Valor"
                              className="flex-1 px-3 py-2 border rounded-lg"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateBudget(budget.id)}
                            >
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-primary mt-1">
                            {formatCurrency(budget.limit_amount)}
                          </p>
                        )}
                      </div>
                      {editingBudget !== budget.id && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(budget)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBudget(budget.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum orçamento configurado ainda.
            </div>
          )}

          {/* Criar Novo Orçamento */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Criar Novo Orçamento</h3>
            {newBudgetCategory ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Categoria: {EXPENSE_CATEGORY_LABELS[newBudgetCategory]}
                    </p>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newBudgetAmount}
                      onChange={(e) => setNewBudgetAmount(e.target.value)}
                      placeholder="Valor do limite (ex: 500.00)"
                      className="w-full px-3 py-2 border rounded-lg"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateBudget}
                      className="flex-1"
                      disabled={!newBudgetAmount}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setNewBudgetCategory(null);
                        setNewBudgetAmount("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categories
                  .filter((cat) => !budgetedCategories.has(cat))
                  .map((category) => (
                    <Button
                      key={category}
                      variant="outline"
                      onClick={() => {
                        trigger("light");
                        setNewBudgetCategory(category);
                      }}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs text-muted-foreground">
                        {EXPENSE_CATEGORY_LABELS[category]}
                      </span>
                    </Button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

