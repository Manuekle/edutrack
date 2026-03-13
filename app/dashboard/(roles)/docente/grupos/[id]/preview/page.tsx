import { CardDescription, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { ArrowLeft } from 'lucide-react';
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

function isFinalizada(status: string, endTime?: Date | null) {
  if (status !== 'PROGRAMADA') return false;
  if (!endTime) return false;
  return new Date(endTime).getTime() < Date.now();
}

function shouldShowSignature(status: string) {
  return status === 'REALIZADA' || status === 'CANCELADA';
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
              }
            },
            orderBy: { number: 'asc' }
          }
        }
      }
    }
  });

  let subject: any = null;
  let classesToRender: any[] = [];

  if (grupoData) {
    subject = grupoData.subject;
    // Aplanamos las clases de las semanas de la planeación activa
    classesToRender = (grupoData.planning?.weeks ?? [])
      .flatMap((s: { classes: { date: Date; id: string; [key: string]: unknown }[] }) => s.classes)
      .sort((a: { date: Date }, b: { date: Date }) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
          orderBy: { date: 'asc' }
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

  const isAuthorized = subject.teacherIds.includes(session.user.id) ||
                       await db.group.findFirst({ where: { id, teacherIds: { has: session.user.id } } });

  if (!isAuthorized) {
    return (
      <div className="p-6">
        <h1 className="sm:text-2xl text-xs font-semibold text-red-600 dark:text-red-400">
          No autorizado
        </h1>
      </div>
    );
  }

  const teacherName = subject.teachers[0]?.name ?? 'Docente';
  const signatureUrl = subject.teachers[0]?.signatureUrl ?? null;

  const today = new Date();
  const metaMonthYear = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentPeriod = currentMonth <= 6 ? 1 : 2;

  return (
    <div className="space-y-6">
      <div className="pb-4 w-full flex sm:flex-row flex-col items-start gap-4 justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/docente/grupos/${id}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="sm:text-2xl text-xs font-semibold tracking-card text-foreground">
              Bitácora Docente
            </h1>
            <CardDescription className="text-xs dark:text-gray-300">
              Visualiza el reporte de asistencia para la asignatura {subject.name}
            </CardDescription>
          </div>
        </div>
      </div>
      <div
        id="pdf-section"
        className="mx-auto px-4 sm:px-8 pb-6 bg-white dark:bg-gray-800 rounded-md shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
      >
        <div className="border-b border-[#005a9c] dark:border-blue-500 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-1/4 flex justify-center sm:justify-start">
            <div className="relative h-24 w-24 sm:h-32 sm:w-32">
              <Image
                src="/logo-fup.png"
                alt="Logo FUP"
                width={128}
                height={128}
                className="h-full w-full object-contain dark:brightness-0 dark:invert"
                priority
                unoptimized
              />
            </div>
          </div>

          <div className="w-full sm:w-1/2 text-center">
            <div className="text-[#003366] dark:text-blue-200 font-semibold sm:text-2xl text-xl">
              REGISTRO DE CLASES Y ASISTENCIA
            </div>
            <div className="text-[#003366] dark:text-blue-200 text-xs uppercase">Docencia</div>
          </div>

          <div className="w-full sm:w-1/4 flex justify-center sm:justify-end">
            <div className="text-xs border border-[#005a9c] dark:border-blue-400 rounded dark:text-gray-100">
              <div className="flex gap-1 border-b border-[#005a9c] dark:border-blue-400 py-1 px-3">
                <span className="font-semibold">Código:</span>
                <span>FO-DO-005</span>
              </div>
              <div className="flex gap-1 border-b border-[#005a9c] dark:border-blue-400 py-1 px-3">
                <span className="font-semibold">Versión:</span>
                <span>08</span>
              </div>
              <div className="flex gap-1 py-1 px-3">
                <span className="font-semibold">Fecha:</span>
                <span className="capitalize">{metaMonthYear}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-xs border border-gray-200 dark:border-gray-700 my-4 rounded-md text-gray-900 dark:text-gray-100">
          <div className="flex gap-2">
            <span className="font-semibold">NOMBRE DEL DOCENTE:</span>
            <span>{teacherName}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold">PROGRAMA:</span>
            <span>{subject.program ?? 'N/A'}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold">ASIGNATURA:</span>
            <span>{subject.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold">AÑO:</span>
            <span>{currentYear}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold">CÓDIGO:</span>
            <span>{subject.code}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold">PERÍODO:</span>
            <span className="uppercase">{currentPeriod}</span>
          </div>
        </div>

        <div className="text-xs dark:text-gray-100">
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <div className="min-w-[720px] w-full border border-[#ECEEDF] dark:border-gray-700">
              <div className="grid" style={{ gridTemplateColumns: '5% 11% 14% 50% 7% 13%' }}>
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs border-r border-[#24699be0] h-full flex items-center justify-center p-2">
                  No.
                </div>
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs border-r border-[#24699be0]">
                  <div className="p-1">FECHA</div>
                  <div className="grid grid-cols-2 border-t border-[#24699be0]">
                    <div className="p-1 text-xs">DD</div>
                    <div className="p-1 text-xs">MM</div>
                  </div>
                </div>
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs border-r border-[#24699be0]">
                  <div className="p-1">HORA</div>
                  <div className="grid grid-cols-2 border-t border-[#24699be0]">
                    <div className="p-1 text-xs">INICIO</div>
                    <div className="p-1 text-xs">FINAL</div>
                  </div>
                </div>
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs border-r border-[#24699be0] p-2 h-full flex items-center justify-center">
                  TEMA
                </div>
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs border-r border-[#24699be0] p-2 h-full flex items-center justify-center">
                  TOTAL
                  <br />
                  HORAS
                </div>
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs p-2 h-full flex items-center justify-center">
                  FIRMA
                  <br />
                  DOCENTE
                </div>
              </div>

              <div>
                {classesToRender.map((cls, idx) => {
                  const dateObj = new Date(cls.date);
                  const showSignature = shouldShowSignature(cls.status);
                  const finalizada = isFinalizada(cls.status, cls.endTime);

                  return (
                    <div
                      key={cls.id}
                      className={`grid min-h-[48px] items-stretch border-t border-[#ECEEDF] dark:border-gray-700 ${idx % 2 === 1 ? 'bg-[#f8f9fa] dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}
                      style={{ gridTemplateColumns: '5% 11% 14% 50% 7% 13%' }}
                    >
                      <div className="flex items-center justify-center border-r border-[#ECEEDF] dark:border-gray-700 text-xs">
                        {idx + 1}
                      </div>

                      <div className="grid grid-cols-2 border-r border-[#ECEEDF] dark:border-gray-700">
                        <div className="flex items-center justify-center text-xs">
                          {formatDD(dateObj)}
                        </div>
                        <div className="flex items-center justify-center text-xs border-l border-[#ECEEDF] dark:border-gray-700">
                          {formatMM(dateObj)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 border-r border-[#ECEEDF] dark:border-gray-700">
                        <div className="flex items-center justify-center text-xs">
                          {formatTimeHHmm(cls.startTime as Date | null)}
                        </div>
                        <div className="flex items-center justify-center text-xs border-l border-[#ECEEDF] dark:border-gray-700">
                          {formatTimeHHmm(cls.endTime as Date | null)}
                        </div>
                      </div>

                      <div className="flex items-center justify-center border-r border-[#ECEEDF] dark:border-gray-700 p-2 text-center text-xs">
                        {cls.topic?.trim() || `Sesión ${idx + 1}`}
                      </div>

                      <div className="flex items-center justify-center border-r border-[#ECEEDF] dark:border-gray-700 text-xs">
                        {calculateHours(cls.startTime as Date | null, cls.endTime as Date | null)}
                      </div>

                      <div className="flex items-center justify-center p-1">
                        {showSignature && signatureUrl ? (
                          <Image
                            src={signatureUrl}
                            alt="Firma docente"
                            width={150}
                            height={48}
                            className="h-12 max-w-full object-contain my-1 dark:brightness-0 dark:invert"
                          />
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {cls.status === 'PROGRAMADA'
                              ? finalizada
                                ? 'Finalizada'
                                : 'Programada'
                              : cls.status === 'REALIZADA'
                                ? 'Realizada'
                                : cls.status === 'CANCELADA'
                                  ? 'Cancelada'
                                  : ''}
                          </span>
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
