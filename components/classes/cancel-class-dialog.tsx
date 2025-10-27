"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CancelClassDialogProps {
  isOpen: boolean
  classTopic: string
  classDate: string
  cancelReason: string
  isSubmitting: boolean
  onReasonChange: (reason: string) => void
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function CancelClassDialog({
  isOpen,
  classTopic,
  classDate,
  cancelReason,
  isSubmitting,
  onReasonChange,
  onOpenChange,
  onConfirm,
}: CancelClassDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold tracking-tight">Cancelar Clase</DialogTitle>
          <DialogDescription className="font-sans text-xs text-muted-foreground">
            Estás a punto de cancelar la clase de <strong>{classTopic}</strong> del <strong>{classDate}</strong>. Se
            enviará una notificación a todos los estudiantes matriculados.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2 font-sans">
          <Label htmlFor="cancel-reason" className="font-sans font-semibold">
            Motivo de la cancelación
          </Label>
          <p className="text-xs text-muted-foreground">Este motivo se enviará a los estudiantes.</p>
          <Textarea
            id="cancel-reason"
            placeholder="Ej: calamidad doméstica, problemas de salud, etc."
            value={cancelReason}
            className="resize-none h-24"
            onChange={(e) => onReasonChange(e.target.value)}
            aria-required={true}
            aria-describedby="cancel-reason-description"
          />
          <span id="cancel-reason-description" className="sr-only">
            Ingrese el motivo de la cancelación que se enviará a los estudiantes
          </span>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            disabled={!cancelReason.trim() || isSubmitting}
            onClick={onConfirm}
            className="bg-rose-600 text-white hover:bg-rose-700 font-sans"
            aria-label="Confirmar cancelación de clase"
          >
            {isSubmitting ? "Cancelando..." : "Confirmar Cancelación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
