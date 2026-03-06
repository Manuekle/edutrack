export const dynamic = 'force-dynamic';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel del Estudiante',
  description:
    'Consulta tu asistencia, scanear códigos QR, ver historial académico y estadísticas de tus asignaturas',
  robots: { index: false, follow: false },
};

export default function EstudianteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
