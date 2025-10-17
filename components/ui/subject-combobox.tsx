'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  code: string;
  name: string;
  teacher: {
    id: string;
    name: string | null;
  };
}

interface SubjectComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SubjectCombobox({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Buscar asignatura...',
}: SubjectComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchSubjects = React.useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/subjects/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial subjects when opening
  React.useEffect(() => {
    if (open && subjects.length === 0) {
      fetchSubjects('');
    }
  }, [open, subjects.length, fetchSubjects]);

  // Debounce search
  React.useEffect(() => {
    if (!open || subjects.length === 0) return;

    const timer = setTimeout(() => {
      fetchSubjects(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, open, fetchSubjects, subjects.length]);

  const selectedSubject = subjects.find(subject => subject.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-xs"
          disabled={disabled}
        >
          {selectedSubject ? (
            <span className="truncate">
              {selectedSubject.code} - {selectedSubject.name}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por código, nombre o docente..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="text-xs"
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Buscando...' : 'No se encontraron asignaturas.'}
            </CommandEmpty>
            <CommandGroup>
              {subjects.map(subject => (
                <CommandItem
                  key={subject.id}
                  value={subject.code}
                  onSelect={() => {
                    onValueChange(subject.code === value ? '' : subject.code);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === subject.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {subject.code} - {subject.name}
                    </div>
                    <div className="text-muted-foreground text-xs truncate">
                      Docente: {subject.teacher.name || 'Sin asignar'}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
