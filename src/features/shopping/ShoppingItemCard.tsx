import { useState } from "react";
import { ShoppingItem } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

interface ShoppingItemCardProps {
  item: ShoppingItem;
  isSelected: boolean;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  profiles?: Array<{ id: string; nome: string }>;
}

const categoryLabels: Record<string, string> = {
  alimentos: "Alimentos",
  limpeza: "Limpeza",
  higiene: "Higiene",
  outros: "Outros",
};

export function ShoppingItemCard({
  item,
  isSelected,
  onToggle,
  onDelete,
  profiles,
}: ShoppingItemCardProps) {
  const [showDelete, setShowDelete] = useState(false);

  const addedByProfile = profiles?.find((p) => p.id === item.added_by);
  const addedByName = addedByProfile?.nome || "Alguém";

  const handleLongPress = () => {
    setShowDelete(true);
  };

  return (
    <div
      className={`bg-card border-2 rounded-2xl p-4 flex items-center gap-4 transition-all ${
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/30"
      } animate-in`}
      onContextMenu={(e) => {
        e.preventDefault();
        handleLongPress();
      }}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(item.id)}
        className="h-6 w-6 rounded-lg"
      />

      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shrink-0 text-3xl">
        {item.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <h3
          className="font-semibold text-base leading-tight truncate"
          title={item.name}
        >
          {item.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center px-2 py-0.5 bg-secondary/60 rounded-full text-xs font-medium text-secondary-foreground">
            {categoryLabels[item.category || "outros"]}
          </span>
          <p className="text-xs text-muted-foreground">
            {addedByName} · {formatDistanceToNow(item.added_at)}
          </p>
        </div>
        {item.notes && (
          <p
            className="text-xs text-muted-foreground mt-1 line-clamp-1"
            title={item.notes}
          >
            {item.notes}
          </p>
        )}
      </div>

      {showDelete && (
        <Button
          onClick={() => {
            if (confirm(`Remover "${item.name}" da lista?`)) {
              onDelete(item.id);
            }
            setShowDelete(false);
          }}
          variant="ghost"
          size="sm"
          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

