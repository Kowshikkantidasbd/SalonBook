'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerDashboardView } from '@/components/CustomerDashboardView';

export default function CustomerAppointmentsPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <CustomerDashboardView section="appointments" />
    </ProtectedRoute>
  );
}
