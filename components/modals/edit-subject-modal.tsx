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

interface EditSubjectModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
  onSubjectUpdate: (subject: Subject) => void;
}

export function EditSubjectModal({
  subject,
  isOpen,
  onClose,
  onSubjectUpdate,
}: EditSubjectModalProps) {
  const [editedSubject, setEditedSubject] = useState({
    name: '',
    code: '',
    program: '',
    semester: '',
    credits: '',
    teacherId: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    if (subject && isOpen) {
      setEditedSubject({
        name: subject.name,
        code: subject.code,
        program: subject.program || '',
        semester: subject.semester?.toString() || '',
        credits: subject.credits?.toString() || '',
        teacherId: subject.teacherId,
      });
      fetchTeachers();
    }
  }, [subject, isOpen]);

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
    setEditedSubject(prev => ({ ...prev, [name]: value }));
  };

  const handleTeacherChange = (value: string) => {
    setEditedSubject(prev => ({ ...prev, teacherId: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return;

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedSubject),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo actualizar la asignatura.');
      }

      const updatedSubject: Subject = await response.json();
      toast.success('Asignatura actualizada con éxito.');
      onSubjectUpdate(updatedSubject);
      handleClose();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Ocurrió un error inesperado.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setEditedSubject({
      name: '',
      code: '',
      program: '',
      semester: '',
      credits: '',
      teacherId: '',
    });
    onClose();
  };

  if (!subject) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg font-sans">
        <DialogHeader>
          <DialogTitle className="tracking-tight text-xl">Editar Asignatura</DialogTitle>
          <DialogDescription className="text-xs">
            Modifica los datos de la asignatura {subject.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Asignatura</Label>
            <Input
              id="name"
              name="name"
              value={editedSubject.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                name="code"
                value={editedSubject.code}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">Programa</Label>
              <Input
                id="program"
                name="program"
                value={editedSubject.program}
                onChange={handleChange}
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
                value={editedSubject.semester}
                onChange={handleChange}
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
                value={editedSubject.credits}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherId">Docente</Label>
            <Select
              onValueChange={handleTeacherChange}
              value={editedSubject.teacherId}
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Actualizando...' : 'Actualizar Asignatura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
