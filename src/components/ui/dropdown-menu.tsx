import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "@/lib/utils"
import { useHaptic } from "@/hooks/useHaptic"

const DropdownMenu = Popover
const DropdownMenuTrigger = PopoverTrigger

const DropdownMenuContent = React.forwardRef<
    React.ElementRef<typeof PopoverContent>,
    React.ComponentPropsWithoutRef<typeof PopoverContent>
>(({ className, align = "end", ...props }, ref) => (
    <PopoverContent
        ref={ref}
        align={align}
        className={cn("w-56 p-1", className)}
        {...props}
    />
))
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, onClick, ...props }, ref) => {
    const { trigger } = useHaptic();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        trigger("light");
        onClick?.(e);
    };

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
                inset && "pl-8",
                className
            )}
            onClick={handleClick}
            {...props}
        />
    );
})
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuLabel = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "px-2 py-1.5 text-sm font-semibold",
            inset && "pl-8",
            className
        )}
        {...props}
    />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-muted", className)}
        {...props}
    />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
}
