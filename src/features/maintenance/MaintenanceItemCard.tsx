import {
  MaintenanceItemWithCreator,
  LOCATION_EMOJIS,
  ACTION_TYPE_LABELS,
  PRIORITY_COLORS,
} from "./types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MaintenanceItemCardProps {
  item: MaintenanceItemWithCreator;
}

export function MaintenanceItemCard({ item }: MaintenanceItemCardProps) {
  const priorityColor = PRIORITY_COLORS[item.priority];
  const locationEmoji = LOCATION_EMOJIS[item.location] || "📍";

  return (
    <div
      className={cn(
        "bg-card border-2 rounded-xl p-4 space-y-3 hover-lift",
        priorityColor.border,
        priorityColor.bg
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-tight mb-2">
            {item.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {locationEmoji} {item.location}
            </span>
            <span>•</span>
            <span>{ACTION_TYPE_LABELS[item.action_type]}</span>
            {item.estimated_cost && (
              <>
                <span>•</span>
                <span>
                  ~{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.estimated_cost)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {item.assigned && (
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
          <span>👤 {item.assigned.nome} está resolvendo</span>
        </div>
      )}

      {!item.assigned && (
        <div className="text-xs text-muted-foreground">
          Reportado{" "}
          {(() => {
            try {
              const date = new Date(item.created_at);
              if (isNaN(date.getTime())) return "recentemente";
              return formatDistanceToNow(date, {
                locale: ptBR,
                addSuffix: true,
              });
            } catch {
              return "recentemente";
            }
          })()}
        </div>
      )}

      {item.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {item.description}
        </p>
      )}
    </div>
  );
}

