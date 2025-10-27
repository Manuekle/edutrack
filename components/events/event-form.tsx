"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { EventType } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

interface EventFormProps {
  title: string
  description: string
  date: Date | undefined
  type: EventType | ""
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onDateChange: (date: Date | undefined) => void
  onTypeChange: (type: EventType) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitLabel?: string
  isEdit?: boolean
}

export function EventForm({
  title,
  description,
  date,
  type,
  onTitleChange,
  onDescriptionChange,
  onDateChange,
  onTypeChange,
  onSubmit,
  onCancel,
  submitLabel = "Crear Evento",
  isEdit = false,
}: EventFormProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  return (
    <form onSubmit={onSubmit} className="space-y-4 font-sans">
      <div className="space-y-2">
        <Label className="text-xs" htmlFor={`event-title-${isEdit ? "edit" : "create"}`}>
          Título
        </Label>
        <Input
          id={`event-title-${isEdit ? "edit" : "create"}`}
          value={title}
          placeholder="Título del evento"
          className="text-xs"
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs" htmlFor={`event-desc-${isEdit ? "edit" : "create"}`}>
          Descripción (Opcional)
        </Label>
        <Textarea
          id={`event-desc-${isEdit ? "edit" : "create"}`}
          value={description}
          placeholder="Descripción del evento"
          className="resize-none text-xs"
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row w-full gap-4">
        <div className="space-y-2 flex-1">
          <Label className="text-xs">Fecha</Label>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal text-xs", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: es }) : <span>Elige una fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={onDateChange}
                onDayClick={() => setIsDatePickerOpen(false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 flex-1">
          <Label className="text-xs">Tipo de Evento</Label>
          <Select value={type} onValueChange={(value) => onTypeChange(value as EventType)}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
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
        </div>
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
  )
}
