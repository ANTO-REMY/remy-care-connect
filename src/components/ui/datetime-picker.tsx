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
        className="w-auto p-0 rounded-2xl shadow-2xl border-slate-200/60 font-['Quicksand',sans-serif] bg-white flex flex-col sm:flex-row overflow-hidden"
        align="start"
        sideOffset={8}
      >
        <div className="bg-gradient-to-b from-slate-50/50 to-white sm:border-r border-slate-100">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className="p-3 pointer-events-auto bg-transparent"
          />
        </div>
        
        <div className="p-3 sm:p-4 bg-slate-50/30 flex flex-col justify-center gap-3 relative min-w-[160px]">
          <div className="flex items-center gap-2 justify-center relative z-10 sm:mt-0 mt-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Select Time</span>
          </div>
          
          <div className="flex flex-col gap-2.5 relative z-10 w-full">
            <div className="flex justify-center gap-1.5 items-center">
              <Select
                value={current12Hour}
                onValueChange={(v) => handleTimeSelect("hour12", v)}
                disabled={!selectedDate}
              >
                <SelectTrigger className="w-[65px] h-9 bg-white border-slate-200 focus:ring-emerald-500/30 font-bold text-base text-slate-700 rounded-xl shadow-sm z-50">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[220px] z-[100] rounded-xl font-['Quicksand',sans-serif]">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const h = (i + 1).toString().padStart(2, "0");
                    return <SelectItem key={h} value={h} className="cursor-pointer font-bold text-[15px] py-1.5">{h}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              
              <span className="text-slate-400 font-bold text-lg mb-0.5">:</span>
              
              <Select
                value={currentMinute}
                onValueChange={(v) => handleTimeSelect("minute", v)}
                disabled={!selectedDate}
              >
                <SelectTrigger className="w-[65px] h-9 bg-white border-slate-200 focus:ring-emerald-500/30 font-bold text-base text-slate-700 rounded-xl shadow-sm z-50">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[220px] z-[100] rounded-xl font-['Quicksand',sans-serif]">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const m = i.toString().padStart(2, "0");
                    return <SelectItem key={m} value={m} className="cursor-pointer font-bold text-[15px] py-1.5">{m}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>

            <Select
              value={currentAmPm}
              onValueChange={(v) => handleTimeSelect("ampm", v)}
              disabled={!selectedDate}
            >
              <SelectTrigger className="w-full h-9 bg-emerald-50 border-emerald-100 focus:ring-emerald-500/30 font-bold text-emerald-700 text-[14px] hover:bg-emerald-100 transition-colors rounded-xl shadow-sm z-50 flex justify-center">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100] rounded-xl font-['Quicksand',sans-serif]">
                <SelectItem value="AM" className="cursor-pointer font-bold py-1.5 text-[15px]">AM</SelectItem>
                <SelectItem value="PM" className="cursor-pointer font-bold py-1.5 text-[15px]">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
