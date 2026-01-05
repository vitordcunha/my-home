import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export interface FilterState {
  assignedTo: string[];
  categories: string[];
  pointsRange: [number, number] | null;
  recurrenceType: string[];
  status: string[];
}

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  profiles?: Array<{ id: string; nome: string }>;
}

export function FilterSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  profiles = [],
}: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    const emptyFilters: FilterState = {
      assignedTo: [],
      categories: [],
      pointsRange: null,
      recurrenceType: [],
      status: [],
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const toggleArrayFilter = (
    key: keyof Pick<FilterState, "assignedTo" | "categories" | "recurrenceType" | "status">,
    value: string
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const activeFiltersCount =
    localFilters.assignedTo.length +
    localFilters.categories.length +
    localFilters.recurrenceType.length +
    localFilters.status.length +
    (localFilters.pointsRange ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl border-t">
        <div className="h-full flex flex-col">
          <SheetHeader className="space-y-3 pb-6">
            <SheetTitle className="text-xl">Filtros</SheetTitle>
            <SheetDescription>
              Refine sua busca com filtros avançados
            </SheetDescription>
          </SheetHeader>

          {/* Conteúdo com scroll */}
          <div className="flex-1 overflow-y-auto space-y-6 pb-6">
            {/* Atribuído a */}
            {profiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  👤 ATRIBUÍDO A
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profiles.map((profile) => (
                    <Badge
                      key={profile.id}
                      variant={
                        localFilters.assignedTo.includes(profile.id)
                          ? "default"
                          : "outline"
                      }
                      className="thumb-friendly cursor-pointer"
                      onClick={() =>
                        toggleArrayFilter("assignedTo", profile.id)
                      }
                    >
                      {profile.nome}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Categorias */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                📁 CATEGORIA
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Limpeza", "Cozinha", "Compras", "Pets", "Outros"].map(
                  (category) => (
                    <Badge
                      key={category}
                      variant={
                        localFilters.categories.includes(category)
                          ? "default"
                          : "outline"
                      }
                      className="thumb-friendly cursor-pointer"
                      onClick={() => toggleArrayFilter("categories", category)}
                    >
                      {category}
                    </Badge>
                  )
                )}
              </div>
            </div>

            {/* Pontos */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                ⭐ PONTOS
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "1-5 pts (Rápidas)", value: [1, 5] as [number, number] },
                  { label: "6-10 pts (Médias)", value: [6, 10] as [number, number] },
                  { label: "11-20 pts (Longas)", value: [11, 20] as [number, number] },
                  { label: "21+ pts (Desafios)", value: [21, 100] as [number, number] },
                ].map((range) => (
                  <Badge
                    key={range.label}
                    variant={
                      localFilters.pointsRange?.[0] === range.value[0]
                        ? "default"
                        : "outline"
                    }
                    className="thumb-friendly cursor-pointer"
                    onClick={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        pointsRange:
                          prev.pointsRange?.[0] === range.value[0]
                            ? null
                            : range.value,
                      }))
                    }
                  >
                    {range.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recorrência */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                🔄 RECORRÊNCIA
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Diárias", value: "daily" },
                  { label: "Semanais", value: "weekly" },
                  { label: "Únicas", value: "once" },
                ].map((type) => (
                  <Badge
                    key={type.value}
                    variant={
                      localFilters.recurrenceType.includes(type.value)
                        ? "default"
                        : "outline"
                    }
                    className="thumb-friendly cursor-pointer"
                    onClick={() =>
                      toggleArrayFilter("recurrenceType", type.value)
                    }
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                ✅ STATUS
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Pendentes", value: "pending" },
                  { label: "Concluídas hoje", value: "completed_today" },
                  { label: "Concluídas esta semana", value: "completed_week" },
                ].map((status) => (
                  <Badge
                    key={status.value}
                    variant={
                      localFilters.status.includes(status.value)
                        ? "default"
                        : "outline"
                    }
                    className="thumb-friendly cursor-pointer"
                    onClick={() => toggleArrayFilter("status", status.value)}
                  >
                    {status.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Footer com botões */}
          <div className="flex gap-3 pt-4 border-t safe-area-inset-bottom">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1 rounded-xl font-medium h-12"
            >
              Limpar Filtros
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 rounded-xl font-medium h-12"
            >
              Aplicar ({activeFiltersCount})
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Componente de chips de filtros ativos
interface ActiveFiltersChipsProps {
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState, value?: string) => void;
  profiles?: Array<{ id: string; nome: string }>;
}

export function ActiveFiltersChips({
  filters,
  onRemoveFilter,
  profiles = [],
}: ActiveFiltersChipsProps) {
  const chips: Array<{ key: keyof FilterState; value: string; label: string }> = [];

  // Assigned to
  filters.assignedTo.forEach((id) => {
    const profile = profiles.find((p) => p.id === id);
    if (profile) {
      chips.push({
        key: "assignedTo",
        value: id,
        label: `👤 ${profile.nome}`,
      });
    }
  });

  // Categories
  filters.categories.forEach((cat) => {
    chips.push({ key: "categories", value: cat, label: `📁 ${cat}` });
  });

  // Points range
  if (filters.pointsRange) {
    chips.push({
      key: "pointsRange",
      value: "",
      label: `⭐ ${filters.pointsRange[0]}-${filters.pointsRange[1]} pts`,
    });
  }

  // Recurrence
  const recurrenceLabels: Record<string, string> = {
    daily: "Diárias",
    weekly: "Semanais",
    once: "Únicas",
  };
  filters.recurrenceType.forEach((type) => {
    chips.push({
      key: "recurrenceType",
      value: type,
      label: `🔄 ${recurrenceLabels[type]}`,
    });
  });

  // Status
  const statusLabels: Record<string, string> = {
    pending: "Pendentes",
    completed_today: "Concluídas hoje",
    completed_week: "Concluídas esta semana",
  };
  filters.status.forEach((status) => {
    chips.push({
      key: "status",
      value: status,
      label: `✅ ${statusLabels[status]}`,
    });
  });

  if (chips.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
      {chips.map((chip, index) => (
        <Badge
          key={`${chip.key}-${chip.value}-${index}`}
          variant="secondary"
          className="shrink-0 snap-start flex items-center gap-2 px-3 py-2 h-9"
        >
          <span className="text-sm">{chip.label}</span>
          <button
            onClick={() => onRemoveFilter(chip.key, chip.value)}
            className="hover:bg-background/50 rounded-full p-0.5 transition-colors"
            aria-label={`Remover filtro ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}


