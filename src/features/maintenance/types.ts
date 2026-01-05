import { Database } from "@/types/database";

export type MaintenanceItem = Database["public"]["Tables"]["maintenance_items"]["Row"];
export type MaintenanceItemInsert = Database["public"]["Tables"]["maintenance_items"]["Insert"];
export type MaintenanceItemUpdate = Database["public"]["Tables"]["maintenance_items"]["Update"];

export type MaintenanceHistory = Database["public"]["Tables"]["maintenance_history"]["Row"];
export type MaintenanceHistoryInsert = Database["public"]["Tables"]["maintenance_history"]["Insert"];

export type RecurringMaintenance = Database["public"]["Tables"]["recurring_maintenances"]["Row"];
export type RecurringMaintenanceInsert = Database["public"]["Tables"]["recurring_maintenances"]["Insert"];
export type RecurringMaintenanceUpdate = Database["public"]["Tables"]["recurring_maintenances"]["Update"];

export type MaintenanceLocation =
  | "cozinha"
  | "sala"
  | "quarto1"
  | "quarto2"
  | "quarto3"
  | "banheiro"
  | "lavanderia"
  | "area_externa"
  | "garagem"
  | "entrada"
  | "deposito"
  | "outro";

export type MaintenancePriority = "urgent" | "important" | "whenever";

export type MaintenanceActionType =
  | "call_technician"
  | "diy"
  | "waiting_parts"
  | "contact";

export type MaintenanceStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "archived";

export type FrequencyType = "days" | "weeks" | "months" | "years";

// Helper types with related data
export type MaintenanceItemWithCreator = MaintenanceItem & {
  creator?: {
    id: string;
    nome: string;
    avatar: string | null;
  };
  assigned?: {
    id: string;
    nome: string;
    avatar: string | null;
  };
};

// Quick actions for common maintenance issues
export const MAINTENANCE_QUICK_ACTIONS = [
  {
    emoji: "🚿",
    label: "Torneira",
    title: "Torneira pingando",
    action_type: "call_technician" as MaintenanceActionType,
    technician_specialty: "encanador",
  },
  {
    emoji: "💡",
    label: "Luz",
    title: "Lâmpada queimada",
    action_type: "diy" as MaintenanceActionType,
  },
  {
    emoji: "🚪",
    label: "Porta",
    title: "Porta emperrada",
    action_type: "diy" as MaintenanceActionType,
  },
  {
    emoji: "⚡",
    label: "Elétrica",
    title: "Problema elétrico",
    action_type: "call_technician" as MaintenanceActionType,
    technician_specialty: "eletricista",
  },
  {
    emoji: "🧹",
    label: "Limpeza",
    title: "Limpeza profunda",
    action_type: "diy" as MaintenanceActionType,
  },
  {
    emoji: "❄️",
    label: "AC",
    title: "Ar condicionado",
    action_type: "call_technician" as MaintenanceActionType,
    technician_specialty: "tecnico_ar",
  },
] as const;

// Location labels
export const LOCATION_LABELS: Record<MaintenanceLocation, string> = {
  cozinha: "Cozinha",
  sala: "Sala",
  quarto1: "Quarto 1",
  quarto2: "Quarto 2",
  quarto3: "Quarto 3",
  banheiro: "Banheiro",
  lavanderia: "Lavanderia",
  area_externa: "Área Externa",
  garagem: "Garagem",
  entrada: "Entrada",
  deposito: "Depósito",
  outro: "Outro",
};

// Location emojis
export const LOCATION_EMOJIS: Record<MaintenanceLocation, string> = {
  cozinha: "🍳",
  sala: "🛋️",
  quarto1: "🛏️",
  quarto2: "🛏️",
  quarto3: "🛏️",
  banheiro: "🚿",
  lavanderia: "🧺",
  area_externa: "🏡",
  garagem: "🅿️",
  entrada: "🚪",
  deposito: "📦",
  outro: "📍",
};

// Priority labels
export const PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  urgent: "Urgente",
  important: "Importante",
  whenever: "Quando der",
};

// Priority colors (Tailwind classes)
export const PRIORITY_COLORS: Record<
  MaintenancePriority,
  { bg: string; text: string; border: string }
> = {
  urgent: {
    bg: "bg-red-50 dark:bg-red-950",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-500",
  },
  important: {
    bg: "bg-amber-50 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500",
  },
  whenever: {
    bg: "bg-green-50 dark:bg-green-950",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-500",
  },
};

// Action type labels
export const ACTION_TYPE_LABELS: Record<MaintenanceActionType, string> = {
  call_technician: "Chamar Técnico",
  diy: "Fazer DIY",
  waiting_parts: "Aguardando Peças",
  contact: "Entrar em Contato",
};

// Action type emojis
export const ACTION_TYPE_EMOJIS: Record<MaintenanceActionType, string> = {
  call_technician: "👷",
  diy: "🛠️",
  waiting_parts: "📦",
  contact: "📞",
};

// Status labels
export const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  open: "Aberto",
  in_progress: "Em Andamento",
  waiting: "Aguardando",
  resolved: "Resolvido",
  archived: "Arquivado",
};

// Common technician specialties
export const TECHNICIAN_SPECIALTIES = [
  { value: "eletricista", label: "Eletricista", emoji: "⚡" },
  { value: "encanador", label: "Encanador", emoji: "🚰" },
  { value: "tecnico_ar", label: "Técnico de Ar", emoji: "❄️" },
  { value: "marceneiro", label: "Marceneiro", emoji: "🔨" },
  { value: "pintor", label: "Pintor", emoji: "🎨" },
  { value: "vidraceiro", label: "Vidraceiro", emoji: "🪟" },
  { value: "geral", label: "Serviços Gerais", emoji: "🔧" },
] as const;

// Common recurring maintenances (templates)
export const RECURRING_MAINTENANCE_TEMPLATES = [
  {
    title: "Trocar filtro do AC",
    emoji: "❄️",
    location: "sala",
    frequency_type: "months" as FrequencyType,
    frequency_value: 3,
    instructions: "1. Desligar o AC\n2. Abrir o painel frontal\n3. Remover filtro antigo\n4. Limpar ou substituir\n5. Recolocar e fechar",
  },
  {
    title: "Limpar caixa d'água",
    emoji: "💧",
    location: "area_externa",
    frequency_type: "months" as FrequencyType,
    frequency_value: 6,
    instructions: "Contratar empresa especializada para limpeza completa da caixa d'água",
  },
  {
    title: "Verificar extintores",
    emoji: "🧯",
    location: "outro",
    frequency_type: "years" as FrequencyType,
    frequency_value: 1,
    instructions: "Verificar validade, pressão e estado geral dos extintores",
  },
  {
    title: "Trocar pilhas do detector de fumaça",
    emoji: "🔋",
    location: "outro",
    frequency_type: "years" as FrequencyType,
    frequency_value: 1,
    instructions: "Substituir todas as pilhas dos detectores de fumaça",
  },
  {
    title: "Desentupir ralos",
    emoji: "🚿",
    location: "banheiro",
    frequency_type: "months" as FrequencyType,
    frequency_value: 2,
    instructions: "Aplicar desentupidor químico ou mecânico em todos os ralos",
  },
  {
    title: "Podar plantas",
    emoji: "🌿",
    location: "area_externa",
    frequency_type: "months" as FrequencyType,
    frequency_value: 1,
    instructions: "Podar plantas, árvores e arbustos do jardim",
  },
] as const;


