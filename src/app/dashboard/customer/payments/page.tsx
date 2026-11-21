'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerDashboardView } from '@/components/CustomerDashboardView';

export default function CustomerPaymentsPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <CustomerDashboardView section="payments" />
    </ProtectedRoute>
  );
}
