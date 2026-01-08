import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  hover?: boolean;
}

export function BentoCard({ className, children, onClick, hover = true }: BentoCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border p-5",
        "transition-colors duration-200",
        hover && "hover:bg-muted/50 cursor-pointer",
        onClick && "active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  );
}

