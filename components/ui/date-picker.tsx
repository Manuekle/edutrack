'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { es } from 'date-fns/locale';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  'aria-required'?: boolean;
  'aria-label'?: string;
}

function formatDate(date: Date | undefined): string {
  if (!date) {
    return '';
  }

  // Format: "01 de junio de 2025" (Spanish format)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function isValidDate(date: Date | undefined): boolean {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

export function DatePicker({
  value,
  onChange,
  disabled,
  className,
  placeholder = 'Seleccionar fecha',
  'aria-required': ariaRequired,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(value || new Date());
  const [inputValue, setInputValue] = React.useState(formatDate(value));

  // Update input value and month when value prop changes
  React.useEffect(() => {
    if (value) {
      setInputValue(formatDate(value));
      setMonth(value);
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);

    // Try to parse the input as a date
    // Support multiple formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    const dateStr = inputVal.trim();
    if (!dateStr) {
      onChange?.(undefined);
      return;
    }

    // Try different date formats
    let parsedDate: Date | undefined;

    // Format: DD/MM/YYYY or DD-MM-YYYY (European format - prioritize this)
    const euFormat = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (euFormat) {
      const [, day, month, year] = euFormat;
      parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
      if (
        isValidDate(parsedDate) &&
        parsedDate.getDate() === Number(day) &&
        parsedDate.getMonth() === Number(month) - 1 &&
        parsedDate.getFullYear() === Number(year)
      ) {
        onChange?.(parsedDate);
        setMonth(parsedDate);
        return;
      }
    }

    // Format: YYYY-MM-DD (ISO format)
    const isoFormat = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoFormat) {
      const [, year, month, day] = isoFormat;
      parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
      if (isValidDate(parsedDate)) {
        onChange?.(parsedDate);
        setMonth(parsedDate);
        return;
      }
    }

    // Try native Date parsing as last resort (but this is unreliable)
    // Only use if the input looks like a date string that Date can parse
    if (dateStr.length > 5) {
      const nativeDate = new Date(dateStr);
      if (isValidDate(nativeDate) && !isNaN(nativeDate.getTime())) {
        // Only accept if it's a reasonable date (not 1970 or far future)
        const year = nativeDate.getFullYear();
        if (year >= 1900 && year <= 2100) {
          onChange?.(nativeDate);
          setMonth(nativeDate);
        }
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.(date);
      setInputValue(formatDate(date));
      setMonth(date);
      setOpen(false);
    }
  };

  return (
    <div className={`relative flex gap-2 ${className || ''}`}>
      <Input
        value={inputValue}
        placeholder={placeholder}
        className="bg-background pr-10"
        disabled={disabled}
        onChange={handleInputChange}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-required={ariaRequired}
        aria-label={ariaLabel || 'Seleccionar fecha'}
      />
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            disabled={disabled}
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">Seleccionar fecha</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="end"
          alignOffset={-8}
          sideOffset={10}
          onPointerDownOutside={e => {
            const target = e.target as HTMLElement;
            // Si el clic está dentro de un diálogo, prevenir que el popover se cierre
            // Esto permite que los clics en el calendario funcionen
            const dialog = target?.closest('[role="dialog"]');
            if (dialog) {
              e.preventDefault();
            }
          }}
          onInteractOutside={e => {
            const target = e.target as HTMLElement;
            // Si el clic está dentro de un diálogo, prevenir que el popover se cierre
            // Esto permite que los clics en el calendario funcionen
            const dialog = target?.closest('[role="dialog"]');
            if (dialog) {
              e.preventDefault();
            }
          }}
        >
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={handleCalendarSelect}
            locale={es}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
