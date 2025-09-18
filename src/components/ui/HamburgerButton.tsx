import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const HamburgerButton = forwardRef<HTMLButtonElement, HamburgerButtonProps>(
  ({ isOpen, onClick, className }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
        "relative p-2 w-11 h-11 flex flex-col justify-center items-center",
        "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-md",
        "transition-colors duration-200 hover:bg-accent/10",
        className
      )}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation-menu"
      aria-haspopup="true"
    >
      <div className="w-6 h-5 relative flex flex-col justify-between">
        {/* Top line */}
        <span
          className={cn(
            "block h-0.5 w-6 bg-foreground rounded-sm transition-all duration-300 ease-in-out transform-gpu",
            isOpen && "rotate-45 translate-y-2"
          )}
        />
        {/* Middle line */}
        <span
          className={cn(
            "block h-0.5 w-6 bg-foreground rounded-sm transition-all duration-300 ease-in-out",
            isOpen && "opacity-0"
          )}
        />
        {/* Bottom line */}
        <span
          className={cn(
            "block h-0.5 w-6 bg-foreground rounded-sm transition-all duration-300 ease-in-out transform-gpu",
            isOpen && "-rotate-45 -translate-y-2"
          )}
        />
        </div>
      </button>
    );
  }
);

HamburgerButton.displayName = "HamburgerButton";