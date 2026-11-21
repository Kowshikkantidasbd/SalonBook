'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminDashboardView } from '@/components/AdminDashboardView';

export default function AdminProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardView section="profile" />
    </ProtectedRoute>
  );
}
