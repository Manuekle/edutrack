import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel del Docente',
  description:
    'Gestiona tus asignaturas, clases, reportes y seguimientos de asistencia de tus estudiantes',
  robots: { index: false, follow: false },
};

export default function DocenteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
