import { 
  ShoppingCart, 
  Sparkles, 
  Receipt, 
  Wrench,
  LucideIcon 
} from "lucide-react";

export type CategoryType = "market" | "cleaning" | "bills" | "maintenance" | "other";

export interface Category {
  id: CategoryType;
  name: string;
  icon: LucideIcon;
  color: string;
  lightBg: string;
  darkBg: string;
}

export const categories: Record<CategoryType, Category> = {
  market: {
    id: "market",
    name: "Mercado",
    icon: ShoppingCart,
    color: "hsl(142 65% 52%)", // Verde
    lightBg: "from-emerald-100 to-green-50",
    darkBg: "dark:from-emerald-900/30 dark:to-green-900/20",
  },
  cleaning: {
    id: "cleaning",
    name: "Limpeza",
    icon: Sparkles,
    color: "hsl(199 89% 48%)", // Azul
    lightBg: "from-blue-100 to-cyan-50",
    darkBg: "dark:from-blue-900/30 dark:to-cyan-900/20",
  },
  bills: {
    id: "bills",
    name: "Contas",
    icon: Receipt,
    color: "hsl(271 91% 65%)", // Roxo
    lightBg: "from-purple-100 to-violet-50",
    darkBg: "dark:from-purple-900/30 dark:to-violet-900/20",
  },
  maintenance: {
    id: "maintenance",
    name: "Manutenção",
    icon: Wrench,
    color: "hsl(43 96% 56%)", // Amarelo
    lightBg: "from-amber-100 to-yellow-50",
    darkBg: "dark:from-amber-900/30 dark:to-yellow-900/20",
  },
  other: {
    id: "other",
    name: "Outro",
    icon: Sparkles,
    color: "hsl(240 5% 50%)", // Cinza
    lightBg: "from-gray-100 to-slate-50",
    darkBg: "dark:from-gray-900/30 dark:to-slate-900/20",
  },
};

export function getCategoryColor(category?: CategoryType): string {
  if (!category) return categories.other.color;
  return categories[category]?.color || categories.other.color;
}

export function getCategoryIcon(category?: CategoryType): LucideIcon {
  if (!category) return categories.other.icon;
  return categories[category]?.icon || categories.other.icon;
}

export function getCategoryName(category?: CategoryType): string {
  if (!category) return categories.other.name;
  return categories[category]?.name || categories.other.name;
}

export function getCategoryGradient(category?: CategoryType): string {
  if (!category) return `${categories.other.lightBg} ${categories.other.darkBg}`;
  const cat = categories[category] || categories.other;
  return `${cat.lightBg} ${cat.darkBg}`;
}

