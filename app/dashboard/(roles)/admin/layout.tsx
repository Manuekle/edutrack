import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de Administración',
  description:
    'Gestiona usuarios, asignaturas, matrículas y reportes del sistema de asistencias FUP',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
