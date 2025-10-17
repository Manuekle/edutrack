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

interface Student {
  id: string;
  name: string | null;
  document: string | null;
  correoInstitucional: string | null;
  codigoEstudiantil: string | null;
}

interface StudentComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function StudentCombobox({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Buscar estudiante...',
}: StudentComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchStudents = React.useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (e) {
      console.error('Error fetching students:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial list when opening
  React.useEffect(() => {
    if (open && students.length === 0) {
      fetchStudents('');
    }
  }, [open, students.length, fetchStudents]);

  // Debounce search
  React.useEffect(() => {
    if (!open || students.length === 0) return;
    const t = setTimeout(() => fetchStudents(searchQuery), 300);
    return () => clearTimeout(t);
  }, [open, searchQuery, fetchStudents, students.length]);

  const selected = students.find(s => s.document === value);

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
          {selected ? (
            <span className="truncate">
              {selected.name || 'Sin nombre'} ({selected.document})
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por documento, nombre o correo..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="text-xs"
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Buscando...' : 'No se encontraron estudiantes.'}
            </CommandEmpty>
            <CommandGroup>
              {students.map(st => (
                <CommandItem
                  key={st.id}
                  value={st.document || st.id}
                  onSelect={() => {
                    onValueChange(st.document || '');
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === st.document ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {st.name || 'Sin nombre'} {st.document ? `(${st.document})` : ''}
                    </div>
                    <div className="text-muted-foreground text-xs truncate">
                      {st.correoInstitucional || ''}{' '}
                      {st.codigoEstudiantil ? `• Código: ${st.codigoEstudiantil}` : ''}
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
