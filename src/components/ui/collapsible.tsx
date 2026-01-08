import * as React from "react"
import { cn } from "@/lib/utils"
import { useHaptic } from "@/hooks/useHaptic"

const CollapsibleContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
}>({ open: false, onOpenChange: () => { } })

const Collapsible = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        open?: boolean
        onOpenChange?: (open: boolean) => void
    }
>(({ className, open = false, onOpenChange, children, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(open)

    const isControlled = onOpenChange !== undefined
    const finalOpen = isControlled ? open : internalOpen
    const finalOnOpenChange = isControlled ? onOpenChange : setInternalOpen

    return (
        <CollapsibleContext.Provider value={{ open: finalOpen, onOpenChange: finalOnOpenChange }}>
            <div
                ref={ref}
                className={cn(className)}
                data-state={finalOpen ? "open" : "closed"}
                {...props}
            >
                {children}
            </div>
        </CollapsibleContext.Provider>
    )
})
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, onClick, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(CollapsibleContext)
    const { trigger } = useHaptic();

    return (
        <button
            ref={ref}
            type="button"
            onClick={(e) => {
                trigger("light");
                onOpenChange(!open)
                onClick?.(e)
            }}
            className={cn("cursor-pointer", className)}
            {...props}
        >
            {children}
        </button>
    )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { open } = React.useContext(CollapsibleContext)

    if (!open) return null

    return (
        <div
            ref={ref}
            className={cn(
                "overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
