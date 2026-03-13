'use client';

import { CalendarDays, ClipboardList, FileSpreadsheet, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';

const STEPS: { path: string; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { path: '/dashboard/admin/planeador/horarios', label: '1. Programación', icon: FileSpreadsheet },
    { path: '/dashboard/admin/planeador/grupos', label: '2. Verificación', icon: CalendarDays },
    { path: '/dashboard/admin/planeador/asignacion', label: '3. Ajustes', icon: ClipboardList },
    {
      path: '/dashboard/admin/planeador/planeacion',
      label: '4. Planeación',
      icon: LayoutDashboard,
    },
  ];

export default function PlaneadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return <div className="flex flex-col gap-6">{children}</div>;
}
