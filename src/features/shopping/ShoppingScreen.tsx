import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { useProfilesQuery } from "@/features/auth/useProfilesQuery";
import { useShoppingItemsQuery } from "./useShoppingItemsQuery";
import { useAddShoppingItem } from "./useAddShoppingItem";
import { useCompleteShoppingTrip } from "./useCompleteShoppingTrip";

import { useDeleteShoppingItem } from "./useDeleteShoppingItem";
import { useAddExpense } from "@/features/expenses/useAddExpense";
import { AddItemSheet } from "./AddItemSheet";
import { CompleteShoppingSheet } from "./CompleteShoppingSheet";
import { ReceiptPreviewSheet } from "./ReceiptPreviewSheet";
import { ShoppingItemCard } from "./ShoppingItemCard";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Sparkles, ScanLine, X, Check } from "lucide-react";
import { ShoppingCategory } from "./types";
import { ShoppingListSkeleton } from "@/components/skeletons/ShoppingSkeleton";
import { motion, AnimatePresence } from "framer-motion";

import { PullToRefreshWrapper } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";

const STORAGE_KEY = "shopping-cart-selection";

export function ShoppingScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
  const [showReceiptSheet, setShowReceiptSheet] = useState(false);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      console.error("Failed to parse selected items", e);
      return new Set();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selectedItems)));
    } catch (e) {
      console.error("Failed to save selected items", e);
    }
  }, [selectedItems]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

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
    const item = items?.find((i) => i.id === itemId);
    if (!item) return;

    deleteItem.mutate({
      itemId,
      itemName: item.name,
      householdId: profile?.household_id ?? undefined,
      addedBy: item.added_by,
      isPurchased: item.is_purchased,
    });

    // Remove from selection if was selected
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  // --- Logic for Receipt Scanner ---
  const { mutate: addExpense } = useAddExpense();

  const handleSaveReceipt = (data: import("./ReceiptPreviewSheet").ReceiptData) => {
    if (!user?.id || !profile?.household_id) return;

    // 1. Identify matched items in the shopping list (using AI results)
    const matchedItemIds = data.items
      .map(item => item.matched_shopping_item_id)
      .filter((id): id is string => !!id);

    // 2. Mark matched items as purchased
    if (matchedItemIds.length > 0) {
      completeTrip.mutate({
        itemIds: matchedItemIds,
        userId: user.id,
        householdId: profile.household_id,
      });
    }

    // 3. Create the Expense Record
    addExpense({
      household_id: profile.household_id,
      description: data.establishment_name || "Compra via Scanner",
      amount: data.total_amount,
      category: "mercado",
      paid_by: user.id,
      paid_at: data.purchase_date || new Date().toISOString(),
      is_split: false,
      is_recurring: false,
      created_by: user.id,
    });

    setShowReceiptSheet(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Lista de Compras
          </h2>
          <p className="text-base text-muted-foreground">Carregando...</p>
        </div>
        <ShoppingListSkeleton />
      </div>
    );
  }

  const hasItems = items && items.length > 0;
  const hasSelection = selectedItems.size > 0;

  return (
    <>
      <PullToRefreshWrapper onRefresh={handleRefresh}>
        <div className="space-y-8">

          {/* Header */}
          {/* Header */}
          <PageHeader
            title="Lista de Compras"
            description={
              hasItems
                ? `${items.length} ${items.length === 1 ? "item" : "itens"
                } para comprar`
                : "Tudo abastecido por aqui!"
            }
            actions={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReceiptSheet(true)}
                className="rounded-full h-10 w-10 hover:bg-muted"
                aria-label="Escanear Nota"
              >
                <ScanLine className="h-5 w-5 text-muted-foreground" />
              </Button>
            }
          />

          {/* Empty state */}
          {!hasItems && (
            <div className="text-center py-16 space-y-6 animate-in">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-muted">
                <Sparkles className="h-12 w-12 text-success" />
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
            <div className="space-y-3 pb-24">
              <AnimatePresence mode="popLayout">
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
              </AnimatePresence>
            </div>
          )}

          {/* Info box */}
          <div className="bg-muted border rounded-2xl p-5 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Como funciona?
            </h4>
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
      </PullToRefreshWrapper>


      {/* Floating Action Button - Super fast access */}
      {/* Floating Action Button - Always visible */}
      <FloatingActionButton
        onClick={() => setShowAddSheet(true)}
        ariaLabel="Reportar item faltando"
        variant="primary"
        size="sm"
      />

      {/* Selection Action Bar - Side by side with FAB */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ x: 20, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 20, opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 right-20 z-40 max-w-[calc(100vw-6rem)]"
          >
            <div className="bg-card/95 backdrop-blur-md text-card-foreground h-12 pl-1 pr-1 rounded-full shadow-2xl flex items-center gap-3 border border-border">
              <button
                onClick={() => setSelectedItems(new Set())}
                className="bg-muted hover:bg-muted/80 text-muted-foreground h-10 w-10 flex items-center justify-center rounded-full transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col shrink-0 min-w-0">
                <span className="font-bold text-xs leading-none whitespace-nowrap">{selectedItems.size} itens</span>
                <span className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5 whitespace-nowrap">+{50 + selectedItems.size * 5} XP</span>
              </div>

              <div className="h-4 w-px bg-border mx-1 shrink-0" />

              <Button
                onClick={handleOpenCompleteSheet}
                disabled={completeTrip.isPending}
                size="sm"
                className="h-10 rounded-full px-4 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Concluir
                <Check className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Receipt Preview Sheet */}
      <ReceiptPreviewSheet
        open={showReceiptSheet}
        onOpenChange={setShowReceiptSheet}
        householdId={profile?.household_id || undefined}
        onSave={handleSaveReceipt}
        shoppingListItems={items?.map(i => ({ id: i.id, name: i.name })) || []}
      />
    </>
  );
}
