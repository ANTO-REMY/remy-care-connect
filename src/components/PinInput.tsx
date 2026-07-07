import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

interface PinInputProps {
  value: string;
  onChange: (val: string) => void;
  name: string;
  label: string;
  required?: boolean;
  visuallyHiddenLabel?: boolean;
  length?: number;
}

export function PinInput({
  value,
  onChange,
  name,
  label,
  required,
  visuallyHiddenLabel = true,
  length = 4,
}: PinInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const normalizedValue = useMemo(
    () => (value || "").replace(/\D/g, "").slice(0, length),
    [value, length]
  );

  const digits = useMemo(
    () =>
      Array.from({ length }, (_, index) => normalizedValue[index] ?? ""),
    [length, normalizedValue]
  );

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const updateDigits = (nextDigits: string[]) => {
    onChange(nextDigits.join("").replace(/\D/g, "").slice(0, length));
  };

  const focusSlot = (index: number) => {
    const nextInput = inputRefs.current[index];
    nextInput?.focus();
    nextInput?.select();
  };

  const handleSlotChange = (index: number, nextRawValue: string) => {
    const numeric = nextRawValue.replace(/\D/g, "");
    if (!numeric) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      updateDigits(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    numeric.slice(0, length - index).split("").forEach((digit, offset) => {
      nextDigits[index + offset] = digit;
    });
    updateDigits(nextDigits);

    const nextIndex = Math.min(index + numeric.length, length - 1);
    focusSlot(nextIndex);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      const nextDigits = [...digits];
      if (nextDigits[index]) {
        nextDigits[index] = "";
        updateDigits(nextDigits);
        return;
      }

      if (index > 0) {
        nextDigits[index - 1] = "";
        updateDigits(nextDigits);
        focusSlot(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusSlot(index - 1);
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusSlot(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    focusSlot(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="w-full">
      <label
        htmlFor={`${name}-0`}
        className={cn(
          "text-sm font-medium leading-none",
          visuallyHiddenLabel ? "sr-only" : ""
        )}
      >
        {label}
      </label>

      <div className="relative">
        <div className="flex items-center justify-center gap-2 pr-12">
          {digits.map((digit, index) => (
            <input
              key={`${name}-${index}`}
              ref={(node) => {
                inputRefs.current[index] = node;
              }}
              id={`${name}-${index}`}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={length}
              type={isVisible ? "text" : "password"}
              value={digit}
              onChange={(event) => handleSlotChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onFocus={(event) => event.target.select()}
              onPaste={handlePaste}
              className="h-12 w-12 rounded-2xl border border-input bg-background/95 text-center text-lg font-semibold tracking-[0.18em] shadow-sm transition-all duration-200 ease-out hover:border-primary/30 hover:shadow-[0_14px_28px_-24px_hsl(var(--primary)/0.55)] focus:border-accent/70 focus:outline-none focus:ring-4 focus:ring-accent/15 focus:ring-offset-0 focus:scale-[1.05] sm:h-14 sm:w-14"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground transition-all duration-200 hover:border-accent/50 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/15"
          aria-label={isVisible ? "Hide PIN" : "Show PIN"}
        >
          <Eye
            className={cn(
              "absolute h-4 w-4 transition-all duration-200",
              isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"
            )}
          />
          <EyeOff
            className={cn(
              "absolute h-4 w-4 transition-all duration-200",
              isVisible ? "scale-75 opacity-0" : "scale-100 opacity-100"
            )}
          />
        </button>
      </div>

      <input
        id={`${name}-hidden`}
        type="hidden"
        name={name}
        value={normalizedValue}
        required={required}
      />
    </div>
  );
}
