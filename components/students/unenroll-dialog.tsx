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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UnenrollDialogProps {
  isOpen: boolean
  studentName: string | null
  reason: string
  isSubmitting: boolean
  onReasonChange: (reason: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function UnenrollDialog({
  isOpen,
  studentName,
  reason,
  isSubmitting,
  onReasonChange,
  onClose,
  onConfirm,
}: UnenrollDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold tracking-tight">Solicitar desmatrícula</DialogTitle>
          <DialogDescription className="space-y-4 font-sans">
            <p>Se enviará una solicitud al administrador para desmatricular a {studentName} de la asignatura.</p>
            <div className="space-y-2">
              <Label className="text-xs font-normal text-black dark:text-white" htmlFor="reason">
                Motivo de la solicitud
              </Label>
              <Input
                id="reason"
                placeholder="Ingrese el motivo de la solicitud"
                value={reason}
                className="text-xs"
                onChange={(e) => onReasonChange(e.target.value)}
                required
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose className="font-sans" onClick={onClose}>
            Cancelar
          </DialogClose>
          <Button
            onClick={onConfirm}
            className="bg-amber-600 text-white hover:bg-amber-700 font-sans"
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
