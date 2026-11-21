'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminDashboardView } from '@/components/AdminDashboardView';

export default function AdminServicesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardView section="services" />
    </ProtectedRoute>
  );
}
