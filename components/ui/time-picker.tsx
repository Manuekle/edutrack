'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import React from 'react';

interface TimePickerProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'className' | 'step' | 'type'
  > {
  value: string; // Expected format: "HH:mm"
  onChange: (value: string) => void;
  className?: string;
  step?: number; // seconds step for the native time input
}

export function TimePicker({ value, onChange, className, step = 60, ...rest }: TimePickerProps) {
  // Normalize incoming value to HH:MM for the native input (omit seconds). Accepts ISO strings too.
  const normalizeProp = (v?: string) => {
    if (!v) return '';
    const trimmed = String(v).trim();
    // If already in H:MM or HH:MM format
    const simple = /^\d{1,2}:\d{2}$/;
    if (simple.test(trimmed)) {
      const [h, m] = trimmed.split(':');
      const hh = String(Math.min(Math.max(parseInt(h, 10) || 0, 0), 23)).padStart(2, '0');
      const mm = String(Math.min(Math.max(parseInt(m, 10) || 0, 0), 59)).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    // 12-hour format like 'h:mm AM' or 'hh:mm pm'
    const ampm = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
    const m = trimmed.match(ampm);
    if (m) {
      let hhNum = parseInt(m[1], 10);
      const mmNum = Math.min(Math.max(parseInt(m[2], 10) || 0, 0), 59);
      const isPM = m[3].toUpperCase() === 'PM';
      if (hhNum === 12) hhNum = isPM ? 12 : 0;
      else hhNum = isPM ? hhNum + 12 : hhNum;
      const hh = String(Math.min(Math.max(hhNum, 0), 23)).padStart(2, '0');
      const mm = String(mmNum).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    // Try parsing as Date
    const dt = new Date(trimmed);
    if (!isNaN(dt.getTime())) {
      const hh = String(dt.getHours()).padStart(2, '0');
      const mm = String(dt.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return '';
  };

  const normalized = normalizeProp(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // e.target.value can be HH:MM or HH:MM:SS depending on step
    const parts = e.target.value.split(':');
    const h = parts[0] || '00';
    const m = parts[1] || '00';
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Input
        type="time"
        value={normalized}
        step={step}
        onChange={handleChange}
        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        aria-label="Seleccionar hora"
        {...rest}
      />
    </div>
  );
}
