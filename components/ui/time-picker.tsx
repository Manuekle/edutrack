'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import * as React from 'react';

interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hour, setHour] = React.useState<string>('07');
  const [minute, setMinute] = React.useState<string>('00');

  React.useEffect(() => {
    if (value) {
      const parts = value.split(':');
      if (parts.length >= 2) {
        setHour(parts[0]);
        setMinute(parts[1]);
      }
    }
  }, [value]);

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    onChange(`${newHour}:${minute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    onChange(`${hour}:${newMinute}`);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex items-center gap-1 flex-1">
        <Select value={hour} onValueChange={handleHourChange}>
          <SelectTrigger className="w-full text-center  px-2">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="h-64">
            {hours.map(h => (
              <SelectItem key={h} value={h} className="justify-center">
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground font-semibold">:</span>
        <Select value={minute} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-full text-center  px-2">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="h-64">
            {minutes.map(m => (
              <SelectItem key={m} value={m} className="justify-center">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
