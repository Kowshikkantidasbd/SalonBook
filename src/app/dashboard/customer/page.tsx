'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerDashboardView } from '@/components/CustomerDashboardView';

export default function CustomerOverviewPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <CustomerDashboardView section="overview" />
    </ProtectedRoute>
  );
}
