'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerDashboardView } from '@/components/CustomerDashboardView';

export default function CustomerProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <CustomerDashboardView section="profile" />
    </ProtectedRoute>
  );
}
