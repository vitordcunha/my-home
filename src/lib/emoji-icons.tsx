import {
  Home,
  Zap,
  ShoppingCart,
  UtensilsCrossed,
  Sparkles,
  Wrench,
  Pencil,
  Package,
  Lightbulb,
  Droplets,
  Globe,
  Flame,
  Sofa,
  Bed,
  Shirt,
  ParkingCircle,
  DoorOpen,
  MapPin,
  HardHat,
  Hammer,
  Phone,
  Snowflake,
  Paintbrush,
  Battery,
  FireExtinguisher,
  Sprout,
  Coffee,
  Apple,
  Crown,
  User,
  Star,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Rocket,
  Plus,
  RefreshCw,
  Gift,
  Wallet,
  TrendingUp,
  TrendingDown,
  PartyPopper,
  Circle,
  Square,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// Mapeamento de emojis para componentes de ícones
export const emojiToIcon: Record<string, LucideIcon> = {
  // Casa e locais
  "🏠": Home,
  "🏡": Home,
  "🛋️": Sofa,
  "🛏️": Bed,
  "🚿": Droplets,
  "🚪": DoorOpen,
  "🍳": UtensilsCrossed,
  "🧺": Shirt,
  "🅿️": ParkingCircle,
  "📍": MapPin,

  // Categorias de despesas
  "⚡": Zap,
  "🛒": ShoppingCart,
  "🍽️": UtensilsCrossed,
  "🧹": Sparkles,
  "🔧": Wrench,
  "✏️": Pencil,
  "📦": Package,
  "💧": Droplets,
  "🌐": Globe,
  "🔥": Flame,

  // Manutenção
  "💡": Lightbulb,
  "❄️": Snowflake,
  "👷": HardHat,
  "🛠️": Hammer,
  "📞": Phone,
  "🎨": Paintbrush,
  "🪟": Square, // Window não existe, usando Square
  "🔋": Battery,
  "🧯": FireExtinguisher,
  "🌿": Sprout,
  "🚰": Droplets,
  "🔨": Hammer,

  // Compras
  "🥛": Package, // Milk não existe, usando Package
  "🍞": Package, // Bread não existe, usando Package
  "🥚": Circle, // Egg não existe, usando Circle
  "🍚": Package, // Rice não existe, usando Package
  "🫘": Package,
  "☕": Coffee,
  "🧼": Sparkles, // Soap não existe, usando Sparkles
  "🧴": Package, // Bottle não existe, usando Package
  "🧻": Square, // ToiletPaper não existe, usando Square
  "🪥": Square, // Toothbrush não existe, usando Square
  "🍎": Apple,

  // Status e ações
  "✅": CheckCircle2,
  "❌": XCircle,
  "🗑️": Trash2,
  "🚀": Rocket,
  "➕": Plus,
  "🔄": RefreshCw,
  "🎁": Gift,
  "💰": Wallet,
  "📊": TrendingUp,
  "📈": TrendingUp,
  "📉": TrendingDown,
  "⚠️": AlertTriangle,
  "🏆": Trophy,
  "⭐": Star,
  "👑": Crown,
  "👤": User,
  "🎉": PartyPopper,
};

// Componente helper para renderizar ícone a partir de emoji
export function EmojiIcon({
  emoji,
  className = "h-5 w-5",
  size,
}: {
  emoji: string;
  className?: string;
  size?: number;
}) {
  const IconComponent = emojiToIcon[emoji];

  if (!IconComponent) {
    // Se não encontrar o ícone, retorna o emoji como fallback
    return <span>{emoji}</span>;
  }

  const iconSize = size || (className.includes("text-") ? undefined : 20);

  return <IconComponent className={className} size={iconSize} />;
}

// Função helper para obter o componente de ícone
export function getIconFromEmoji(emoji: string): LucideIcon | null {
  return emojiToIcon[emoji] || null;
}
