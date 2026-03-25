import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        const now = new Date();
        newDate.setHours(now.getHours());
        newDate.setMinutes(now.getMinutes());
    }
    setSelectedDate(newDate);
    setDate(newDate);
  };

  const handleTimeSelect = (type: "hour12" | "minute" | "ampm", value: string) => {
    if (!selectedDate) {
      return;
    }
    const newDate = new Date(selectedDate);
    
    if (type === "hour12") {
      let hours = parseInt(value, 10);
      const ampm = format(selectedDate, "a");
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      newDate.setHours(hours);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    } else if (type === "ampm") {
      let current24h = newDate.getHours();
      if (value === "PM" && current24h < 12) {
        newDate.setHours(current24h + 12);
      }
      if (value === "AM" && current24h >= 12) {
        newDate.setHours(current24h - 12);
      }
    }
    
    setSelectedDate(newDate);
    setDate(newDate);
  };

  const current12Hour = selectedDate ? format(selectedDate, "hh") : "12";
  const currentMinute = selectedDate ? format(selectedDate, "mm") : "00";
  const currentAmPm = selectedDate ? format(selectedDate, "a") : "AM";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-white shadow-sm hover:bg-slate-50 transition-colors border-slate-200",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
          {date ? (
            <div className="flex items-center gap-1 font-medium text-slate-800">
              <span>{format(date, "PPP")}</span>
              <span className="text-slate-400 font-normal">at</span>
              <span>{format(date, "p")}</span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl shadow-xl overflow-hidden border-slate-200" align="start">
        <div className="bg-slate-50/50">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="p-3 pointer-events-auto bg-transparent"
          />
        </div>
        
        <div className="p-3 border-t border-slate-100 bg-white flex flex-col gap-2 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 pointer-events-none to-transparent h-2"></div>
          
          <div className="flex items-center gap-1.5 mb-1 justify-center relative z-10">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Set Time</span>
          </div>
          
          <div className="flex items-center gap-2 justify-center relative z-10 pb-1">
            <Select
              value={current12Hour}
              onValueChange={(v) => handleTimeSelect("hour12", v)}
              disabled={!selectedDate}
            >
              <SelectTrigger className="w-[70px] h-9 bg-slate-50 border-slate-200 focus:ring-emerald-500/20 font-medium z-50">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[200px] z-[100]">
                {Array.from({ length: 12 }).map((_, i) => {
                  const h = (i + 1).toString().padStart(2, "0");
                  return <SelectItem key={h} value={h} className="cursor-pointer">{h}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <span className="text-slate-300 font-bold">:</span>
            <Select
              value={currentMinute}
              onValueChange={(v) => handleTimeSelect("minute", v)}
              disabled={!selectedDate}
            >
              <SelectTrigger className="w-[70px] h-9 bg-slate-50 border-slate-200 focus:ring-emerald-500/20 font-medium z-50">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[200px] z-[100]">
                {Array.from({ length: 60 }).map((_, i) => {
                  const m = i.toString().padStart(2, "0");
                  return <SelectItem key={m} value={m} className="cursor-pointer">{m}</SelectItem>;
                })}
              </SelectContent>
            </Select>

            <Select
              value={currentAmPm}
              onValueChange={(v) => handleTimeSelect("ampm", v)}
              disabled={!selectedDate}
            >
              <SelectTrigger className="w-[85px] h-9 bg-slate-50 border-slate-200 focus:ring-emerald-500/20 ml-1 font-medium z-50">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                <SelectItem value="AM" className="cursor-pointer">AM</SelectItem>
                <SelectItem value="PM" className="cursor-pointer">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
