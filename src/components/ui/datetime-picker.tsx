import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateTimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  date,
  setDate,
  className,
  placeholder = "Pick a date & time",
  disabled = false,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) {
      setSelectedDate(undefined);
      setDate(undefined);
      return;
    }
    const newDate = new Date(day);
    if (selectedDate) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    } else {
        // Default to current time if no previous selection
        const now = new Date();
        newDate.setHours(now.getHours());
        newDate.setMinutes(now.getMinutes());
    }
    setSelectedDate(newDate);
    setDate(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    if (!selectedDate) return;
    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setSelectedDate(newDate);
    setDate(newDate);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP p") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <input
            type="time"
            className="w-full p-2 border rounded-md"
            value={selectedDate ? format(selectedDate, "HH:mm") : ""}
            onChange={handleTimeChange}
            disabled={!selectedDate}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
