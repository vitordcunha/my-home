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
        "relative overflow-hidden rounded-2xl bg-card border border-border p-4 md:p-6",
        "shadow-soft transition-all duration-300",
        hover && "hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer",
        onClick && "active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  );
}

