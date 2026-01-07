import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: ReactNode;
    description?: string;
    actions?: ReactNode;
    children?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    actions,
    children,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 pb-2", className)}>
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="text-3xl font-bold tracking-tight text-foreground/90">
                        {title}
                    </div>
                    {description && (
                        <p className="text-base text-muted-foreground">{description}</p>
                    )}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
            {children}
        </div>
    );
}
