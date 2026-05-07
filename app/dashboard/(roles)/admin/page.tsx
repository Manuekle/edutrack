'use client';

import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const AdminDashboardComponent = dynamic(() => import('@/components/admin-dashboard'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48 rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  ),
});

export default function AdminDashboard() {
  return (
    <>
      <AdminDashboardComponent />
    </>
  );
}
