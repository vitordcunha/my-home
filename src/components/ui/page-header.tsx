import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "./button";

interface PageHeaderProps {
    title: ReactNode;
    description?: string;
    actions?: ReactNode;
    children?: ReactNode;
    className?: string;
    onBack?: () => void;
}

export function PageHeader({
    title,
    description,
    actions,
    children,
    className,
    onBack,
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 pb-2", className)}>
            <div className="flex items-end justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {onBack && (
                        <Button
                            onClick={onBack}
                            variant="ghost"
                            size="icon"
                            className="mt-1 shrink-0"
                            aria-label="Voltar"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div className="space-y-1 flex-1 min-w-0">
                        <div className="text-3xl font-bold tracking-tight text-foreground/90">
                            {title}
                        </div>
                        {description && (
                            <p className="text-base text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
            {children}
        </div>
    );
}
