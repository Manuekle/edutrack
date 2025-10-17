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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  name: string;
  correoInstitucional: string;
  codigoDocente: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  program?: string | null;
  semester?: number | null;
  credits?: number | null;
  teacherId: string;
  teacher: Teacher;
  studentCount: number;
  classCount: number;
}

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectCreated: (subject: Subject) => void;
}

const initialSubjectState = {
  name: '',
  code: '',
  program: '',
  semester: '',
  credits: '',
  teacherId: '',
};

export function CreateSubjectModal({ isOpen, onClose, onSubjectCreated }: CreateSubjectModalProps) {
  const [newSubject, setNewSubject] = useState(initialSubjectState);
  const [isCreating, setIsCreating] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const response = await fetch('/api/admin/users?role=DOCENTE');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      toast.error('Error al cargar los docentes');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSubject(prev => ({ ...prev, [name]: value }));
  };

  const handleTeacherChange = (value: string) => {
    setNewSubject(prev => ({ ...prev, teacherId: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo crear la asignatura.');
      }

      const createdSubject: Subject = await response.json();
      toast.success('Asignatura creada con éxito.');
      onSubjectCreated(createdSubject);
      handleClose();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Ocurrió un error inesperado.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setNewSubject(initialSubjectState);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg font-sans">
        <DialogHeader>
          <DialogTitle className="tracking-tight text-xl">Crear Nueva Asignatura</DialogTitle>
          <DialogDescription className="text-xs">
            Completa los datos para crear una nueva asignatura en el sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Asignatura</Label>
            <Input
              id="name"
              name="name"
              value={newSubject.name}
              onChange={handleChange}
              placeholder="Ej: Programación Orientada a Objetos"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                name="code"
                value={newSubject.code}
                onChange={handleChange}
                placeholder="Ej: CS101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">Programa</Label>
              <Input
                id="program"
                name="program"
                value={newSubject.program}
                onChange={handleChange}
                placeholder="Ej: Ingeniería de Sistemas"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semester">Semestre</Label>
              <Input
                id="semester"
                name="semester"
                type="number"
                min="1"
                max="10"
                value={newSubject.semester}
                onChange={handleChange}
                placeholder="1-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Créditos</Label>
              <Input
                id="credits"
                name="credits"
                type="number"
                min="1"
                max="10"
                value={newSubject.credits}
                onChange={handleChange}
                placeholder="1-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherId">Docente</Label>
            <Select
              onValueChange={handleTeacherChange}
              value={newSubject.teacherId}
              disabled={loadingTeachers}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un docente" />
              </SelectTrigger>
              <SelectContent className="font-sans">
                {teachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name} {teacher.codigoDocente ? `(${teacher.codigoDocente})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || !newSubject.teacherId}>
              {isCreating ? 'Creando...' : 'Crear Asignatura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
