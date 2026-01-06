import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  ariaLabel: string;
  variant?: "primary" | "blue" | "orange";
  size?: "sm" | "md";
  mobileOnly?: boolean;
}

export function FloatingActionButton({
  onClick,
  ariaLabel,
  variant = "primary",
  size = "md",
  mobileOnly = false,
}: FloatingActionButtonProps) {
  const variantClasses = {
    primary:
      "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground",
    blue: "bg-gradient-to-br from-blue-600 to-indigo-600 text-white",
    orange: "bg-gradient-to-br from-orange-600 to-amber-600 text-white",
  };

  const sizeClasses = {
    sm: "size-12 rounded-full",
    md: "h-16 w-16 rounded-2xl",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group fixed bottom-24-safe right-6 z-30 shadow-soft-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center",
        variantClasses[variant],
        sizeClasses[size],
        mobileOnly && "md:hidden"
      )}
      aria-label={ariaLabel}
    >
      <Plus className="h-6 w-6 transition-transform group-hover:rotate-90 duration-200" />
    </button>
  );
}
