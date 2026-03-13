export const dynamic = 'force-dynamic';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel del Estudiante',
  description:
    'Consulta tus asignaturas, grupo y horario, registra tu asistencia y revisa tu historial académico.',
  robots: { index: false, follow: false },
};

export default function EstudianteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
