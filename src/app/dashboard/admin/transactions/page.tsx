'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminDashboardView } from '@/components/AdminDashboardView';

export default function AdminTransactionsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardView section="transactions" />
    </ProtectedRoute>
  );
}
