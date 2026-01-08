import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  X,
  Plus,
  CheckCircle2,
  Apple,
  Sparkles,
  ShowerHead,
  Box,
  ShoppingCart,
} from "lucide-react";
import { ShoppingCategory } from "./types";
import { useHaptic } from "@/hooks/useHaptic";

interface AddItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    category: ShoppingCategory;
    emoji: string;
  }) => void;
  isPending?: boolean;
}

// Predefined quick items for super fast reporting
const quickItems = [
  { name: "Leite", category: "alimentos" as ShoppingCategory, emoji: "🥛" },
  { name: "Pão", category: "alimentos" as ShoppingCategory, emoji: "🍞" },
  { name: "Ovos", category: "alimentos" as ShoppingCategory, emoji: "🥚" },
  { name: "Arroz", category: "alimentos" as ShoppingCategory, emoji: "🍚" },
  { name: "Feijão", category: "alimentos" as ShoppingCategory, emoji: "🫘" },
  { name: "Café", category: "alimentos" as ShoppingCategory, emoji: "☕" },
  { name: "Detergente", category: "limpeza" as ShoppingCategory, emoji: "🧼" },
  { name: "Sabão", category: "limpeza" as ShoppingCategory, emoji: "🧴" },
  {
    name: "Papel Higiênico",
    category: "higiene" as ShoppingCategory,
    emoji: "🧻",
  },
  { name: "Sabonete", category: "higiene" as ShoppingCategory, emoji: "🧼" },
  { name: "Shampoo", category: "higiene" as ShoppingCategory, emoji: "🧴" },
  {
    name: "Pasta de Dente",
    category: "higiene" as ShoppingCategory,
    emoji: "🪥",
  },
];

const categoryEmojis: Record<ShoppingCategory, string> = {
  alimentos: "🍎",
  limpeza: "🧹",
  higiene: "🧼",
  outros: "📦",
};

const getCategoryIcon = (category: ShoppingCategory) => {
  switch (category) {
    case "alimentos":
      return <Apple className="h-6 w-6" />;
    case "limpeza":
      return <Sparkles className="h-6 w-6" />;
    case "higiene":
      return <ShowerHead className="h-6 w-6" />;
    case "outros":
      return <Box className="h-6 w-6" />;
    default:
      return <ShoppingCart className="h-6 w-6" />;
  }
};

export function AddItemSheet({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: AddItemSheetProps) {
  const [customMode, setCustomMode] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>("alimentos");
  const [emoji, setEmoji] = useState("🛒");
  const { trigger } = useHaptic();

  const handleQuickItem = (item: (typeof quickItems)[0]) => {
    trigger("success");
    onSubmit(item);
    // Reset and close
    setTimeout(() => {
      setCustomMode(false);
      setName("");
      setCategory("alimentos");
      setEmoji("🛒");
    }, 300);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    trigger("success");
    onSubmit({
      name: name.trim(),
      category,
      emoji: emoji || categoryEmojis[category],
    });

    // Reset and close
    setName("");
    setCategory("alimentos");
    setEmoji("🛒");
    setCustomMode(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset when closing
      setCustomMode(false);
      setName("");
      setCategory("alimentos");
      setEmoji("🛒");
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="space-y-3">
          <SheetTitle className="text-2xl font-bold">Acabou...</SheetTitle>
          <SheetDescription className="text-base">
            {customMode
              ? "Digite o nome do item que faltou"
              : "Selecione o item que acabou"}
          </SheetDescription>
        </SheetHeader>

        {!customMode ? (
          // QUICK SELECTION MODE - Super fast!
          <div className="mt-6 space-y-6">
            {/* Quick items grid */}
            <div className="grid grid-cols-2 gap-3">
              {quickItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleQuickItem(item)}
                  disabled={isPending}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 bg-card hover:bg-accent hover:border-primary transition-all thumb-friendly active:scale-95 disabled:opacity-50"
                >
                  <div className="text-primary">{getCategoryIcon(item.category)}</div>
                  <span className="font-semibold text-sm text-center leading-tight">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom item button */}
            <Button
              onClick={() => setCustomMode(true)}
              variant="outline"
              size="lg"
              className="w-full rounded-xl thumb-friendly"
            >
              <Plus className="h-4 w-4 mr-2" />
              Outro item
            </Button>
          </div>
        ) : (
          // CUSTOM ITEM MODE
          <form onSubmit={handleCustomSubmit} className="mt-6 space-y-6">
            {/* Item name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold">
                Nome do Item *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-primary">
                  {getCategoryIcon(category)}
                </span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={50}
                  autoFocus
                  className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-base text-foreground placeholder:text-muted-foreground transition-all"
                  placeholder="Ex: Azeite, Macarrão..."
                />
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Categoria</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(categoryEmojis) as ShoppingCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setEmoji(categoryEmojis[cat]);
                      }}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all thumb-friendly ${category === cat
                          ? "border-primary bg-primary/10 font-semibold text-primary"
                          : "border-border bg-card hover:bg-accent"
                        }`}
                    >
                      {getCategoryIcon(cat)}
                      <span className="capitalize text-sm">{cat}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCustomMode(false)}
                className="flex-1 rounded-xl thumb-friendly"
                disabled={isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl thumb-friendly"
                disabled={isPending || !name.trim()}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Adicionar (+5 pts)
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
