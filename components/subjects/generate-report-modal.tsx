'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<void>;
  subjectName: string;
  isLoading: boolean;
}

export function GenerateReportModal({
  isOpen,
  onClose,
  onGenerate,
  subjectName,
  isLoading,
}: GenerateReportModalProps) {
  const { data: session } = useSession();
  const hasSignature = !!session?.user?.signatureUrl;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-heading">
            Generar Bitacora Docente
          </DialogTitle>
          <DialogDescription>
            Se generará un reporte de asistencia para la asignatura:
          </DialogDescription>
          <div className="mt-2 p-4 border rounded-md">
            <p className="font-normal text-xs">{subjectName}</p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              El reporte se generará en formato PDF y se descargará automáticamente. También
              recibirás un correo con el enlace de descarga.
            </p>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={onGenerate}
            disabled={isLoading || !hasSignature}
            title={!hasSignature ? 'Debes tener una firma registrada para generar reportes' : ''}
          >
            {isLoading ? (
              <>Generando...</>
            ) : !hasSignature ? (
              <div className="flex items-center gap-2">Firma requerida</div>
            ) : (
              'Generar Reporte'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
