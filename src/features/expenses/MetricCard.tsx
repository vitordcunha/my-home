import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string;
    subtext?: string;
    icon: LucideIcon;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    variant?: "default" | "success" | "warning" | "destructive" | "info";
    className?: string;
}

export function MetricCard({
    title,
    value,
    subtext,
    icon: Icon,
    variant = "default",
    className
}: MetricCardProps) {

    const variants = {
        default: "bg-card text-card-foreground border-border",
        success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
        warning: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
        destructive: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400",
        info: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
    };

    const iconColors = {
        default: "text-muted-foreground",
        success: "text-emerald-500",
        warning: "text-amber-500",
        destructive: "text-red-500",
        info: "text-blue-500",
    };

    return (
        <Card className={cn("border shadow-sm", variants[variant], className)}>
            <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                        {title}
                    </span>
                    <div className={cn("p-1.5 rounded-lg bg-background/50", iconColors[variant])}>
                        <Icon className="w-4 h-4" />
                    </div>
                </div>
                <div>
                    <div className="text-2xl font-bold tracking-tight mb-1">
                        {value}
                    </div>
                    {subtext && (
                        <p className="text-xs opacity-70 font-medium">
                            {subtext}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
