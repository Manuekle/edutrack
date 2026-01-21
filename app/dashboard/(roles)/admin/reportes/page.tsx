'use client';

import { TeacherReport } from '@/components/teacher-report';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminReportesPage() {
  return (
    <div className="space-y-6">
      <CardHeader className="p-0 w-full">
        <CardTitle className="text-2xl font-semibold tracking-card">Reportes Docentes</CardTitle>
        <CardDescription className="text-xs">
          Selecciona un docente para ver los reportes detallados de sus asignaturas.
        </CardDescription>
      </CardHeader>

      <TeacherReport />
    </div>
  );
}
