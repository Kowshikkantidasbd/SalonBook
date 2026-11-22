'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  Mail,
  Phone,
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
  adminApi,
  getCachedApiData,
  invalidateApiCache,
  isApiCacheFresh,
  prefetchApiData,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

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

  useEffect(() => {
    if (!viewAptDetail && !viewUserDetail) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setViewAptDetail(null);
        setViewUserDetail(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewAptDetail, viewUserDetail]);

  const loadSectionData = useCallback(
    async (forceFresh = false, silent = false) => {
      if (forceFresh) {
        invalidateApiCache('/api/admin');
      }

      if (section === 'profile' || section === 'service_new') {
        setLoading(false);
        return;
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

      if (!hasCached && !silent) {
        setLoading(true);
      }

      try {
        if (section === 'overview') {
          const overviewRes = await adminApi.getOverview<{
            stats: AdminStats;
            appointments: AdminAppointment[];
          }>();
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
          const svcRes = await adminApi.getServices<ServiceRecord>();
          setServices(svcRes.services);
        } else if (section === 'appointments') {
          const aptRes = await adminApi.getAppointments<AdminAppointment>();
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
          const usrRes = await adminApi.getUsers<AdminCustomer>();
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
          const txnRes = await adminApi.getTransactions<AdminTransaction>();
          setTransactions(txnRes.transactions);
        }
      } catch (err) {
        if (!hasCached && !silent) {
          const msg = err instanceof Error ? err.message : 'Unable to load admin dashboard data.';
          showToast(msg, 'error');
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [section, showToast]
  );

  useEffect(() => {
    loadSectionData(false, false);
  }, [loadSectionData]);

  useEffect(() => {
    if (section !== 'overview' && section !== 'appointments' && section !== 'transactions') {
      return;
    }
    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        void loadSectionData(true, true);
      }
    };
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);
    return () => {
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, [section, loadSectionData]);

  const handleToggleServiceStatus = async (svc: ServiceRecord) => {
    const nextStatus = svc.status === 'active' ? 'inactive' : 'active';
    try {
      await adminApi.toggleServiceStatus<ServiceRecord>(svc.id, nextStatus);
      invalidateApiCache('/api/services');
      router.refresh();
      showToast(`Service marked as ${nextStatus}.`, 'success');
      await loadSectionData(true, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to update service status.';
      showToast(msg, 'error');
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!deleteTarget) return;
    setDeletingService(true);
    try {
      await adminApi.deleteService(deleteTarget.id);
      invalidateApiCache('/api/services');
      router.refresh();
      showToast('Service deleted.', 'success');
      setDeleteTarget(null);
      await loadSectionData(true, true);
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
      if (updatingApt) return;
      setUpdatingApt(true);
    }
    try {
      await adminApi.updateAppointmentStatus<AdminAppointment>(apt.id, nextStatus);
      setAppointments((prev) =>
        prev.map((item) => (item.id === apt.id ? { ...item, status: nextStatus } : item))
      );
      showToast(
        nextStatus === 'confirmed'
          ? 'Appointment confirmed. Customer can now pay online.'
          : 'Appointment cancelled.',
        'success'
      );
      if (nextStatus === 'cancelled') {
        setCancelAptTarget(null);
      }
      await loadSectionData(true, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update appointment.';
      showToast(msg, 'error');
      if (nextStatus === 'cancelled') {
        setCancelAptTarget(null);
      }
      await loadSectionData(true, true);
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
      await adminApi.setUserBlocked(blockTarget.id, nextBlocked);
      showToast(
        nextBlocked ? `${blockTarget.name} has been blocked.` : `${blockTarget.name} has been unblocked.`,
        'success'
      );
      setBlockTarget(null);
      await loadSectionData(true, true);
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
          loading={loading}
          onSaved={async () => {
            invalidateApiCache('/api/services');
            await loadSectionData(true, true);
          }}
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

      {section === 'profile' && user && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <aside className="lg:col-span-4 bg-[#FFFFFF] border border-[#E5DDD0] rounded-2xl overflow-hidden shadow-[0_16px_40px_-20px_rgba(35,26,22,0.18)]">
            <div className="relative h-36 w-full overflow-hidden border-b border-[#B5893A]/30 bg-[#1A1412]">
              <SalonImage
                src="/images/hero_salon_interior_1795006413558.jpg"
                alt="SalonBook Atelier Interior"
                sizes="(max-width: 1024px) 100vw, 380px"
                className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-700 hover:scale-110"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#1F1714] via-[#1F1714]/40 to-black/25"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(212,175,106,0.35),transparent_60%)]"
              />
            </div>

            <div className="relative z-10 px-5 pb-5">
              <div className="-mt-14 flex items-end">
                <div className="relative group">
                  <SalonImage
                    src={user.image}
                    alt={user.name}
                    sizes="96px"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-[#FFFFFF] ring-2 ring-[#B5893A]/70 shadow-xl bg-[#F3EDE2] transition-transform duration-300 group-hover:scale-105"
                  />
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex items-center justify-center text-[9px] text-white font-bold"
                    title="Active Admin"
                  >
                    ✓
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-display text-2xl font-semibold text-[#231A16] leading-tight">
                  {user.name}
                </h3>
                <p className="text-xs font-medium text-[#9A7028] mt-0.5">
                  SalonBook Atelier Creative Director
                </p>

                <div className="mt-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#FAF7F1] border border-[#EAE2D5] text-[#3D332C]">
                    <Mail className="w-3.5 h-3.5 text-[#9A7028] shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#FAF7F1] border border-[#EAE2D5] text-[#3D332C]">
                    <Phone className="w-3.5 h-3.5 text-[#9A7028] shrink-0" aria-hidden="true" />
                    <span className="tabular-nums font-medium">{user.phone || 'No phone added'}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8">
            <ProfileSection className="w-full max-w-none" />
          </div>
        </div>
      )}

      {viewAptDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#231A16]/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewAptDetail(null);
          }}
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#E5DDD0]/80">
              <div className="min-w-0">
                <h3 className="font-display text-2xl font-semibold text-[#231A16]">
                  Appointment Request
                </h3>
                <p className="text-xs font-mono text-[#6E6259] break-all">{viewAptDetail.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewAptDetail(null)}
                aria-label="Close modal"
                className="p-1.5 text-[#6E6259] hover:text-[#231A16] shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#6E6259] shrink-0">Customer</span>
                <span className="font-semibold text-[#231A16] text-right break-words min-w-0">
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewUserDetail(null);
          }}
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#E5DDD0]/80">
              <h3 className="font-display text-2xl font-semibold text-[#231A16]">
                Customer Profile
              </h3>
              <button
                type="button"
                onClick={() => setViewUserDetail(null)}
                aria-label="Close customer details"
                className="p-1.5 text-[#6E6259] hover:text-[#231A16] shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3.5">
              <SalonImage
                src={viewUserDetail.image}
                alt={viewUserDetail.name}
                className="w-14 h-14 rounded-xl object-cover border border-[#B5893A]/40 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-base font-semibold text-[#231A16] truncate">{viewUserDetail.name}</p>
                <p className="text-xs text-[#6E6259] break-all">{viewUserDetail.email}</p>
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

