import * as React from "react";
import { Check, ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SearchableComboboxItem {
  value: string;
  label: string;
  keywords?: string[];
}

interface SearchableComboboxProps {
  items: SearchableComboboxItem[];
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  disabled?: boolean;
  invalid?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  query?: string;
  onQueryChange?: (query: string) => void;
  displayValue?: string;
  customActionLabel?: string;
  onCustomAction?: () => void;
}

export function SearchableCombobox({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  invalid = false,
  open,
  onOpenChange,
  className,
  triggerClassName,
  contentClassName,
  query,
  onQueryChange,
  displayValue,
  customActionLabel,
  onCustomAction,
}: SearchableComboboxProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [internalQuery, setInternalQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value),
    [items, value]
  );
  const queryValue = query !== undefined ? query : internalQuery;
  const setQueryValue = React.useCallback(
    (nextQuery: string) => {
      if (query === undefined) {
        setInternalQuery(nextQuery);
      }
      onQueryChange?.(nextQuery);
    },
    [onQueryChange, query]
  );
  const triggerLabel = selectedItem?.label ?? displayValue ?? placeholder;

  React.useEffect(() => {
    if (!isOpen) {
      setQueryValue("");
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, setQueryValue]);

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          aria-invalid={invalid ? "true" : undefined}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between rounded-xl border border-input bg-card px-3 py-2 text-left text-sm font-normal shadow-sm transition-all duration-200 ease-out hover:border-primary/25 hover:bg-card motion-safe:hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-accent/15 focus-visible:ring-offset-0 enabled:focus-visible:scale-[1.01] data-[state=open]:border-accent/60 data-[state=open]:shadow-[0_18px_42px_-24px_hsl(var(--primary)/0.4)] disabled:scale-[0.985] disabled:opacity-65",
            triggerClassName
          )}
        >
          <span className={cn("truncate", !selectedItem && !displayValue && "text-muted-foreground")}>
            {triggerLabel}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "w-[var(--radix-popover-trigger-width)] rounded-2xl border-border/70 bg-card p-0 shadow-[0_30px_70px_-35px_hsl(var(--primary)/0.45)]",
          contentClassName
        )}
      >
        <Command
          shouldFilter
          className={cn("rounded-2xl border-0 bg-card", className)}
        >
          <CommandInput
            ref={searchInputRef}
            value={queryValue}
            onValueChange={setQueryValue}
            placeholder={searchPlaceholder}
            className="h-12"
          />
          <CommandList className="max-h-64">
            <CommandEmpty>{customActionLabel ? null : emptyMessage}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={[item.label, ...(item.keywords ?? [])].join(" ")}
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="rounded-xl px-3 py-2.5 text-sm transition-colors data-[selected=true]:bg-accent/10 data-[selected=true]:text-foreground"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 transition-opacity",
                      item.value === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </CommandItem>
              ))}
              {customActionLabel && onCustomAction && (
                <CommandItem
                  value={customActionLabel}
                  onSelect={() => {
                    onCustomAction();
                    setOpen(false);
                  }}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-accent transition-colors data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="truncate">{customActionLabel}</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
