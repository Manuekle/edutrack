'use client';

import { X } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Command, CommandInput } from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface TagsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagsInput({
  value,
  onValueChange,
  placeholder,
  maxTags,
  className,
  ...props
}: TagsInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleUnselect = React.useCallback(
    (tag: string) => {
      onValueChange(value.filter(t => t !== tag));
    },
    [onValueChange, value]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '' && value.length > 0) {
            onValueChange(value.slice(0, -1));
          }
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const newTag = input.value.trim();
          if (newTag) {
            // Check maxTags and duplicates if needed
            if (!value.includes(newTag) && (!maxTags || value.length < maxTags)) {
              onValueChange([...value, newTag]);
            }
            setInputValue(''); // Reset input value
          }
        }
      }
    },
    [value, onValueChange, maxTags]
  );

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={cn(
        'overflow-visible bg-transparent',
        className
      )}
    >
      <div className="group flex min-h-9 w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs ring-offset-background transition-colors focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-[10px] bg-muted/50 hover:bg-muted/80 rounded-sm font-semibold flex items-center gap-1">
            {tag}
            <button
              className="rounded-full outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0 opacity-70 hover:opacity-100 transition-opacity"
              onClick={e => {
                e.preventDefault();
                handleUnselect(tag);
              }}
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3 text-muted-foreground/80 hover:text-foreground" />
            </button>
          </Badge>
        ))}
        {/* Avoid rendering input if max tags reached, or just hide/disable it */}
        {(!maxTags || value.length < maxTags) && (
          <CommandInput
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground h-auto p-0 border-none focus:ring-0 shadow-none text-xs"
            {...props}
          />
        )}
      </div>
    </Command>
  );
}
