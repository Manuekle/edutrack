'use client';

import { CalendarDays, ClipboardList, FileSpreadsheet, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';

const STEPS = [
  { href: '/dashboard/admin/planeador/horarios', label: '1. Programación', icon: FileSpreadsheet },
  { href: '/dashboard/admin/planeador/asignacion', label: '2. Ajustes', icon: ClipboardList },
  { href: '/dashboard/admin/planeador/planeacion', label: '3. Planeación', icon: LayoutDashboard },
];

export default function PlaneadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return <div className="flex flex-col gap-6">{children}</div>;
}
