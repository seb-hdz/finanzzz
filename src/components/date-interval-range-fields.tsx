"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type DateIntervalRangeFieldsProps = {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  className?: string;
  elementClassName?: string;
  startLabel?: string | React.ReactNode;
  endLabel?: string | React.ReactNode;
};

export function DateIntervalRangeFields(props: DateIntervalRangeFieldsProps) {
  const {
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    className,
    elementClassName,
    startLabel = "Desde",
    endLabel = "Hasta",
  } = props;

  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      <div className={cn("space-y-1", elementClassName)}>
        {typeof startLabel === "string" ? (
          <Label className="text-xs">{startLabel}</Label>
        ) : (
          startLabel
        )}
        <Popover>
          <PopoverTrigger
            render={<Button variant="outline" size="sm" className="gap-2" />}
          >
            <CalendarIcon className="size-3.5" />
            {format(startDate, "dd/MM/yyyy")}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(d) => d && onStartDateChange(d)}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className={cn("space-y-1", elementClassName)}>
        {typeof endLabel === "string" ? (
          <Label className="text-xs">{endLabel}</Label>
        ) : (
          endLabel
        )}
        <Popover>
          <PopoverTrigger
            render={<Button variant="outline" size="sm" className="gap-2" />}
          >
            <CalendarIcon className="size-3.5" />
            {format(endDate, "dd/MM/yyyy")}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(d) => d && onEndDateChange(d)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
