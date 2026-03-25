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
      const current24h = newDate.getHours();
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
            "w-full justify-start text-left font-medium bg-white shadow-sm hover:bg-emerald-50/50 hover:text-emerald-700 hover:border-emerald-200 transition-all border-slate-200 text-[15px] h-11 px-4 font-['Quicksand',sans-serif] rounded-xl",
            !date && "text-slate-400 font-normal",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-3 h-5 w-5 text-emerald-500" />
          {date ? (
            <div className="flex items-center gap-1.5 text-slate-800">
              <span className="font-bold">{format(date, "MMM d, yyyy")}</span>
              <span className="text-slate-400 font-medium px-1">&bull;</span>
              <span className="font-bold text-emerald-600">{format(date, "h:mm a")}</span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-2xl shadow-2xl overflow-hidden border-slate-200/60 font-['Quicksand',sans-serif] bg-white"
        align="start"
      >
        <div className="bg-gradient-to-b from-slate-50/50 to-white">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="p-4 pointer-events-auto bg-transparent"
          />
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-col gap-3 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] pointer-events-none to-transparent h-4"></div>
          
          <div className="flex items-center gap-2 justify-center relative z-10">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Select Time</span>
          </div>
          
          <div className="flex items-center gap-2.5 justify-center relative z-10 pb-1">
            <Select
              value={current12Hour}
              onValueChange={(v) => handleTimeSelect("hour12", v)}
              disabled={!selectedDate}
            >
              <SelectTrigger className="w-[75px] h-10 bg-white border-slate-200 focus:ring-emerald-500/30 font-bold text-lg text-slate-700 rounded-xl shadow-sm z-50">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[220px] z-[100] rounded-xl font-['Quicksand',sans-serif]">
                {Array.from({ length: 12 }).map((_, i) => {
                  const h = (i + 1).toString().padStart(2, "0");
                  return <SelectItem key={h} value={h} className="cursor-pointer font-bold text-base py-2">{h}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <span className="text-slate-400 font-bold text-xl mb-1">:</span>
            <Select
              value={currentMinute}
              onValueChange={(v) => handleTimeSelect("minute", v)}
              disabled={!selectedDate}
            >
              <SelectTrigger className="w-[75px] h-10 bg-white border-slate-200 focus:ring-emerald-500/30 font-bold text-lg text-slate-700 rounded-xl shadow-sm z-50">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[220px] z-[100] rounded-xl font-['Quicksand',sans-serif]">
                {Array.from({ length: 60 }).map((_, i) => {
                  const m = i.toString().padStart(2, "0");
                  return <SelectItem key={m} value={m} className="cursor-pointer font-bold text-base py-2">{m}</SelectItem>;
                })}
              </SelectContent>
            </Select>

            <Select
              value={currentAmPm}
              onValueChange={(v) => handleTimeSelect("ampm", v)}
              disabled={!selectedDate}
            >
              <SelectTrigger className="w-[85px] h-10 bg-emerald-50 border-emerald-100 focus:ring-emerald-500/30 ml-2 font-bold text-emerald-700 text-[15px] rounded-xl shadow-sm z-50">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100] rounded-xl font-['Quicksand',sans-serif]">
                <SelectItem value="AM" className="cursor-pointer font-bold py-2">AM</SelectItem>
                <SelectItem value="PM" className="cursor-pointer font-bold py-2">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
