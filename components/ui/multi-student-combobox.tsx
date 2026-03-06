'use client';

import { Check, ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
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

interface MultiStudentComboboxProps {
  selectedStudents: Student[];
  onStudentsChange: (students: Student[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MultiStudentCombobox({
  selectedStudents,
  onStudentsChange,
  disabled = false,
  placeholder = 'Buscar y seleccionar estudiantes...',
}: MultiStudentComboboxProps) {
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
      // Error fetching students
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
    if (!open) return;
    const t = setTimeout(() => fetchStudents(searchQuery), 300);
    return () => clearTimeout(t);
  }, [open, searchQuery, fetchStudents]);

  const toggleStudent = (student: Student) => {
    const isSelected = selectedStudents.some(s => s.id === student.id);
    if (isSelected) {
      onStudentsChange(selectedStudents.filter(s => s.id !== student.id));
    } else {
      onStudentsChange([...selectedStudents, student]);
    }
  };

  const removeStudent = (studentId: string) => {
    onStudentsChange(selectedStudents.filter(s => s.id !== studentId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-xs min-h-[40px] h-auto py-2 px-3"
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 items-center">
              {selectedStudents.length > 0 ? (
                <>
                  <span className="text-muted-foreground mr-1">
                    {selectedStudents.length} seleccionados
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[450px] p-0" align="start">
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
                {students.map(st => {
                  const isSelected = selectedStudents.some(s => s.id === st.id);
                  return (
                    <CommandItem
                      key={st.id}
                      value={st.id}
                      onSelect={() => toggleStudent(st)}
                      className="text-xs"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
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
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedStudents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-muted/30">
          {selectedStudents.map(st => (
            <Badge
              key={st.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 flex items-center gap-1 text-[10px]"
            >
              {st.name}
              <button
                onClick={() => removeStudent(st.id)}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
