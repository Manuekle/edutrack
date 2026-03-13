'use client';

import { TeacherReport } from '@/components/teacher-report';

export default function AdminReportesPage() {
  return (
    <div className="space-y-6 pb-12">
      <div id="tour-reportes-title">
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
          Reportes docentes
        </h1>
        <p className="text-muted-foreground text-[15px] mt-2 max-w-2xl">
          Selecciona un docente para ver el detalle de sus asignaturas, bitácoras y avance por
          semana.
        </p>
      </div>

      <TeacherReport />
    </div>
  );
}
