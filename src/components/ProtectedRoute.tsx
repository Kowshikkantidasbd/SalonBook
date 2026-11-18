'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SalonLoader } from '@/components/SalonLoader';
import type { UserRole } from '@/lib/salonRules';

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer');
    }
  }, [loading, user, allowedRoles, pathname, router]);

  if (loading || !user) {
    return <SalonLoader size="md" fullScreen label="Verifying studio access..." />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <SalonLoader size="md" fullScreen label="Redirecting to your dashboard..." />;
  }

  return <>{children}</>;
}
