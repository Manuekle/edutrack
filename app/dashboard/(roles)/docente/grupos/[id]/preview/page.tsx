import { CardDescription } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDD(date: Date) {
  return String(new Date(date).getUTCDate()).padStart(2, '0');
}

function formatMM(date: Date) {
  return String(new Date(date).getUTCMonth() + 1).padStart(2, '0');
}

function formatTimeHHmm(date?: Date | null) {
  if (!date) return '--:--';
  const d = new Date(date);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function calculateHours(start?: Date | null, end?: Date | null) {
  if (!start || !end) return '2';
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  return String(Math.max(0, hours));
}

function isFinalizada(status: string, date: Date, endTime?: Date | null) {
  if (status !== 'SCHEDULED' && status !== 'PROGRAMADA') return false;
  // If we have endTime, compare exactly. Otherwise, check if today is past the class date.
  if (endTime) {
    return new Date(endTime).getTime() < Date.now();
  }
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime() < Date.now();
}

function shouldShowSignature(status: string) {
  if (!status) return false;
  const s = status.toUpperCase();
  return s === 'SIGNED' || s === 'COMPLETED';
}

export default async function PreviewPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCENTE') {
    redirect('/login');
  }

  const { id } = await params;

  // Intentar cargar como Grupo primero para filtrar clases por planeación (evita duplicados)
  const grupoData = await db.group.findUnique({
    where: { id },
    include: {
      teachers: {
        select: { id: true, name: true, signatureUrl: true },
      },
      subject: {
        include: {
          teachers: {
            select: { id: true, name: true, signatureUrl: true },
          },
        },
      },
      planning: {
        include: {
          weeks: {
            include: {
              classes: {
                orderBy: { date: 'asc' },
              },
            },
            orderBy: { number: 'asc' },
          },
        },
      },
    },
  });

  let subject: any = null;
  let classesToRender: any[] = [];

  if (grupoData) {
    subject = grupoData.subject;
    // Aplanamos las clases de las semanas de la planeación activa
    classesToRender = (grupoData.planning?.weeks ?? [])
      .flatMap((s: { classes: { date: Date; id: string; [key: string]: unknown }[] }) => s.classes)
      .sort(
        (a: { date: Date }, b: { date: Date }) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  } else {
    // Si no es grupo, intentar como asignatura (comportamiento base)
    subject = await db.subject.findUnique({
      where: { id },
      include: {
        teachers: {
          select: { id: true, name: true, signatureUrl: true },
        },
        classes: {
          where: { weekId: { not: null } },
          orderBy: { date: 'asc' },
        },
      },
    });
    if (subject) {
      classesToRender = subject.classes;
    }
  }

  if (!subject) {
    return (
      <div className="p-6">
        <h1 className="sm:text-2xl text-xs font-semibold text-red-600 dark:text-red-400">
          Asignatura o Grupo no encontrado
        </h1>
      </div>
    );
  }

  const isAuthorized =
    subject.teacherIds.includes(session.user.id) ||
    (await db.group.findFirst({ where: { id, teacherIds: { has: session.user.id } } }));

  if (!isAuthorized) {
    return (
      <div className="p-6">
        <h1 className="sm:text-2xl text-xs font-semibold text-red-600 dark:text-red-400">
          No autorizado
        </h1>
      </div>
    );
  }

  // Consolidar docentes (dar prioridad a los del grupo)
  const allTeachers = [...(grupoData?.teachers ?? []), ...(subject?.teachers ?? [])];

  const teacherName = allTeachers[0]?.name ?? 'Docente';
  const signatureUrl = allTeachers[0]?.signatureUrl ?? null;

  const today = new Date();
  const metaMonthYear = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentPeriod = currentMonth <= 6 ? 1 : 2;

  return (
    <div className="space-y-6">
      {/* Nav */}
      <div className="pb-6 w-full flex flex-col gap-3">
        <div>
          <h1 className="sm:text-2xl text-xl font-semibold tracking-card text-foreground">
            Vista Previa de Bitácora
          </h1>
          <CardDescription className="text-xs dark:text-gray-300">
            Visualiza el reporte de asistencia para {subject.name}
          </CardDescription>
        </div>
      </div>

      <div
        id="pdf-section"
        className="mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header Institucional */}
        <div className="border-b border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="w-full sm:w-1/4 flex justify-center sm:justify-start">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24">
              <Image
                src="/logo-fup.png"
                alt="Logo FUP"
                width={128}
                height={128}
                className="h-full w-full object-contain dark:brightness-0 dark:invert opacity-90"
                priority
                unoptimized
              />
            </div>
          </div>

          <div className="w-full sm:w-1/2 text-center">
            <h2 className="text-slate-900 dark:text-white font-semibold sm:text-xl text-lg tracking-card uppercase">
              Registro de Clases y Asistencia
            </h2>
            <div className="text-primary dark:text-primary/80 text-[10px] font-semibold tracking-card uppercase mt-1">
              Sistema de Gestión Académica • Docencia
            </div>
          </div>

          <div className="w-full sm:w-1/4 flex justify-center sm:justify-end">
            <div className="text-[10px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="flex justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800 py-1.5 px-3">
                <span className="font-semibold text-slate-500 uppercase tracking-card">
                  Código:
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">FO-DO-005</span>
              </div>
              <div className="flex justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800 py-1.5 px-3">
                <span className="font-semibold text-slate-500 uppercase tracking-card">
                  Versión:
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">08</span>
              </div>
              <div className="flex justify-between items-center gap-4 py-1.5 px-3">
                <span className="font-semibold text-slate-500 uppercase tracking-card">Fecha:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                  {metaMonthYear}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-6 bg-white dark:bg-slate-900">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-xs border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-card">
                Docente
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase">
                {teacherName}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-card">
                Programa
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {subject.program ?? 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-card">
                Asignatura
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase">
                {subject.name}
              </span>
            </div>
            <div className="flex flex-col gap-1 flex-wrap">
              <div className="grid grid-cols-3 w-full gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-card">
                    Año
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {currentYear}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-card">
                    Código
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {subject.code}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-card">
                    Período
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-card">
                    {currentPeriod}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Clases */}
        <div className="px-6 pb-8">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="min-w-[720px]">
              {/* Header de Tabla */}
              <div
                className="grid bg-slate-900 dark:bg-slate-800 text-slate-100"
                style={{ gridTemplateColumns: '5% 12% 16% 45% 8% 14%' }}
              >
                <div className="text-center font-semibold text-[10px] uppercase border-r border-slate-700/50 flex items-center justify-center p-3">
                  No.
                </div>
                <div className="text-center border-r border-slate-700/50">
                  <div className="p-2 font-semibold text-[10px] uppercase tracking-card">Fecha</div>
                  <div className="grid grid-cols-2 border-t border-slate-700/50">
                    <div className="p-1 font-semibold text-[9px] uppercase opacity-60">Día</div>
                    <div className="p-1 font-semibold text-[9px] uppercase opacity-60">Mes</div>
                  </div>
                </div>
                <div className="text-center border-r border-slate-700/50">
                  <div className="p-2 font-semibold text-[10px] uppercase tracking-card">
                    Horario
                  </div>
                  <div className="grid grid-cols-2 border-t border-slate-700/50">
                    <div className="p-1 font-semibold text-[9px] uppercase opacity-60">Inicio</div>
                    <div className="p-1 font-semibold text-[9px] uppercase opacity-60">Fin</div>
                  </div>
                </div>
                <div className="text-center font-semibold text-[10px] uppercase border-r border-slate-700/50 flex items-center justify-center p-3 tracking-card">
                  Contenido Temático / Observaciones
                </div>
                <div className="text-center font-semibold text-[10px] uppercase border-r border-slate-700/50 p-2 flex items-center justify-center leading-tight tracking-card">
                  Total
                  <br />
                  Horas
                </div>
                <div className="text-center font-semibold text-[10px] uppercase p-2 flex items-center justify-center leading-tight tracking-card">
                  Firma o<br />
                  Validación
                </div>
              </div>

              {/* Cuerpo de Tabla */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {classesToRender.map((cls, idx) => {
                  const dateObj = new Date(cls.date);
                  const showSignature = shouldShowSignature(cls.status);
                  const finalizada = isFinalizada(cls.status, dateObj, cls.endTime);

                  return (
                    <div
                      key={cls.id}
                      className={`grid min-h-[56px] items-stretch transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${idx % 2 === 1 ? 'bg-slate-50/20 dark:bg-slate-800/10' : 'bg-white dark:bg-slate-900'}`}
                      style={{ gridTemplateColumns: '5% 12% 16% 45% 8% 14%' }}
                    >
                      <div className="flex items-center justify-center border-r border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-500">
                        {idx + 1}
                      </div>

                      <div className="grid grid-cols-2 border-r border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-center text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                          {formatDD(dateObj)}
                        </div>
                        <div className="flex items-center justify-center text-[11px] border-l border-slate-100 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-400">
                          {formatMM(dateObj)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 border-r border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-center text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {formatTimeHHmm(cls.startTime as Date | null)}
                        </div>
                        <div className="flex items-center justify-center text-[11px] border-l border-slate-100 dark:border-slate-800 font-medium text-slate-500">
                          {formatTimeHHmm(cls.endTime as Date | null)}
                        </div>
                      </div>

                      <div className="flex items-center border-r border-slate-100 dark:border-slate-800 p-4 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        {cls.topic?.trim() || `Sesión de clase #${idx + 1}`}
                      </div>

                      <div className="flex items-center justify-center border-r border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-900 dark:text-slate-100">
                        {calculateHours(cls.startTime as Date | null, cls.endTime as Date | null)}
                      </div>

                      <div className="flex items-center justify-center p-2">
                        {showSignature && signatureUrl ? (
                          <div className="flex items-center justify-center w-full h-full p-1">
                            <Image
                              src={signatureUrl}
                              alt="Firma docente"
                              width={120}
                              height={40}
                              className="w-full object-contain dark:invert transition-all"
                            />
                          </div>
                        ) : (
                          <div
                            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-card ${
                              cls.status === 'SCHEDULED' || cls.status === 'PROGRAMADA'
                                ? finalizada
                                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-400' // Finalizada
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' // Programada
                                : cls.status === 'SIGNED' || cls.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' // Firmada
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' // Cancelada
                            }`}
                          >
                            {cls.status === 'SCHEDULED' || cls.status === 'PROGRAMADA'
                              ? finalizada
                                ? 'Finalizada'
                                : 'Programada'
                              : cls.status === 'SIGNED' || cls.status === 'COMPLETED'
                                ? 'Firmada'
                                : 'Cancelada'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
