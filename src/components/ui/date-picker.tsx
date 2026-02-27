import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function getDaysInMonth(month: string, year: string): number {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (!m || !y || isNaN(m) || isNaN(y) || y < 1) return 31;
  // new Date(y, m, 0) gives the last day of month m
  return new Date(y, m, 0).getDate();
}

export interface DatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  date,
  setDate,
  className,
  disabled = false,
}: DatePickerProps) {
  const [day, setDay] = React.useState<string>(
    date ? String(date.getDate()).padStart(2, "0") : ""
  );
  const [month, setMonth] = React.useState<string>(
    date ? String(date.getMonth() + 1).padStart(2, "0") : ""
  );
  const [year, setYear] = React.useState<string>(
    date ? String(date.getFullYear()) : ""
  );
  const [error, setError] = React.useState<string>("");

  // Sync when date prop changes externally
  React.useEffect(() => {
    if (date) {
      setDay(String(date.getDate()).padStart(2, "0"));
      setMonth(String(date.getMonth() + 1).padStart(2, "0"));
      setYear(String(date.getFullYear()));
      setError("");
    } else {
      setDay("");
      setMonth("");
      setYear("");
      setError("");
    }
  }, [date]);

  const tryEmit = (d: string, m: string, y: string) => {
    // Only validate & emit when all three fields are filled
    if (!d || !m || !y || y.length !== 4) {
      setError("");
      setDate(undefined);
      return;
    }

    const dayNum = parseInt(d, 10);
    const monthNum = parseInt(m, 10);
    const yearNum = parseInt(y, 10);

    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
      setError("Invalid date.");
      setDate(undefined);
      return;
    }

    if (monthNum < 1 || monthNum > 12) {
      setError("Invalid month.");
      setDate(undefined);
      return;
    }

    if (dayNum < 1) {
      setError("Day must be at least 01.");
      setDate(undefined);
      return;
    }

    const maxDays = getDaysInMonth(m, y);
    if (dayNum > maxDays) {
      const monthName = MONTHS[monthNum - 1]?.label ?? "That month";
      setError(`${monthName} ${yearNum} only has ${maxDays} days.`);
      setDate(undefined);
      return;
    }

    if (yearNum < 1900 || yearNum > new Date().getFullYear() + 10) {
      setError("Year is out of range.");
      setDate(undefined);
      return;
    }

    setError("");
    setDate(new Date(yearNum, monthNum - 1, dayNum));
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    setDay(raw);
    tryEmit(raw, month, year);
  };

  const handleDayBlur = () => {
    if (day.length === 1) {
      const padded = "0" + day;
      setDay(padded);
      tryEmit(padded, month, year);
    } else {
      tryEmit(day, month, year);
    }
  };

  const handleMonthChange = (val: string) => {
    setMonth(val);
    tryEmit(day, val, year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setYear(raw);
    tryEmit(day, month, raw);
  };

  const hasValue = day || month || year;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 transition-colors",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
          disabled && "opacity-50 pointer-events-none",
          error && "border-destructive focus-within:ring-destructive"
        )}
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />

        {/* Day input */}
        <Input
          type="text"
          inputMode="numeric"
          placeholder="DD"
          value={day}
          onChange={handleDayChange}
          onBlur={handleDayBlur}
          disabled={disabled}
          maxLength={2}
          aria-label="Day"
          className={cn(
            "border-0 shadow-none p-0 h-auto w-9 text-center",
            "focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent",
            "placeholder:text-muted-foreground text-sm font-medium"
          )}
        />

        <span className="text-muted-foreground select-none text-sm">/</span>

        {/* Month dropdown */}
        <Select value={month} onValueChange={handleMonthChange} disabled={disabled}>
          <SelectTrigger
            aria-label="Month"
            className={cn(
              "border-0 shadow-none p-0 h-auto w-[108px]",
              "focus:ring-0 focus:ring-offset-0 bg-transparent",
              "text-sm font-medium",
              !month && "text-muted-foreground"
            )}
          >
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground select-none text-sm">/</span>

        {/* Year input */}
        <Input
          type="text"
          inputMode="numeric"
          placeholder="YYYY"
          value={year}
          onChange={handleYearChange}
          disabled={disabled}
          maxLength={4}
          aria-label="Year"
          className={cn(
            "border-0 shadow-none p-0 h-auto w-12 text-center",
            "focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent",
            "placeholder:text-muted-foreground text-sm font-medium"
          )}
        />

        {/* Clear button */}
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={() => {
              setDay("");
              setMonth("");
              setYear("");
              setError("");
              setDate(undefined);
            }}
            className="ml-auto text-muted-foreground hover:text-foreground text-xs leading-none shrink-0"
            aria-label="Clear date"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive leading-tight">{error}</p>
      )}
    </div>
  );
}
