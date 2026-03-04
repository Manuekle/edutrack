import SidebarLayout from '@/components/sidebar-layout';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Dashboard - FUP',
  description: 'Panel de control para gestionar tus datos',
  keywords: 'dashboard, panel de control, FUP',
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarLayout>
      <div className="font-sans" id="main-content">
        {children}
      </div>
    </SidebarLayout>
  );
}
