import { useState, useEffect, useRef } from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";

interface ConfirmButtonProps extends Omit<ButtonProps, "onClick"> {
  onConfirm: () => void;
  confirmText?: string;
  defaultText?: string;
  confirmTimeout?: number;
  showBadge?: boolean;
  badgePosition?: "top" | "bottom" | "left" | "right";
}

export function ConfirmButton({
  onConfirm,
  confirmText = "Você tem certeza?",
  defaultText,
  confirmTimeout = 5000,
  showBadge = false,
  badgePosition = "top",
  className,
  children,
  variant = "destructive",
  size,
  ...props
}: ConfirmButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isIconButton = size === "icon";
  const { trigger } = useHaptic();

  const handleClick = () => {
    if (isConfirming) {
      // Segundo clique - executar ação
      trigger("error");
      onConfirm();
      setIsConfirming(false);
    } else {
      // Primeiro clique - mostrar confirmação
      trigger("warning");
      setIsConfirming(true);
    }
  };

  // Resetar confirmação após timeout
  useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => {
        setIsConfirming(false);
      }, confirmTimeout);

      return () => clearTimeout(timer);
    }
  }, [isConfirming, confirmTimeout]);

  // Detectar cliques fora do componente
  useEffect(() => {
    if (!isConfirming) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsConfirming(false);
      }
    };

    // Adiciona listener após um pequeno delay para evitar que o clique atual dispare
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isConfirming]);

  const badgePositionClasses = {
    top: "absolute -top-8 left-1/2 -translate-x-1/2",
    bottom: "absolute -bottom-8 left-1/2 -translate-x-1/2",
    left: "absolute left-full ml-2 top-1/2 -translate-y-1/2",
    right: "absolute right-full mr-2 top-1/2 -translate-y-1/2",
  };

  // Para botões de ícone, sempre mostrar badge se não estiver definido
  const shouldShowBadge = isIconButton ? true : showBadge;

  return (
    <div ref={containerRef} className="relative inline-flex">
      {isConfirming && shouldShowBadge && (
        <span
          className={cn(
            "whitespace-nowrap text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-lg border border-destructive/20 animate-in fade-in z-10",
            badgePosition === "top" && "slide-in-from-bottom-2",
            badgePosition === "bottom" && "slide-in-from-top-2",
            badgePosition === "left" && "slide-in-from-right-2",
            badgePosition === "right" && "slide-in-from-left-2",
            badgePositionClasses[badgePosition]
          )}
        >
          {confirmText}
        </span>
      )}
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={cn(
          "transition-all",
          isConfirming &&
            variant === "destructive" &&
            "bg-destructive/90 hover:bg-destructive",
          isConfirming &&
            variant === "ghost" &&
            "text-destructive bg-destructive/20 hover:bg-destructive/30",
          className
        )}
        title={isConfirming ? "Clique novamente para confirmar" : undefined}
        {...props}
      >
        {isIconButton || !isConfirming
          ? children
          : defaultText || confirmText}
      </Button>
    </div>
  );
}

