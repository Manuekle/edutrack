'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { EventType } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useEffect } from 'react';

const eventFormSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  date: z.date(),
  type: z.enum(['EXAMEN', 'TRABAJO', 'LIMITE', 'ANUNCIO', 'INFO']),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  title?: string;
  description?: string;
  date?: Date | undefined;
  type?: EventType | '';
  onSubmit: (data: EventFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isEdit?: boolean;
}

export function EventForm({
  title = '',
  description = '',
  date,
  type = '',
  onSubmit,
  onCancel,
  submitLabel = 'Crear Evento',
  isEdit = false,
}: EventFormProps) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: title || '',
      description: description || '',
      date: date || new Date(),
      type: (type as EventType) || 'EXAMEN',
    },
  });

  // Actualizar el formulario cuando cambien las props
  useEffect(() => {
    if (title || description || date || type) {
      form.reset({
        title: title || '',
        description: description || '',
        date: date || new Date(),
        type: (type as EventType) || 'EXAMEN',
      });
    }
  }, [title, description, date, type, form]);

  const handleFormSubmit = (data: EventFormValues) => {
    // Normalizar la fecha a medianoche
    const normalizedDate = new Date(data.date);
    normalizedDate.setHours(0, 0, 0, 0);
    onSubmit({
      ...data,
      date: normalizedDate,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 font-sans">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Título</FormLabel>
              <FormControl>
                <Input placeholder="Título del evento" className="text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción del evento"
                  className="resize-none text-xs"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row w-full gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-xs">Fecha</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal text-xs',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, 'PPP', { locale: es })
                        ) : (
                          <span>Elige una fecha</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                    sideOffset={4}
                    onPointerDownOutside={e => {
                      const target = e.target as HTMLElement;
                      const dialog = target?.closest('[role="dialog"]');
                      if (dialog) {
                        e.preventDefault();
                      }
                    }}
                    onInteractOutside={e => {
                      const target = e.target as HTMLElement;
                      const dialog = target?.closest('[role="dialog"]');
                      if (dialog) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-xs">Tipo de Evento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-xs w-full">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem className="font-sans text-xs" value="EXAMEN">
                      Examen
                    </SelectItem>
                    <SelectItem className="font-sans text-xs" value="TRABAJO">
                      Tarea
                    </SelectItem>
                    <SelectItem className="font-sans text-xs" value="LIMITE">
                      Fecha límite
                    </SelectItem>
                    <SelectItem className="font-sans text-xs" value="ANUNCIO">
                      Anuncio
                    </SelectItem>
                    <SelectItem className="font-sans text-xs" value="INFO">
                      Informativo
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          {onCancel && (
            <DialogClose asChild>
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancelar
              </Button>
            </DialogClose>
          )}
          <Button type="submit">{submitLabel}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
