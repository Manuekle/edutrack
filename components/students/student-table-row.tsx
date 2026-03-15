'use client';

import { Hash, Mail, Phone } from 'lucide-react';
import type { Student } from './students-table';

interface StudentTableRowProps {
  student: Student;
}

export function StudentTableRow({ student }: StudentTableRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-5 hover:bg-muted/50 dark:hover:bg-white/[0.02] transition-colors group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold sm:text-sm text-xs">
          {student.name ? student.name.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[14px] font-semibold text-foreground truncate">
            {student.name || 'Estudiante sin nombre'}
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
            {student.document && (
              <span className="flex items-center gap-1 font-mono text-[10px] uppercase font-semibold tracking-card">
                <Hash className="h-3 w-3 opacity-70" />
                {student.document}
              </span>
            )}
            {student.document && (student.correoInstitucional || student.telefono) && (
              <span className="w-1 h-1 rounded-full bg-border" />
            )}
            {student.correoInstitucional && (
              <a
                href={`mailto:${student.correoInstitucional}`}
                title="Enviar correo"
                className="flex items-center gap-1 hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-[200px]"
              >
                <Mail className="h-3 w-3 opacity-70" />
                <span className="truncate">{student.correoInstitucional}</span>
              </a>
            )}
            {student.correoInstitucional && student.telefono && (
              <span className="w-1 h-1 rounded-full bg-border md:block hidden" />
            )}
            {student.telefono && (
              <a
                href={`tel:${student.telefono}`}
                className="md:flex hidden items-center gap-1 hover:text-foreground transition-colors shrink-0"
                title="Llamar"
              >
                <Phone className="h-3 w-3 opacity-70" />
                {student.telefono}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pl-14 sm:pl-0">
        {/* Mobile only phone view */}
        <div className="sm:hidden block">
          {student.telefono && (
            <a
              href={`tel:${student.telefono}`}
              className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
              title="Llamar"
            >
              <Phone className="h-3 w-3 opacity-70" />
              {student.telefono}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
