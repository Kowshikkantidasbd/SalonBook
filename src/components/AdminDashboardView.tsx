'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  PlusCircle,
  Scissors,
  User,
  Users,
  X,
} from 'lucide-react';
import { DashboardLayout, type SidebarItem } from '@/components/DashboardLayout';
import { ProfileSection } from '@/components/ProfileSection';
import { SalonImage } from '@/components/SalonImage';
import { UserBlockBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab';
import { AdminServicesTab } from '@/components/admin/AdminServicesTab';
import { AdminServiceFormTab } from '@/components/admin/AdminServiceFormTab';
import { AdminAppointmentsTab } from '@/components/admin/AdminAppointmentsTab';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminTransactionsTab } from '@/components/admin/AdminTransactionsTab';
import type {
  AdminAppointment,
  AdminCustomer,
  AdminStats,
  AdminTransaction,
} from '@/components/admin/types';
import {
  apiFetch,
  apiFetchRevalidate,
  getCachedApiData,
  invalidateApiCache,
  isApiCacheFresh,
  prefetchApiData,
} from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import type { ServiceRecord } from '@/lib/salonRules';

const ADMIN_NAV: SidebarItem[] = [
  { label: 'Overview', to: '/dashboard/admin', icon: LayoutDashboard, exact: true },
  { label: 'Manage Services', to: '/dashboard/admin/services', icon: Scissors, exact: true },
  { label: 'Add Service', to: '/dashboard/admin/services/new', icon: PlusCircle },
  { label: 'Manage Appointments', to: '/dashboard/admin/appointments', icon: Calendar },
  { label: 'Manage Users', to: '/dashboard/admin/users', icon: Users },
  { label: 'Transactions', to: '/dashboard/admin/transactions', icon: CreditCard },
  { label: 'My Profile', to: '/dashboard/admin/profile', icon: User },
];

export type AdminSection =
  | 'overview'
  | 'services'
  | 'service_new'
  | 'service_edit'
  | 'appointments'
  | 'users'
  | 'transactions'
  | 'profile';

export function AdminDashboardView({
  section,
  editId,
}: {
  section: AdminSection;
  editId?: string;
}) {
  const { showToast } = useToast();

  const cachedStats = getCachedApiData<{ stats: AdminStats }>('/api/admin/stats', 300000);
  const cachedServices = getCachedApiData<{ services: ServiceRecord[] }>(
    '/api/admin/services',
    300000
  );
  const cachedApts = getCachedApiData<{ appointments: AdminAppointment[] }>(
    '/api/admin/appointments',
    300000
  );
  const cachedUsers = getCachedApiData<{ users: AdminCustomer[] }>('/api/admin/users', 300000);
  const cachedTxns = getCachedApiData<{ transactions: AdminTransaction[] }>(
    '/api/admin/transactions',
    300000
  );

  const [stats, setStats] = useState<AdminStats | null>(() => cachedStats?.stats || null);
  const [services, setServices] = useState<ServiceRecord[]>(() => cachedServices?.services || []);
  const [appointments, setAppointments] = useState<AdminAppointment[]>(
    () => cachedApts?.appointments || []
  );
  const [users, setUsers] = useState<AdminCustomer[]>(() => cachedUsers?.users || []);
  const [transactions, setTransactions] = useState<AdminTransaction[]>(
    () => cachedTxns?.transactions || []
  );
  const [loading, setLoading] = useState<boolean>(() => {
    if (section === 'overview') return !cachedStats || !cachedApts;
    if (section === 'services' || section === 'service_edit') return !cachedServices;
    if (section === 'appointments') return !cachedApts;
    if (section === 'users') return !cachedUsers;
    if (section === 'transactions') return !cachedTxns;
    return false;
  });

  const [deleteTarget, setDeleteTarget] = useState<ServiceRecord | null>(null);
  const [deletingService, setDeletingService] = useState(false);

  const [cancelAptTarget, setCancelAptTarget] = useState<AdminAppointment | null>(null);
  const [updatingApt, setUpdatingApt] = useState(false);
  const [confirmingAptId, setConfirmingAptId] = useState<string | null>(null);
  const [viewAptDetail, setViewAptDetail] = useState<AdminAppointment | null>(null);

  const [blockTarget, setBlockTarget] = useState<AdminCustomer | null>(null);
  const [updatingBlock, setUpdatingBlock] = useState(false);
  const [viewUserDetail, setViewUserDetail] = useState<AdminCustomer | null>(null);

  const loadSectionData = useCallback(
    async (forceFresh = false) => {
      if (section === 'profile' || section === 'service_new') {
        setLoading(false);
        return;
      }

      if (forceFresh) {
        invalidateApiCache('/api/admin');
      }

      const hasCached = (() => {
        if (forceFresh) return false;
        if (section === 'overview') {
          return Boolean(
            getCachedApiData('/api/admin/stats', 300000) &&
              getCachedApiData('/api/admin/appointments', 300000)
          );
        }
        if (section === 'services' || section === 'service_edit') {
          return Boolean(getCachedApiData('/api/admin/services', 300000));
        }
        if (section === 'appointments') {
          return Boolean(getCachedApiData('/api/admin/appointments', 300000));
        }
        if (section === 'users') return Boolean(getCachedApiData('/api/admin/users', 300000));
        if (section === 'transactions') {
          return Boolean(getCachedApiData('/api/admin/transactions', 300000));
        }
        return false;
      })();

      if (!hasCached) {
        setLoading(true);
      }

      try {
        if (section === 'overview') {
          if (!forceFresh && isApiCacheFresh('/api/admin/overview', 15000)) {
            const ov = getCachedApiData<{ stats: AdminStats; appointments: AdminAppointment[] }>(
              '/api/admin/overview',
              300000
            );
            if (ov) {
              setStats(ov.stats);
              setAppointments(ov.appointments);
              setLoading(false);
              return;
            }
          }
          const overviewRes = await apiFetchRevalidate<{
            stats: AdminStats;
            appointments: AdminAppointment[];
          }>('/api/admin/overview');
          setStats(overviewRes.stats);
          setAppointments(overviewRes.appointments);
          prefetchApiData('/api/admin/services', 30000);
        } else if (section === 'services' || section === 'service_edit') {
          if (!forceFresh && isApiCacheFresh('/api/admin/services', 15000)) {
            const cached = getCachedApiData<{ services: ServiceRecord[] }>(
              '/api/admin/services',
              300000
            );
            if (cached) {
              setServices(cached.services);
              setLoading(false);
              return;
            }
          }
          const svcRes = await apiFetchRevalidate<{ services: ServiceRecord[] }>(
            '/api/admin/services'
          );
          setServices(svcRes.services);
        } else if (section === 'appointments') {
          if (!forceFresh && isApiCacheFresh('/api/admin/appointments', 15000)) {
            const cached = getCachedApiData<{ appointments: AdminAppointment[] }>(
              '/api/admin/appointments',
              300000
            );
            if (cached) {
              setAppointments(cached.appointments);
              setLoading(false);
              return;
            }
          }
          const aptRes = await apiFetchRevalidate<{ appointments: AdminAppointment[] }>(
            '/api/admin/appointments'
          );
          setAppointments(aptRes.appointments);
        } else if (section === 'users') {
          if (!forceFresh && isApiCacheFresh('/api/admin/users', 15000)) {
            const cached = getCachedApiData<{ users: AdminCustomer[] }>('/api/admin/users', 300000);
            if (cached) {
              setUsers(cached.users);
              setLoading(false);
              return;
            }
          }
          const usrRes = await apiFetchRevalidate<{ users: AdminCustomer[] }>('/api/admin/users');
          setUsers(usrRes.users);
        } else if (section === 'transactions') {
          if (!forceFresh && isApiCacheFresh('/api/admin/transactions', 15000)) {
            const cached = getCachedApiData<{ transactions: AdminTransaction[] }>(
              '/api/admin/transactions',
              300000
            );
            if (cached) {
              setTransactions(cached.transactions);
              setLoading(false);
              return;
            }
          }
          const txnRes = await apiFetchRevalidate<{ transactions: AdminTransaction[] }>(
            '/api/admin/transactions'
          );
          setTransactions(txnRes.transactions);
        }
      } catch (err) {
        if (!hasCached) {
          const msg = err instanceof Error ? err.message : 'Unable to load admin dashboard data.';
          showToast(msg, 'error');
        }
      } finally {
        setLoading(false);
      }
    },
    [section, showToast]
  );

  useEffect(() => {
    loadSectionData(false);
  }, [loadSectionData]);

  const handleToggleServiceStatus = async (svc: ServiceRecord) => {
    const nextStatus = svc.status === 'active' ? 'inactive' : 'active';
    try {
      await apiFetch(`/api/admin/services/${encodeURIComponent(svc.id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      showToast(`Service marked as ${nextStatus}.`, 'success');
      await loadSectionData(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to update service status.';
      showToast(msg, 'error');
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!deleteTarget) return;
    setDeletingService(true);
    try {
      await apiFetch(`/api/admin/services/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
      });
      showToast('Service deleted.', 'success');
      setDeleteTarget(null);
      await loadSectionData(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete service.';
      showToast(msg, 'error');
      setDeleteTarget(null);
    } finally {
      setDeletingService(false);
    }
  };

  const updateAppointmentStatus = async (
    apt: AdminAppointment,
    nextStatus: 'confirmed' | 'cancelled'
  ) => {
    if (nextStatus === 'confirmed') {
      if (confirmingAptId === apt.id) return;
      setConfirmingAptId(apt.id);
    } else {
      setUpdatingApt(true);
    }
    try {
      await apiFetch(`/api/admin/appointments/${encodeURIComponent(apt.id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      showToast(
        nextStatus === 'confirmed'
          ? 'Appointment confirmed. Customer can now pay online.'
          : 'Appointment cancelled.',
        'success'
      );
      if (nextStatus === 'cancelled') {
        setCancelAptTarget(null);
      }
      await loadSectionData(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update appointment.';
      showToast(msg, 'error');
    } finally {
      if (nextStatus === 'confirmed') {
        setConfirmingAptId(null);
      } else {
        setUpdatingApt(false);
      }
    }
  };

  const handleAppointmentAction = (
    apt: AdminAppointment,
    nextStatus: 'confirmed' | 'cancelled'
  ) => {
    if (nextStatus === 'confirmed') {
      void updateAppointmentStatus(apt, 'confirmed');
      return;
    }
    setCancelAptTarget(apt);
  };

  const handleConfirmCancelApt = async () => {
    if (!cancelAptTarget) return;
    await updateAppointmentStatus(cancelAptTarget, 'cancelled');
  };

  const handleConfirmBlockToggle = async () => {
    if (!blockTarget) return;
    setUpdatingBlock(true);
    try {
      const nextBlocked = !blockTarget.isBlocked;
      await apiFetch(`/api/admin/users/${encodeURIComponent(blockTarget.id)}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ isBlocked: nextBlocked }),
      });
      showToast(
        nextBlocked ? `${blockTarget.name} has been blocked.` : `${blockTarget.name} has been unblocked.`,
        'success'
      );
      setBlockTarget(null);
      await loadSectionData(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update user status.';
      showToast(msg, 'error');
    } finally {
      setUpdatingBlock(false);
    }
  };

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Manage salon services, review booking requests, oversee customers, and monitor Stripe payments."
      items={ADMIN_NAV}
    >
      {section === 'overview' && (
        <AdminOverviewTab
          loading={loading}
          stats={stats}
          appointments={appointments}
          onAction={handleAppointmentAction}
        />
      )}

      {section === 'services' && (
        <AdminServicesTab
          loading={loading}
          services={services}
          onToggleStatus={handleToggleServiceStatus}
          onDelete={(svc) => setDeleteTarget(svc)}
        />
      )}

      {(section === 'service_new' || section === 'service_edit') && (
        <AdminServiceFormTab
          editId={editId}
          services={services}
          onSaved={() => loadSectionData(true)}
        />
      )}

      {section === 'appointments' && (
        <AdminAppointmentsTab
          loading={loading}
          appointments={appointments}
          onInspect={(apt) => setViewAptDetail(apt)}
          onAction={handleAppointmentAction}
        />
      )}

      {section === 'users' && (
        <AdminUsersTab
          loading={loading}
          users={users}
          onInspect={(cust) => setViewUserDetail(cust)}
          onToggleBlock={(cust) => setBlockTarget(cust)}
        />
      )}

      {section === 'transactions' && (
        <AdminTransactionsTab loading={loading} transactions={transactions} />
      )}

      {section === 'profile' && <ProfileSection />}

      {viewAptDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#231A16]/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-6 shadow-xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#E5DDD0]/80">
              <div>
                <h3 className="font-display text-2xl font-semibold text-[#231A16]">
                  Appointment Request
                </h3>
                <p className="text-xs font-mono text-[#6E6259]">{viewAptDetail.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewAptDetail(null)}
                aria-label="Close modal"
                className="p-1 text-[#6E6259] hover:text-[#231A16]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#6E6259]">Customer</span>
                <span className="font-semibold text-[#231A16] text-right">
                  {viewAptDetail.customer?.name} ({viewAptDetail.customer?.email})
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#6E6259]">Service</span>
                <span className="font-medium text-[#231A16] text-right">
                  {viewAptDetail.service?.serviceName || viewAptDetail.serviceName || 'Salon Service'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#6E6259]">Schedule</span>
                <span className="tabular-nums text-[#231A16]">
                  {viewAptDetail.appointmentDate} · {viewAptDetail.timeSlot}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#6E6259]">Booking Request Date</span>
                <span className="tabular-nums text-[#231A16]">
                  {new Date(viewAptDetail.createdAt).toLocaleString()}
                </span>
              </div>
              {viewAptDetail.message && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-[#6E6259]">Customer Message</span>
                  <p className="mt-1 p-3 rounded-lg bg-[#FBF8F3] border border-[#E5DDD0] text-sm text-[#231A16]">
                    {viewAptDetail.message}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setViewAptDetail(null)}
                className="px-4 py-2 text-sm font-medium text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {viewUserDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#231A16]/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-6 shadow-xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#E5DDD0]/80">
              <h3 className="font-display text-2xl font-semibold text-[#231A16]">
                Customer Profile
              </h3>
              <button
                type="button"
                onClick={() => setViewUserDetail(null)}
                aria-label="Close customer details"
                className="p-1 text-[#6E6259] hover:text-[#231A16]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3.5">
              <SalonImage
                src={viewUserDetail.image}
                alt={viewUserDetail.name}
                className="w-14 h-14 rounded-xl object-cover border border-[#B5893A]/40"
              />
              <div>
                <p className="text-base font-semibold text-[#231A16]">{viewUserDetail.name}</p>
                <p className="text-xs text-[#6E6259]">{viewUserDetail.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6E6259]">Phone</span>
                <span className="text-[#231A16]">{viewUserDetail.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6259]">Total Bookings</span>
                <span className="tabular-nums font-semibold text-[#231A16]">
                  {viewUserDetail.appointmentCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E6259]">Account Access</span>
                <UserBlockBadge isBlocked={viewUserDetail.isBlocked} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setViewUserDetail(null)}
                className="px-4 py-2 text-sm font-medium text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Salon Service?"
        description={`Are you sure you want to permanently delete "${deleteTarget?.serviceName}"?`}
        confirmLabel="Delete Service"
        destructive
        loading={deletingService}
        onConfirm={handleConfirmDeleteService}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(cancelAptTarget)}
        title="Cancel Appointment?"
        description={`Cancel ${cancelAptTarget?.customer?.name || 'customer'}'s appointment on ${
          cancelAptTarget?.appointmentDate
        }?`}
        confirmLabel="Cancel Appointment"
        destructive
        loading={updatingApt}
        onConfirm={handleConfirmCancelApt}
        onCancel={() => setCancelAptTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(blockTarget)}
        title={blockTarget?.isBlocked ? 'Unblock Customer Account?' : 'Block Customer Account?'}
        description={
          blockTarget?.isBlocked
            ? `Restore protected platform access for ${blockTarget.name}?`
            : `Block ${blockTarget?.name} from signing in or submitting appointments?`
        }
        confirmLabel={blockTarget?.isBlocked ? 'Unblock User' : 'Block User'}
        destructive={!blockTarget?.isBlocked}
        loading={updatingBlock}
        onConfirm={handleConfirmBlockToggle}
        onCancel={() => setBlockTarget(null)}
      />
    </DashboardLayout>
  );
}
