'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

function DashboardRedirectInner() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer');
  }, [user, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm text-[#6E6259]">
      Redirecting to your dashboard...
    </div>
  );
}

export default function DashboardRedirectPage() {
  return (
    <ProtectedRoute>
      <DashboardRedirectInner />
    </ProtectedRoute>
  );
}
