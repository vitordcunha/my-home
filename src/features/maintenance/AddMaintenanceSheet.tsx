import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAddMaintenanceItem } from "./useAddMaintenanceItem";
import {
  MAINTENANCE_QUICK_ACTIONS,
  MaintenanceLocation,
  MaintenancePriority,
  MaintenanceActionType,
  LOCATION_LABELS,
  PRIORITY_LABELS,
  LOCATION_EMOJIS,
} from "./types";
import {
  Rocket,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Package,
} from "lucide-react";
import { getIconFromEmoji } from "@/lib/emoji-icons";

interface AddMaintenanceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  userId: string;
}

export function AddMaintenanceSheet({
  open,
  onOpenChange,
  householdId,
  userId,
}: AddMaintenanceSheetProps) {
  const [step, setStep] = useState<"quick" | "location" | "priority">("quick");
  const [title, setTitle] = useState("");
  const [actionType, setActionType] = useState<MaintenanceActionType>("diy");
  const [location, setLocation] = useState<MaintenanceLocation | null>(null);
  const [priority, setPriority] = useState<MaintenancePriority | null>(null);

  const addItem = useAddMaintenanceItem();

  const handleQuickAction = (
    action: (typeof MAINTENANCE_QUICK_ACTIONS)[number]
  ) => {
    setTitle(action.title);
    setActionType(action.action_type);
    setStep("location");
  };

  const handleSubmit = () => {
    if (!title || !location || !priority) return;

    addItem.mutate(
      {
        household_id: householdId,
        title,
        location,
        priority,
        action_type: actionType,
        created_by: userId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setStep("quick");
          setTitle("");
          setLocation(null);
          setPriority(null);
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <div className="space-y-6 pb-6">
          <div>
            <h2 className="text-2xl font-bold">Reportar Problema</h2>
            <p className="text-sm text-muted-foreground">
              Identifique um problema e ganhe +5 pts
            </p>
          </div>

          {step === "quick" && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Problemas Comuns
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {MAINTENANCE_QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-border hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors thumb-friendly"
                  >
                    {(() => {
                      const IconComponent =
                        getIconFromEmoji(action.emoji) || Package;
                      return (
                        <IconComponent className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                      );
                    })()}
                    <span className="text-xs font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "location" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Onde?
                </label>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {(Object.keys(LOCATION_LABELS) as MaintenanceLocation[])
                    .slice(0, 9)
                    .map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          setLocation(loc);
                          setStep("priority");
                        }}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-border hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors"
                      >
                        {(() => {
                          const IconComponent =
                            getIconFromEmoji(LOCATION_EMOJIS[loc]) || Package;
                          return (
                            <IconComponent className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                          );
                        })()}
                        <span className="text-xs font-medium">
                          {LOCATION_LABELS[loc]}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => setStep("quick")}
                className="w-full"
              >
                ← Voltar
              </Button>
            </div>
          )}

          {step === "priority" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Prioridade
                </label>
                <div className="space-y-3 mt-3">
                  {(
                    ["urgent", "important", "whenever"] as MaintenancePriority[]
                  ).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                        priority === p
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                          : "border-border hover:border-orange-500"
                      }`}
                    >
                      <div className="font-semibold">{PRIORITY_LABELS[p]}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!priority || addItem.isPending}
                className="w-full h-14 text-base font-semibold"
              >
                {addItem.isPending ? (
                  "Salvando..."
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Adicionar Item • +5 pts
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setStep("location")}
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
