"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TimePicker } from "@/components/ui/time-picker"
import { adjustEndTime, calculateDuration, formatDuration } from "@/lib/time-utils"
import { Clock } from "lucide-react"
import { useMemo } from "react"

interface EditClassDialogProps {
  isOpen: boolean
  classDate: Date | undefined
  startTime: string
  endTime: string
  classTopic: string
  classDescription: string
  isSubmitting: boolean
  onDateChange: (date: Date | undefined) => void
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  onTopicChange: (topic: string) => void
  onDescriptionChange: (description: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: (e: React.FormEvent) => void
  onReset: () => void
}

export function EditClassDialog({
  isOpen,
  classDate,
  startTime,
  endTime,
  classTopic,
  classDescription,
  isSubmitting,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onTopicChange,
  onDescriptionChange,
  onOpenChange,
  onSubmit,
  onReset,
}: EditClassDialogProps) {
  const isFormValid = useMemo(() => {
    if (!classDate || !startTime || !endTime) return false
    const duration = calculateDuration(startTime, endTime)
    return duration >= 2
  }, [classDate, startTime, endTime])

  const handleStartTimeChange = (newValue: string) => {
    onStartTimeChange(newValue)
    const [hStr, mStr = "00"] = newValue.split(":")
    const startHour = Number.parseInt(hStr, 10)
    const endHourMin = Math.min(startHour + 2, 22)
    const requiredMinEnd = `${endHourMin.toString().padStart(2, "0")}:${mStr}`

    if (!endTime) {
      onEndTimeChange(requiredMinEnd)
    } else {
      const adjusted = adjustEndTime(newValue, endTime, 2)
      if (adjusted !== endTime) {
        onEndTimeChange(adjusted)
      }
    }
  }

  const handleEndTimeChange = (newValue: string) => {
    if (startTime) {
      const adjusted = adjustEndTime(startTime, newValue, 2)
      onEndTimeChange(adjusted)
    } else {
      onEndTimeChange(newValue)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) {
          onReset()
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] font-sans" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-xl tracking-tight">Editar Clase</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Modifica los detalles de la clase. Haz clic en Guardar Cambios cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSubmit(e);
          }} 
          className="font-sans"
        >
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="class-date" className="text-xs font-normal">
                Fecha
              </Label>
              <DatePicker
                value={classDate}
                onChange={onDateChange}
                aria-required={true}
                aria-label="Seleccionar fecha de la clase"
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time" className="text-xs text-normal">
                    Hora de inicio
                  </Label>
                  <TimePicker
                    id="start-time"
                    value={startTime || "07:00"}
                    onChange={handleStartTimeChange}
                    className="w-full"
                    aria-required={true}
                    aria-label="Seleccionar hora de inicio"
                  />
                  {!startTime && (
                    <p className="text-muted-foreground text-xs" role="alert" aria-live="polite">
                      Requerido
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time" className="text-xs text-normal">
                    Hora de fin
                  </Label>
                  <TimePicker
                    id="end-time"
                    value={endTime || ""}
                    onChange={handleEndTimeChange}
                    className="w-full"
                    disabled={!startTime}
                    aria-required={true}
                    aria-label="Seleccionar hora de fin"
                    aria-disabled={!startTime}
                  />
                  {!endTime && startTime && (
                    <p className="text-muted-foreground text-xs" role="alert" aria-live="polite">
                      Requerido
                    </p>
                  )}
                  {!startTime && <p className="text-muted-foreground text-xs">Seleccione hora de inicio primero</p>}
                </div>
              </div>

              {startTime && endTime && (
                <div
                  className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3"
                  role="status"
                  aria-live="polite"
                >
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>Duración: {formatDuration(calculateDuration(startTime, endTime))}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic-edit" className="text-xs font-normal">
                Tema de la Clase
              </Label>
              <Input
                id="topic-edit"
                value={classTopic}
                onChange={(e) => onTopicChange(e.target.value)}
                className="text-xs"
                placeholder="Ej: Introducción a las Derivadas"
                aria-label="Tema de la clase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcionClase" className="text-xs font-normal">
                Descripción
              </Label>
              <Input
                id="descripcionClase"
                value={classDescription}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className="text-xs"
                placeholder="Ej: Descripción detallada de la clase"
                aria-label="Descripción de la clase"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="min-w-[120px]"
              aria-label="Guardar cambios de la clase"
            >
              {isSubmitting ? (
                <>
                  <div
                    className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
                    aria-hidden="true"
                  />
                  <span>Actualizando...</span>
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
