'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminDashboardView } from '@/components/AdminDashboardView';

export default function AdminAppointmentsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardView section="appointments" />
    </ProtectedRoute>
  );
}
