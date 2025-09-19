'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

interface StudentInfo {
  id: string;
  name: string | null;
  document: string | null;
}

interface SubjectInfo {
  code: string;
  name: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  enrolled?: boolean;
  removed?: boolean;
  student?: StudentInfo;
  subject?: SubjectInfo;
}

export default function AsignarEstudiantePage() {
  const [codigoAsignatura, setCodigoAsignatura] = useState('');
  const [documentoEstudiante, setDocumentoEstudiante] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState({
    show: false,
    title: '',
    message: '',
  });
  const [searchResults, setSearchResults] = useState<{
    subject: SubjectInfo | null;
    student: StudentInfo | null;
    isEnrolled: boolean;
  } | null>(null);

  const handleSearch = async () => {
    if (!codigoAsignatura || !documentoEstudiante) {
      toast.error('Por favor ingrese el código de la asignatura y el documento del estudiante');
      return;
    }

    setIsLoading(true);
    setSearchResults(null);

    try {
      // First, get the student and subject info
      const [subjectRes, studentRes] = await Promise.all([
        fetch(`/api/subjects/${codigoAsignatura}`),
        fetch(`/api/students?document=${documentoEstudiante}`),
      ]);

      // Handle subject response
      const subjectData = await subjectRes.json();
      if (!subjectRes.ok) {
        const errorMsg = subjectData.error || 'Error al buscar la asignatura';
        throw new Error(`Asignatura: ${errorMsg}`);
      }

      // Handle student response
      const studentData = await studentRes.json();
      if (!studentRes.ok) {
        const errorMsg = studentData.error || 'Error al buscar el estudiante';
        throw new Error(`Estudiante: ${errorMsg}`);
      }

      if (!subjectData.success || !studentData.success) {
        throw new Error(
          'No se pudo obtener la información completa. Verifique los datos e intente nuevamente.'
        );
      }

      const subject = subjectData.subject;
      const student = studentData.student;

      // Check if student is enrolled in the subject
      const isEnrolled = subject.studentIds?.includes(student.id) || false;

      setSearchResults({
        subject: {
          code: subject.code,
          name: subject.name,
        },
        student: {
          id: student.id,
          name: student.name,
          document: student.document,
        },
        isEnrolled,
      });
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error: ${errorMessage}`);

      // Show more detailed error in the UI if needed
      setShowErrorDialog({
        show: true,
        title: 'Error en la búsqueda',
        message: errorMessage,
      });
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!codigoAsignatura || !documentoEstudiante) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/asignar-estudiante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigoAsignatura, documentoEstudiante }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success(data.message || 'Estudiante asignado correctamente');
        setSearchResults({
          subject: data.subject || null,
          student: data.student || null,
          isEnrolled: true,
        });
      } else {
        setShowErrorDialog({
          show: true,
          title: 'Error',
          message: data.error || 'Error al asignar el estudiante',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setShowErrorDialog({
        show: true,
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!codigoAsignatura || !documentoEstudiante) return;

    setShowUnassignDialog(true);
  };

  const confirmUnassign = async () => {
    setShowUnassignDialog(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/asignar-estudiante', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigoAsignatura, documentoEstudiante }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success(data.message || 'Estudiante retirado correctamente');
        setSearchResults({
          subject: data.subject || null,
          student: data.student || null,
          isEnrolled: false,
        });
      } else {
        setShowErrorDialog({
          show: true,
          title: 'Error',
          message: data.error || 'Error al retirar el estudiante',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setShowErrorDialog({
        show: true,
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Asignar Estudiante a Asignatura
          </CardTitle>
          <CardDescription className="text-xs">
            Asigna o retira estudiantes de asignaturas de forma individual
          </CardDescription>
        </CardHeader>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/asignar-estudiante/cargar-estudiantes-asignatura">
            <Button variant="outline" className="gap-2">
              <span>Cargar Estudiantes</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="codigoAsignatura">Código de Asignatura</Label>
                <Input
                  id="codigoAsignatura"
                  placeholder="Ej: MAT101"
                  value={codigoAsignatura}
                  onChange={e => setCodigoAsignatura(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  className="text-xs"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="documentoEstudiante">Documento del Estudiante</Label>
                <Input
                  id="documentoEstudiante"
                  placeholder="Número de documento"
                  value={documentoEstudiante}
                  onChange={e => setDocumentoEstudiante(e.target.value)}
                  disabled={isLoading}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-xs"
                onClick={handleSearch}
                disabled={isLoading || !codigoAsignatura || !documentoEstudiante}
              >
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>

          {searchResults && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg mb-4 font-semibold tracking-card">Resultado de la búsqueda</h3>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Asignatura</h4>
                    <p className="text-xs ">
                      {searchResults.subject
                        ? `${searchResults.subject.code} - ${searchResults.subject.name}`
                        : 'No encontrada'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Estudiante</h4>
                    <p className="text-xs">
                      {searchResults.student
                        ? `${searchResults.student.name} (${searchResults.student.document})`
                        : 'No encontrado'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {searchResults.isEnrolled ? (
                    <Button
                      variant="destructive"
                      className="text-xs"
                      onClick={handleUnassign}
                      disabled={isLoading || !searchResults.student || !searchResults.subject}
                    >
                      {isLoading ? 'Retirando...' : ' Retirar de la asignatura'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAssign}
                      className="text-xs"
                      disabled={isLoading || !searchResults.student || !searchResults.subject}
                    >
                      {isLoading ? 'Asignando...' : 'Asignar a la asignatura'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Unassign */}
      <Dialog open={showUnassignDialog} onOpenChange={setShowUnassignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="tracking-tight text-xl">Confirmar retiro</DialogTitle>
            <DialogDescription className="text-xs">
              ¿Está seguro de retirar a este estudiante de la asignatura?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowUnassignDialog(false)}
              disabled={isLoading}
              className="font-sans"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmUnassign}
              disabled={isLoading}
              className="font-sans"
            >
              {isLoading ? 'Procesando...' : 'Confirmar retiro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={showErrorDialog.show}
        onOpenChange={open => !open && setShowErrorDialog(prev => ({ ...prev, show: false }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="tracking-tight text-xl">{showErrorDialog.title}</DialogTitle>
            <DialogDescription className="text-xs">{showErrorDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowErrorDialog(prev => ({ ...prev, show: false }))}
              className="mt-4"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
