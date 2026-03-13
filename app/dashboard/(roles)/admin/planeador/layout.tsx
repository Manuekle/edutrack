'use client';

import { CalendarDays, ClipboardList, FileSpreadsheet, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';

const STEPS = [
  { href: '/dashboard/admin/planeador/periodos', label: '1. Periodos Académicos', icon: CalendarDays },
  { href: '/dashboard/admin/planeador/horarios', label: '2. Programación', icon: FileSpreadsheet },
  { href: '/dashboard/admin/planeador/asignacion', label: '3. Ajustes', icon: ClipboardList },
  { href: '/dashboard/admin/planeador/planeacion', label: '4. Planeación', icon: LayoutDashboard },
];

export default function PlaneadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return <div className="flex flex-col gap-6">{children}</div>;
}
