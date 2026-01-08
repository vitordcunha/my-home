
import { ShoppingItem } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";

interface ShoppingItemCardProps {
  item: ShoppingItem;
  isSelected: boolean;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  profiles?: Array<{ id: string; nome: string; avatar?: string | null }>;
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
  const x = useMotionValue(0);
  const { trigger } = useHaptic();

  // Opacity/Color logic based on drag
  const opacity = useTransform(x, [-100, 0], [1, 0]);
  const deleteIconScale = useTransform(x, [-100, -50], [1.2, 0.8]);

  const addedByProfile = profiles?.find((p) => p.id === item.added_by);
  const addedByName = addedByProfile?.nome || "Alguém";

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      trigger("success");
      onDelete(item.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileTap={{ scale: 0.98 }}
      className="relative mb-3 group"
    >
      {/* Background delete indicator */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 bg-destructive/10 rounded-2xl flex items-center justify-end pr-6 pointer-events-none"
      >
        <motion.div style={{ scale: deleteIconScale }} className="text-destructive flex items-center gap-2">
          <span className="font-semibold text-sm">Remover</span>
          <Trash2 className="h-5 w-5" />
        </motion.div>
      </motion.div>

      {/* Card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0.05 }}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`relative bg-card rounded-2xl p-4 flex items-center gap-4 transition-colors z-10 
          ${isSelected
            ? "ring-1 ring-primary/20 bg-primary/5"
            : "border border-border/40 shadow-sm hover:border-primary/20"
          }`}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(item.id)}
          className="h-5 w-5 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />

        {/* Item image/emoji */}
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-muted/50 shrink-0 overflow-hidden text-2xl">
          {item.emoji ? (
            <span className="text-3xl">{item.emoji}</span>
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>

        {/* Item details */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-base leading-tight truncate text-foreground"
            title={item.name}
          >
            {item.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 bg-secondary/60 rounded-full text-xs font-medium text-secondary-foreground">
              {categoryLabels[item.category || "outros"]}
            </span>
          </div>
          {item.notes && (
            <p
              className="text-xs text-muted-foreground mt-1.5 line-clamp-1"
              title={item.notes}
            >
              {item.notes}
            </p>
          )}
          {/* Who added and when */}
          <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/50">
            {addedByProfile ? (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5 border border-border shrink-0">
                  <AvatarImage src={addedByProfile.avatar || undefined} />
                  <AvatarFallback className="text-[9px] bg-muted text-foreground">
                    {addedByProfile.nome[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground font-medium">
                  {addedByName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {addedByName}
                </span>
              </div>
            )}
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(item.added_at)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

