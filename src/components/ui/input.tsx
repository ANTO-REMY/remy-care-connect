import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-base shadow-sm ring-offset-background transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-primary/25 hover:shadow-[0_16px_32px_-28px_hsl(var(--primary)/0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 focus-visible:ring-offset-0 enabled:focus-visible:border-accent/70 enabled:focus-visible:scale-[1.01] aria-[invalid=true]:border-destructive/70 aria-[invalid=true]:bg-destructive/5 aria-[invalid=true]:text-destructive disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:py-2 md:text-sm",
            className
          )}
          ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
