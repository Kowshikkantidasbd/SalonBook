'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminDashboardView } from '@/components/AdminDashboardView';

export default function AdminEditServicePage() {
  const params = useParams<{ id: string }>();
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardView section="service_edit" editId={params?.id} />
    </ProtectedRoute>
  );
}
