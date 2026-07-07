import { cn } from "@/lib/utils";

interface FieldErrorProps {
  message?: string;
  className?: string;
}

export function FieldError({ message, className }: FieldErrorProps) {
  return (
    <div
      className={cn(
        "grid transition-all duration-200 ease-out",
        message ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className
      )}
      aria-live="polite"
    >
      <div className="overflow-hidden">
        <p
          key={message ?? "empty"}
          className={cn(
            "pt-1 text-xs text-destructive",
            message && "motion-safe:animate-shake"
          )}
        >
          {message ?? ""}
        </p>
      </div>
    </div>
  );
}
