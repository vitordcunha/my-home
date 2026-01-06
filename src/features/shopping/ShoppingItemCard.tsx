import { useState } from "react";
import { ShoppingItem } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { useSwipeable } from "react-swipeable";
import { useHaptic } from "@/hooks/useHaptic";

interface ShoppingItemCardProps {
  item: ShoppingItem;
  isSelected: boolean;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  profiles?: Array<{ id: string; nome: string; avatar?: string | null }>;
  isDeleting?: boolean;
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
  isDeleting = false,
}: ShoppingItemCardProps) {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [hapticFired, setHapticFired] = useState(false);
  const { trigger } = useHaptic();
  
  const addedByProfile = profiles?.find((p) => p.id === item.added_by);
  const addedByName = addedByProfile?.nome || "Alguém";

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (e) => {
      const minSwipeDistance = 100;
      const swipeDistance = Math.abs(e.deltaX);
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const isSignificant = swipeDistance >= minSwipeDistance * 0.6;

      if (isHorizontal && isSignificant) {
        // Swipe esquerda = remover
        onDelete(item.id);
      }
      setSwipeProgress(0);
      setSwipeDirection(null);
      setHapticFired(false);
    },
    onSwiping: (e) => {
      // Ignora swipe se o movimento vertical for maior que o horizontal (scroll)
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        setSwipeProgress(0);
        setSwipeDirection(null);
        return;
      }

      // Apenas swipe para esquerda (deletar)
      if (e.deltaX > 0) {
        setSwipeProgress(0);
        setSwipeDirection(null);
        return;
      }

      const swipeDistance = 200;
      const progress = Math.abs(e.deltaX) / swipeDistance;
      const clampedProgress = Math.min(progress, 1);
      setSwipeProgress(clampedProgress);
      setSwipeDirection("left");

      // Haptic feedback ao atingir threshold (70%)
      if (clampedProgress > 0.7 && !hapticFired) {
        trigger("medium");
        setHapticFired(true);
      }
    },
    onSwiped: () => {
      setSwipeProgress(0);
      setSwipeDirection(null);
      setHapticFired(false);
    },
    trackTouch: true,
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 40,
    touchEventOptions: { passive: false },
  });

  // Estilo dinâmico para swipe
  const swipeStyle = {
    transform: `translateX(${swipeProgress * -100}px)`,
    transition: swipeProgress === 0 ? "transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)" : "none",
    willChange: swipeProgress > 0 ? "transform" : "auto",
  };

  const showDeleteIndicator = swipeDirection === "left" && swipeProgress > 0.4;
  const thresholdReached = swipeProgress > 0.7;

  return (
    <div className="relative overflow-hidden">
      {/* Background delete indicator */}
      {showDeleteIndicator && (
        <div
          className="absolute inset-0 bg-destructive/10 flex items-center justify-end pr-6 z-0"
          style={{
            opacity: swipeProgress,
          }}
        >
          <div
            className={`flex items-center gap-2 text-destructive transition-all ${
              thresholdReached ? "scale-110" : "scale-100"
            }`}
          >
            <Trash2 className="h-5 w-5" />
            <span className="font-semibold text-sm">Remover</span>
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        {...swipeHandlers}
        style={swipeStyle}
        className={`relative bg-card border-2 rounded-2xl p-4 flex items-center gap-4 transition-all z-10 ${
          isSelected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border hover:border-primary/30"
        } animate-in`}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(item.id)}
          className="h-6 w-6 rounded-lg shrink-0"
        />

        {/* Item image/emoji */}
        <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 shrink-0 overflow-hidden">
          {item.emoji ? (
            <span className="text-3xl">{item.emoji}</span>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/10" />
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
                <Avatar className="h-5 w-5 border border-border/50 shrink-0">
                  <AvatarImage src={addedByProfile.avatar || undefined} />
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
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
      </div>
    </div>
  );
}

