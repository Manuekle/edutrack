'use client';

import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const TeacherReport = dynamic(
  () => import('@/components/teacher-report').then(mod => ({ default: mod.TeacherReport })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    ),
  }
);

export default function AdminReportesPage() {
  return (
    <div className="space-y-6 pb-12">
      <div id="tour-reportes-title">
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
          Reportes docentes
        </h1>
        <p className="text-muted-foreground text-xs mt-2 max-w-2xl">
          Selecciona un docente para ver el detalle de sus asignaturas, bitácoras y avance por
          semana.
        </p>
      </div>

      <TeacherReport />
    </div>
  );
}
