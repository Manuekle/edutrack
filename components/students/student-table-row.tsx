'use client';

import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import { TableCell, TableRow } from '@/components/ui/table';
import { UserX } from 'lucide-react';
import type { Student } from './students-table';

interface StudentTableRowProps {
  student: Student;
  onUnenrollClick: (student: { id: string; name: string }) => void;
}

export function StudentTableRow({ student, onUnenrollClick }: StudentTableRowProps) {
  return (
    <TableRow>
      <TableCell className="text-xs px-4 py-2">{student.name || 'N/A'}</TableCell>
      <TableCell className="text-xs px-4 py-2">{student.document || 'N/A'}</TableCell>
      <TableCell className="text-xs px-4 py-2">
        {student.correoInstitucional ? (
          <a
            href={`mailto:${student.correoInstitucional}`}
            title="Enviar correo"
            className="hover:underline"
          >
            {student.correoInstitucional}
          </a>
        ) : (
          'N/A'
        )}
      </TableCell>
      <TableCell className="text-xs px-4 py-2">
        {student.correoPersonal ? (
          <a
            href={`mailto:${student.correoPersonal}`}
            title="Enviar correo"
            className="hover:underline"
          >
            {student.correoPersonal}
          </a>
        ) : (
          'N/A'
        )}
      </TableCell>
      <TableCell className="text-xs px-4 py-2">
        {student.telefono ? (
          <a href={`tel:${student.telefono}`} className="hover:underline" title="Llamar">
            {student.telefono}
          </a>
        ) : (
          'N/A'
        )}
      </TableCell>
      <TableCell className="text-xs tracking-tight text-right px-4 py-2">
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            title="Solicitar desmatrícula"
            onClick={() =>
              onUnenrollClick({
                id: student.id,
                name: student.name || 'el estudiante',
              })
            }
          >
            <UserX className="h-4 w-4 text-amber-500" />
          </Button>
        </DialogTrigger>
      </TableCell>
    </TableRow>
  );
}
