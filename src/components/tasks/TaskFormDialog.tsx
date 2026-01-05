import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useProfileQuery } from "@/features/auth/useProfileQuery";
import { useCreateTask } from "@/features/tasks/useCreateTask";
import { useUpdateTask } from "@/features/tasks/useUpdateTask";
import { useProfilesQuery } from "@/features/auth/useProfilesQuery";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: {
    id: string;
    nome: string;
    descricao: string | null;
    xp_value: number;
    recurrence_type: "daily" | "weekly" | "once";
    days_of_week: number[] | null;
    assigned_to: string | null;
  };
}

const daysOfWeekOptions = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export default function TaskFormDialog({
  open,
  onOpenChange,
  task,
}: TaskFormDialogProps) {
  const { user } = useAuth();
  const { data: currentProfile } = useProfileQuery(user?.id);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: profiles, isLoading: isLoadingProfiles } = useProfilesQuery();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [xpValue, setXpValue] = useState(20);
  const [recurrenceType, setRecurrenceType] = useState<
    "daily" | "weekly" | "once"
  >("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);
  const [assignedTo, setAssignedTo] = useState<string>("");

  // Reset form when opening/closing or when task changes
  useEffect(() => {
    if (open && task) {
      // Editing existing task
      setNome(task.nome);
      setDescricao(task.descricao || "");
      setXpValue(task.xp_value);
      setRecurrenceType(task.recurrence_type);
      setSelectedDays(task.days_of_week || [0, 1, 2, 3, 4, 5, 6]);
      setAssignedTo(task.assigned_to || "");
    } else if (open && !task) {
      // Creating new task - reset to defaults
      setNome("");
      setDescricao("");
      setXpValue(20);
      setRecurrenceType("daily");
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setAssignedTo("");
    }
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      return;
    }

    const taskData = {
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      xp_value: xpValue,
      recurrence_type: recurrenceType,
      days_of_week: recurrenceType === "weekly" ? selectedDays : undefined,
      assigned_to: assignedTo || undefined,
    };

    if (task) {
      // Update existing task
      await updateTask.mutateAsync({
        id: task.id,
        ...taskData,
      });
    } else {
      // Create new task
      if (!currentProfile?.household_id) {
        return;
      }
      await createTask.mutateAsync({
        ...taskData,
        created_by: user!.id,
        household_id: currentProfile.household_id,
      });
    }

    onOpenChange(false);
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const isLoading = createTask.isPending || updateTask.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</SheetTitle>
          <SheetDescription>
            {task
              ? "Atualize as informações da tarefa"
              : "Crie uma nova tarefa para a casa"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Nome */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium mb-2">
              Nome da Tarefa *
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              maxLength={100}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Lavar Louça"
            />
          </div>

          {/* Descrição */}
          <div>
            <label
              htmlFor="descricao"
              className="block text-sm font-medium mb-2"
            >
              Descrição (opcional)
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Detalhes sobre a tarefa..."
            />
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Responsável (opcional)
            </label>
            {isLoadingProfiles ? (
              <div className="text-sm text-muted-foreground">
                Carregando usuários...
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAssignedTo("")}
                  className={`w-full py-3 px-4 rounded-md border-2 transition-all thumb-friendly flex items-center gap-3 ${
                    assignedTo === ""
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                    👤
                  </div>
                  <span>Sem responsável</span>
                </button>
                {profiles?.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setAssignedTo(profile.id)}
                    className={`w-full py-3 px-4 rounded-md border-2 transition-all thumb-friendly flex items-center gap-3 ${
                      assignedTo === profile.id
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt={profile.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-sm">
                          {profile.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="truncate" title={profile.nome}>
                        {profile.nome}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {profile.total_points} XP
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* XP Value */}
          <div>
            <label htmlFor="xp" className="block text-sm font-medium mb-2">
              Pontos (XP) *
            </label>
            <div className="flex items-center gap-4">
              <input
                id="xp"
                type="number"
                value={xpValue}
                onChange={(e) =>
                  setXpValue(Math.max(1, parseInt(e.target.value) || 1))
                }
                required
                min="1"
                max="1000"
                className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Badge variant="secondary" className="text-base">
                ⭐ {xpValue}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Quanto mais difícil a tarefa, mais pontos
            </p>
          </div>

          {/* Recurrence Type */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Tipo de Recorrência *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecurrenceType("daily")}
                className={`py-3 px-4 rounded-md border-2 transition-all thumb-friendly ${
                  recurrenceType === "daily"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:border-primary/50"
                }`}
              >
                Diária
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceType("weekly")}
                className={`py-3 px-4 rounded-md border-2 transition-all thumb-friendly ${
                  recurrenceType === "weekly"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:border-primary/50"
                }`}
              >
                Semanal
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceType("once")}
                className={`py-3 px-4 rounded-md border-2 transition-all thumb-friendly ${
                  recurrenceType === "once"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:border-primary/50"
                }`}
              >
                Única
              </button>
            </div>
          </div>

          {/* Days of Week (only for weekly) */}
          {recurrenceType === "weekly" && (
            <div>
              <label className="block text-sm font-medium mb-3">
                Dias da Semana *
              </label>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeekOptions.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`py-3 rounded-md border-2 transition-all text-sm font-medium thumb-friendly ${
                      selectedDays.includes(day.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {selectedDays.length === 0 && (
                <p className="text-xs text-destructive mt-2">
                  Selecione pelo menos um dia
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 thumb-friendly"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 thumb-friendly"
              disabled={
                isLoading ||
                !nome.trim() ||
                (recurrenceType === "weekly" && selectedDays.length === 0)
              }
            >
              {isLoading ? "Salvando..." : task ? "Atualizar" : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
