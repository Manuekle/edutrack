import { CardDescription, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import Image from 'next/image';
import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDD(date: Date) {
  return String(date.getDate()).padStart(2, '0');
}

function formatMM(date: Date) {
  return String(date.getMonth() + 1).padStart(2, '0');
}

function formatTimeHHmm(date?: Date | null) {
  if (!date) return '--:--';
  return new Date(date).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function calculateHours(start?: Date | null, end?: Date | null) {
  if (!start || !end) return '2';
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  return String(Math.max(0, hours));
}

// “Finalizada” = PROGRAMADA cuyo endTime ya pasó.
function isFinalizada(status: string, endTime?: Date | null) {
  if (status !== 'PROGRAMADA') return false;
  if (!endTime) return false;
  return new Date(endTime).getTime() < Date.now();
}

// Mostrar firma solo en REALIZADA y CANCELADA
function shouldShowSignature(status: string) {
  return status === 'REALIZADA' || status === 'CANCELADA';
}

export default async function PreviewPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCENTE') {
    redirect('/login');
  }

  const { id } = await params;

  const subject = await db.subject.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          signatureUrl: true,
        },
      },
      classes: {
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!subject) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-red-600 dark:text-red-400">
          Asignatura no encontrada
        </h1>
      </div>
    );
  }

  if (subject.teacherId !== session.user.id) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-red-600 dark:text-red-400">No autorizado</h1>
      </div>
    );
  }

  const teacherName = subject.teacher?.name ?? 'Docente';
  const signatureUrl = subject.teacher?.signatureUrl ?? null;

  const today = new Date();
  const metaMonthYear = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentPeriod = currentMonth <= 6 ? 1 : 2;

  return (
    <div className="space-y-6">
      <div className="pb-4 w-full flex sm:flex-row flex-col items-start gap-4 justify-between">
        <div>
          <CardTitle className="text-2xl font-semibold tracking-heading dark:text-gray-100">
            Bitacora Docente
          </CardTitle>
          <CardDescription className="text-xs dark:text-gray-300">
            Visualiza el reporte de asistencia para la asignatura {subject.name}
          </CardDescription>
        </div>
        {/* <DownloadPdfButton targetId="pdf-section" /> */}
      </div>
      <div
        id="pdf-section"
        className="mx-auto px-4 sm:px-8 pb-6 bg-white dark:bg-gray-800 rounded-md shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
      >
        {/* Header estilo “PDF” */}
        <div className="border-b border-[#005a9c] dark:border-blue-500 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="w-full sm:w-1/4 flex justify-center sm:justify-start">
            <div className="relative h-24 w-24 sm:h-32 sm:w-32">
              <Image
                src="/logo-fup.png"
                alt="Logo FUP"
                width={128}
                height={128}
                className="h-full w-full object-contain"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Títulos */}
          <div className="w-full sm:w-1/2 text-center">
            <div className="text-[#003366] dark:text-blue-200 font-bold text-lg">
              REGISTRO DE CLASES Y ASISTENCIA
            </div>
            <div className="text-[#003366] dark:text-blue-200 text-xs">DOCENCIA</div>
          </div>

          {/* Meta info */}
          <div className="w-full sm:w-1/4 flex justify-center sm:justify-end">
            <div className="text-xs border border-[#005a9c] dark:border-blue-400 rounded dark:text-gray-100">
              <div className="flex gap-1 border-b border-[#005a9c] dark:border-blue-400 py-1 px-3">
                <span className="font-bold">Código:</span>
                <span>FO-DO-005</span>
              </div>
              <div className="flex gap-1 border-b border-[#005a9c] dark:border-blue-400 py-1 px-3">
                <span className="font-bold">Versión:</span>
                <span>08</span>
              </div>
              <div className="flex gap-1 py-1 px-3">
                <span className="font-bold">Fecha:</span>
                <span className="capitalize">{metaMonthYear}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Docente/Asignatura */}
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

        {/* Tabla principal */}
        <div className="text-[11px] dark:text-gray-100">
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <div className="min-w-[720px] w-full border border-[#ECEEDF] dark:border-gray-700">
              {/* Header principal */}
              <div className="grid" style={{ gridTemplateColumns: '5% 11% 14% 50% 7% 13%' }}>
                {/* No. */}
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs border-r border-[#24699be0] h-full flex items-center justify-center p-2">
                  No.
                </div>
                {/* Fecha */}
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs border-r border-[#24699be0]">
                  <div className="p-1">FECHA</div>
                  <div className="grid grid-cols-2 border-t border-[#24699be0]">
                    <div className="p-1 text-xs">DD</div>
                    <div className="p-1 text-xs">MM</div>
                  </div>
                </div>
                {/* Hora */}
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs border-r border-[#24699be0]">
                  <div className="p-1">HORA</div>
                  <div className="grid grid-cols-2 border-t border-[#24699be0]">
                    <div className="p-1 text-xs">INICIO</div>
                    <div className="p-1 text-xs">FINAL</div>
                  </div>
                </div>
                {/* Tema */}
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs border-r border-[#24699be0] p-2 h-full flex items-center justify-center">
                  TEMA
                </div>
                {/* Total Horas */}
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs border-r border-[#24699be0] p-2 h-full flex items-center justify-center">
                  TOTAL
                  <br />
                  HORAS
                </div>
                {/* Firma */}
                <div className="bg-[#005a9c] text-[#eeeeee] text-center font-semibold text-xs p-2 h-full flex items-center justify-center">
                  FIRMA
                  <br />
                  DOCENTE
                </div>
              </div>

              {/* Filas */}
              <div>
                {subject.classes.map((cls, idx) => {
                  const dateObj = new Date(cls.date);
                  const showSignature = shouldShowSignature(cls.status);
                  const finalizada = isFinalizada(cls.status, cls.endTime);

                  return (
                    <div
                      key={cls.id}
                      className={`grid min-h-[48px] items-stretch border-t border-[#ECEEDF] dark:border-gray-700 ${idx % 2 === 1 ? 'bg-[#f8f9fa] dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}
                      style={{ gridTemplateColumns: '5% 11% 14% 50% 7% 13%' }}
                    >
                      {/* No. */}
                      <div className="flex items-center justify-center border-r border-[#ECEEDF] dark:border-gray-700 text-[10px]">
                        {idx + 1}
                      </div>

                      {/* Fecha DD/MM */}
                      <div className="grid grid-cols-2 border-r border-[#ECEEDF] dark:border-gray-700">
                        <div className="flex items-center justify-center text-[10px]">
                          {formatDD(dateObj)}
                        </div>
                        <div className="flex items-center justify-center text-[10px] border-l border-[#ECEEDF] dark:border-gray-700">
                          {formatMM(dateObj)}
                        </div>
                      </div>

                      {/* Hora Inicio/Final */}
                      <div className="grid grid-cols-2 border-r border-[#ECEEDF] dark:border-gray-700">
                        <div className="flex items-center justify-center text-[10px]">
                          {formatTimeHHmm(cls.startTime as Date | null)}
                        </div>
                        <div className="flex items-center justify-center text-[10px] border-l border-[#ECEEDF] dark:border-gray-700">
                          {formatTimeHHmm(cls.endTime as Date | null)}
                        </div>
                      </div>

                      {/* Tema */}
                      <div className="flex items-center justify-center border-r border-[#ECEEDF] dark:border-gray-700 p-2 text-center text-[10px]">
                        {cls.topic?.trim() || `Sesión ${idx + 1}`}
                      </div>

                      {/* Total Horas */}
                      <div className="flex items-center justify-center border-r border-[#ECEEDF] dark:border-gray-700 text-[10px]">
                        {calculateHours(cls.startTime as Date | null, cls.endTime as Date | null)}
                      </div>

                      {/* Firma Docente */}
                      <div className="flex items-center justify-center p-1">
                        {showSignature && signatureUrl ? (
                          <Image
                            src={signatureUrl}
                            alt="Firma docente"
                            width={150}
                            height={48}
                            className="h-12 max-w-full object-contain my-1"
                          />
                        ) : (
                          // Nota: “finalizada” (PROGRAMADA con endTime pasado) NO muestra firma
                          <span className="text-[10px] text-gray-400 dark:text-gray-400">
                            {cls.status === 'PROGRAMADA'
                              ? finalizada
                                ? 'Finalizada'
                                : 'Programada'
                              : cls.status === 'REALIZADA'
                                ? 'Realizada (sin firma)'
                                : cls.status === 'CANCELADA'
                                  ? 'Cancelada (sin firma)'
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
