'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  className,
  placeholder = 'Seleccionar fecha y hora',
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      if (date) {
        // preserve time
        selectedDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
      } else {
        selectedDate.setHours(7, 0, 0, 0); // default to 07:00
      }
      setDate(selectedDate);
      onChange(selectedDate);
    } else {
      setDate(undefined);
      onChange(undefined);
    }
  };

  const handleTimeChange = (timeString: string) => {
    const newDate = date ? new Date(date) : new Date();
    const [hours, minutes] = timeString.split(':');
    if (hours && minutes) {
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      setDate(newDate);
      onChange(newDate);
    }
  };

  const timeValue = date ? format(date, 'HH:mm') : '07:00';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal px-3 py-2 h-auto min-h-10 text-xs',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {date ? (
            format(date, "PPP 'a las' hh:mm a", { locale: es })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          locale={es}
        />
        <div className="p-3 border-t bg-muted/30">
          <TimePicker value={timeValue} onChange={handleTimeChange} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
