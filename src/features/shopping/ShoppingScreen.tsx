import { useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { useProfilesQuery } from "@/features/auth/useProfilesQuery";
import { useShoppingItemsQuery } from "./useShoppingItemsQuery";
import { useAddShoppingItem } from "./useAddShoppingItem";
import { useCompleteShoppingTrip } from "./useCompleteShoppingTrip";
import { useDeleteShoppingItem } from "./useDeleteShoppingItem";
import { AddItemSheet } from "./AddItemSheet";
import { CompleteShoppingSheet } from "./CompleteShoppingSheet";
import { ShoppingItemCard } from "./ShoppingItemCard";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ShoppingCart } from "lucide-react";
import { ShoppingCategory } from "./types";

export function ShoppingScreen() {
  const { user } = useAuth();
  const { data: profile } = useProfileQuery(user?.id);
  const { data: profiles } = useProfilesQuery();
  const { data: items, isLoading } = useShoppingItemsQuery(
    profile?.household_id || undefined
  );
  const addItem = useAddShoppingItem();
  const completeTrip = useCompleteShoppingTrip();
  const deleteItem = useDeleteShoppingItem();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showCompleteSheet, setShowCompleteSheet] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleAddItem = (data: {
    name: string;
    category: ShoppingCategory;
    emoji: string;
  }) => {
    if (!profile?.household_id || !user?.id) return;

    addItem.mutate(
      {
        householdId: profile.household_id,
        userId: user.id,
        ...data,
      },
      {
        onSuccess: () => {
          setShowAddSheet(false);
        },
      }
    );
  };

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleOpenCompleteSheet = () => {
    if (!user?.id || selectedItems.size === 0) return;
    setShowCompleteSheet(true);
  };

  const handleCompleteTrip = (data: {
    amount?: number;
    isSplit: boolean;
    splitWith: string[];
  }) => {
    if (!user?.id || !profile?.household_id) return;

    const itemIds = Array.from(selectedItems);

    completeTrip.mutate(
      {
        itemIds,
        userId: user.id,
        householdId: profile.household_id,
        expenseData: data.amount
          ? {
              amount: data.amount,
              isSplit: data.isSplit,
              splitWith: data.splitWith,
            }
          : undefined,
      },
      {
        onSuccess: () => {
          setSelectedItems(new Set());
          setShowCompleteSheet(false);
        },
      }
    );
  };

  const handleDeleteItem = (itemId: string) => {
    deleteItem.mutate(itemId);
    // Remove from selection if was selected
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4 animate-in">
            <div className="relative h-12 w-12 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 animate-pulse"></div>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Carregando lista...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasItems = items && items.length > 0;
  const hasSelection = selectedItems.size > 0;

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Lista de Compras
          </h2>
          <p className="text-base text-muted-foreground">
            {hasItems
              ? `${items.length} ${
                  items.length === 1 ? "item" : "itens"
                } para comprar`
              : "Tudo abastecido por aqui!"}
          </p>
        </div>

        {/* Complete trip button (shows when items are selected) */}
        {hasSelection && (
          <Button
            onClick={handleOpenCompleteSheet}
            size="lg"
            className="w-full rounded-xl shadow-md hover:shadow-lg transition-all gap-2 thumb-friendly bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            disabled={completeTrip.isPending}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">
              Finalizar Compras ({selectedItems.size}) • +
              {50 + selectedItems.size * 5} pts
            </span>
          </Button>
        )}

        {/* Empty state */}
        {!hasItems && (
          <div className="text-center py-16 space-y-6 animate-in">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
              <span className="text-6xl">✨</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Lista vazia!</h3>
              <p className="text-muted-foreground">
                Quando algo acabar, adicione aqui para ganhar pontos.
              </p>
            </div>
          </div>
        )}

        {/* Shopping list */}
        {hasItems && (
          <div className="space-y-3">
            {items.map((item) => (
              <ShoppingItemCard
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
                profiles={profiles}
              />
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 space-y-2">
          <h4 className="font-semibold text-sm">💡 Como funciona?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • Reportar item que acabou:{" "}
              <span className="font-semibold text-foreground">+5 pts</span>
            </li>
            <li>
              • Fazer compras:{" "}
              <span className="font-semibold text-foreground">
                +50 pts + 5 pts por item
              </span>
            </li>
            <li>• Quanto mais itens comprar, mais pontos ganha!</li>
          </ul>
        </div>
      </div>

      {/* Floating Action Button - Super fast access */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="group fixed bottom-24 right-6 z-30 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-soft-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
        aria-label="Reportar item faltando"
      >
        <Plus className="h-6 w-6 transition-transform group-hover:rotate-90 duration-200" />
      </button>

      {/* Add item sheet */}
      <AddItemSheet
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        onSubmit={handleAddItem}
        isPending={addItem.isPending}
      />

      {/* Complete shopping sheet */}
      <CompleteShoppingSheet
        open={showCompleteSheet}
        onOpenChange={setShowCompleteSheet}
        selectedCount={selectedItems.size}
        xpToEarn={50 + selectedItems.size * 5}
        householdId={profile?.household_id || undefined}
        userId={user?.id || ""}
        onComplete={handleCompleteTrip}
        isPending={completeTrip.isPending}
      />
    </>
  );
}
