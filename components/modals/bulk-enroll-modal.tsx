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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface BulkEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubjectIds: Set<string>;
  onSuccess: () => void;
}

export function BulkEnrollModal({ isOpen, onClose, selectedSubjectIds, onSuccess }: BulkEnrollModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Solo se permiten archivos CSV');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file || selectedSubjectIds.size === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subjectIds', JSON.stringify(Array.from(selectedSubjectIds)));

    try {
      const response = await fetch('/api/admin/enrollment/batch', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la carga masiva');
      }

      toast.success(data.message || 'Estudiantes matriculados exitosamente');
      onSuccess();
      onClose();
      setFile(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md font-sans">
        <DialogHeader>
          <DialogTitle className="tracking-card sm:text-2xl">Matriculación Masiva</DialogTitle>
          <DialogDescription className="text-sm">
            Vas a matricular estudiantes en <strong>{selectedSubjectIds.size}</strong> asignatura(s) seleccionada(s).
            <p className="mt-2 text-xs text-muted-foreground">
              Sube un archivo CSV con una columna 'documento' o 'correo'.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csv-file">Archivo de Estudiantes (.csv)</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
            {file && <p className="text-xs text-muted-foreground mt-1">Archivo seleccionado: {file.name}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!file || isUploading}>
            {isUploading ? (
              <>Procesando...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Matricular Estudiantes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
