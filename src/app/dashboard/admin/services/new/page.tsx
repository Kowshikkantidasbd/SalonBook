'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminDashboardView } from '@/components/AdminDashboardView';

export default function AdminAddServicePage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardView section="service_new" />
    </ProtectedRoute>
  );
}
