'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminDashboardView } from '@/components/AdminDashboardView';

export default function AdminOverviewPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardView section="overview" />
    </ProtectedRoute>
  );
}
