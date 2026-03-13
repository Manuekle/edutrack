'use client';

import { CalendarDays, ClipboardList, LayoutDashboard, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';

const STEPS: { path: string; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { path: '/dashboard/admin/planeador/horarios', label: '1. Horarios', icon: CalendarDays },
    { path: '/dashboard/admin/planeador/grupos', label: '2. Grupos', icon: Users },
    { path: '/dashboard/admin/planeador/asignacion', label: '3. Asignación', icon: ClipboardList },
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
