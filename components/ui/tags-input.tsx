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
        'overflow-visible bg-transparent border border-input rounded-md ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
    >
      <div className="group border border-input px-3 py-2 text-sm rounded-md ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 flex flex-wrap gap-2">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="hover:bg-secondary/80">
            {tag}
            <button
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={e => {
                e.preventDefault();
                handleUnselect(tag);
              }}
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
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
            className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1 min-w-[120px] h-auto p-0 border-none focus:ring-0 shadow-none "
            {...props}
          />
        )}
      </div>
    </Command>
  );
}
