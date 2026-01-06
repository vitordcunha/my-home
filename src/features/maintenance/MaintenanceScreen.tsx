import { useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { useMaintenanceItemsQuery } from "./useMaintenanceItemsQuery";
import { AddMaintenanceSheet } from "./AddMaintenanceSheet";
import { MaintenanceItemCard } from "./MaintenanceItemCard";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Loader2, Wrench, Lightbulb, Circle } from "lucide-react";

export function MaintenanceScreen() {
  const { user } = useAuth();
  const { data: profile } = useProfileQuery(user?.id);
  const { data: items, isLoading } = useMaintenanceItemsQuery({
    householdId: profile?.household_id || undefined,
  });

  const [showAddSheet, setShowAddSheet] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4 animate-in">
            <div className="relative h-12 w-12 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/20 to-orange-500/5 animate-pulse"></div>
              <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Carregando manutenções...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const urgentItems = items?.filter((item) => item.priority === "urgent") || [];
  const importantItems =
    items?.filter((item) => item.priority === "important") || [];
  const wheneverItems =
    items?.filter((item) => item.priority === "whenever") || [];

  const hasItems = items && items.length > 0;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Manutenção</h2>
          <p className="text-base text-muted-foreground">
            {hasItems
              ? `${items.length} ${
                  items.length === 1 ? "item" : "itens"
                } para resolver`
              : "Tudo funcionando perfeitamente!"}
          </p>
        </div>

        {/* Empty state */}
        {!hasItems && (
          <div className="text-center py-16 space-y-6 animate-in">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
              <Wrench className="h-12 w-12 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Nenhum item pendente</h3>
              <p className="text-muted-foreground">
                A casa está em perfeitas condições!
              </p>
            </div>
          </div>
        )}

        {/* Urgent Items */}
        {urgentItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Circle className="h-4 w-4 fill-red-500 text-red-500" />
                Urgente ({urgentItems.length})
              </h3>
            </div>
            {urgentItems.map((item) => (
              <MaintenanceItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Important Items */}
        {importantItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Circle className="h-4 w-4 fill-amber-500 text-amber-500" />
                Importante ({importantItems.length})
              </h3>
            </div>
            {importantItems.map((item) => (
              <MaintenanceItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Whenever Items */}
        {wheneverItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Circle className="h-4 w-4 fill-green-500 text-green-500" />
                Quando der ({wheneverItems.length})
              </h3>
            </div>
            {wheneverItems.map((item) => (
              <MaintenanceItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border border-orange-200 dark:border-orange-900 rounded-2xl p-5 space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Como funciona?
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • Reportar problema:{" "}
              <span className="font-semibold text-foreground">+5 pts</span>
            </li>
            <li>
              • Assumir tarefa:{" "}
              <span className="font-semibold text-foreground">+5 pts</span>
            </li>
            <li>
              • Resolver DIY:{" "}
              <span className="font-semibold text-foreground">+50 pts</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => setShowAddSheet(true)}
        ariaLabel="Reportar item"
        variant="orange"
        size="md"
      />

      {/* Add maintenance sheet */}
      <AddMaintenanceSheet
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        householdId={profile?.household_id || ""}
        userId={user?.id || ""}
      />
    </>
  );
}

