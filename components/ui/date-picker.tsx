'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  'aria-required'?: boolean;
  'aria-label'?: string;
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
          aria-required={ariaRequired}
          aria-label={ariaLabel || 'Seleccionar fecha'}
        >
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          {value ? format(value, 'PPP', { locale: es }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={date => {
            onChange?.(date);
            setOpen(false);
          }}
          initialFocus
          locale={es}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
