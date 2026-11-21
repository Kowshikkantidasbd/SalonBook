'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, CreditCard, ExternalLink, Eye, LayoutDashboard, Mail, Phone, Receipt, User, X } from 'lucide-react';
import { DashboardLayout, type SidebarItem } from '@/components/DashboardLayout';
import { ProfileSection } from '@/components/ProfileSection';
import { SalonImage } from '@/components/SalonImage';
import { SalonLoader } from '@/components/SalonLoader';
import { AppointmentStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  appointmentsApi,
  getCachedApiData,
  invalidateApiCache,
  paymentsApi,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  canCustomerCancelAppointment,
  canCustomerPayAppointment,
  formatCurrency,
  type AppointmentRecord,
  type ServiceRecord,
  type TransactionRecord,
} from '@/lib/salonRules';

interface PopulatedCustomerAppointment extends AppointmentRecord {
  service: ServiceRecord | null;
}

interface PopulatedCustomerTransaction extends TransactionRecord {
  appointment: AppointmentRecord | null;
  service: ServiceRecord | null;
}

interface CustomerPaymentSummary {
  totalPaid: number;
  completedPayments: number;
  unpaidConfirmedBalance: number;
}

interface CustomerStats {
  totalRequests: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
}

const CUSTOMER_NAV: SidebarItem[] = [
  { label: 'Overview', to: '/dashboard/customer', icon: LayoutDashboard, exact: true },
  { label: 'My Appointments', to: '/dashboard/customer/appointments', icon: Calendar },
  { label: 'Payment History', to: '/dashboard/customer/payments', icon: Receipt },
  { label: 'My Profile', to: '/dashboard/customer/profile', icon: User },
];

export function CustomerDashboardView({
  section,
}: {
  section: 'overview' | 'appointments' | 'payments' | 'profile';
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const cachedApts =
    section === 'overview' || section === 'appointments'
      ? getCachedApiData<{ appointments: PopulatedCustomerAppointment[] }>(
          '/api/appointments/my',
          300000
        )
      : null;

  const cachedTxns =
    section === 'payments'
      ? getCachedApiData<{
          transactions: PopulatedCustomerTransaction[];
          summary?: CustomerPaymentSummary;
        }>('/api/transactions/my', 300000)
      : null;

  const [appointments, setAppointments] = useState<PopulatedCustomerAppointment[]>(
    () => cachedApts?.appointments || []
  );
  const [transactions, setTransactions] = useState<PopulatedCustomerTransaction[]>(
    () => cachedTxns?.transactions || []
  );
  const [paymentSummary, setPaymentSummary] = useState<CustomerPaymentSummary>(
    () =>
      cachedTxns?.summary || {
        totalPaid: 0,
        completedPayments: 0,
        unpaidConfirmedBalance: 0,
      }
  );
  const [loading, setLoading] = useState(() => {
    if (section === 'profile') return false;
    if (section === 'payments') return !cachedTxns;
    return !cachedApts;
  });

  const [selectedApt, setSelectedApt] = useState<PopulatedCustomerAppointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PopulatedCustomerAppointment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const stats: CustomerStats = {
    totalRequests: appointments.length,
    pendingAppointments: appointments.filter((a) => a.status === 'pending').length,
    confirmedAppointments: appointments.filter((a) => a.status === 'confirmed').length,
    cancelledAppointments: appointments.filter((a) => a.status === 'cancelled').length,
  };

  useEffect(() => {
    if (!selectedApt) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedApt(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedApt]);

  const loadData = useCallback(
    async (forceFresh = false, silent = false) => {
      if (section === 'profile') {
        setLoading(false);
        return;
      }
      if (section === 'payments') {
        if (forceFresh) {
          invalidateApiCache('/api/transactions/my');
        }
        const existingTxns = !forceFresh
          ? getCachedApiData<{
              transactions: PopulatedCustomerTransaction[];
              summary?: CustomerPaymentSummary;
            }>('/api/transactions/my', 300000)
          : null;

        if (existingTxns) {
          setTransactions(existingTxns.transactions);
          if (existingTxns.summary) setPaymentSummary(existingTxns.summary);
          setLoading(false);
        } else if (!silent) {
          setLoading(true);
        }

        try {
          const txnsRes = await paymentsApi.getMyTransactions<{
            transactions: PopulatedCustomerTransaction[];
            summary?: CustomerPaymentSummary;
          }>();
          setTransactions(txnsRes.transactions || []);
          if (txnsRes.summary) {
            setPaymentSummary(txnsRes.summary);
          }
        } catch (err) {
          if (!existingTxns && !silent) {
            const msg = err instanceof Error ? err.message : 'Unable to load payment history.';
            showToast(msg, 'error');
          }
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
        return;
      }

      if (forceFresh) {
        invalidateApiCache('/api/appointments/my');
      }
      const existing = !forceFresh
        ? getCachedApiData<{ appointments: PopulatedCustomerAppointment[] }>(
            '/api/appointments/my',
            300000
          )
        : null;

      if (existing) {
        setAppointments(existing.appointments);
        setLoading(false);
      } else if (!silent) {
        setLoading(true);
      }

      try {
        const aptsRes = await appointmentsApi.getMy<PopulatedCustomerAppointment>();
        setAppointments(aptsRes.appointments);
      } catch (err) {
        if (!existing && !silent) {
          const msg = err instanceof Error ? err.message : 'Unable to load dashboard data.';
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
    loadData(false, false);
  }, [loadData]);

  useEffect(() => {
    if (section === 'profile') return;
    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        void loadData(true, true);
      }
    };
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);
    return () => {
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, [section, loadData]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    try {
      await appointmentsApi.cancel(cancelTarget.id);
      showToast('Pending appointment request cancelled.', 'success');
      setCancelTarget(null);
      await loadData(true, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel appointment.';
      showToast(msg, 'error');
      setCancelTarget(null);
      await loadData(true, true);
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNow = async (aptId: string) => {
    setPayingId(aptId);
    try {
      const res = await paymentsApi.createCheckoutSession(aptId);
      invalidateApiCache('/api/appointments');
      invalidateApiCache('/api/admin');
      if (res.mode === 'stripe' && res.url.startsWith('http')) {
        window.location.href = res.url;
      } else {
        router.push(res.url);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to start payment checkout.';
      showToast(msg, 'error');
      setPayingId(null);
    }
  };

  return (
    <DashboardLayout
      title="Customer Dashboard"
      subtitle="Track your appointment requests, settle confirmed bookings, and manage your profile."
      items={CUSTOMER_NAV}
    >
      {section === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
              <p className="text-xs font-medium text-[#6E6259]">Total Appointment Requests</p>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[#231A16] tabular-nums">
                {loading ? '—' : stats?.totalRequests ?? 0}
              </p>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
              <p className="text-xs font-medium text-[#6E6259]">Pending Appointments</p>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[#9A7028] tabular-nums">
                {loading ? '—' : stats?.pendingAppointments ?? 0}
              </p>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
              <p className="text-xs font-medium text-[#6E6259]">Confirmed Appointments</p>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[#1F6E43] tabular-nums">
                {loading ? '—' : stats?.confirmedAppointments ?? 0}
              </p>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
              <p className="text-xs font-medium text-[#6E6259]">Cancelled Appointments</p>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[#9F1239] tabular-nums">
                {loading ? '—' : stats?.cancelledAppointments ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
            <div className="px-4 sm:px-6 py-4 border-b border-[#E5DDD0]/80 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-[#231A16]">
                Recent Appointments
              </h2>
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/customer/payments"
                  className="text-xs font-medium text-[#6E6259] hover:text-[#231A16] hover:underline whitespace-nowrap"
                >
                  Payment history
                </Link>
                <Link
                  href="/dashboard/customer/appointments"
                  className="text-xs font-semibold text-[#9A7028] hover:text-[#231A16] hover:underline whitespace-nowrap"
                >
                  Manage all appointments
                </Link>
              </div>
            </div>

            {loading ? (
              <SalonLoader size="sm" label="Loading your appointments..." className="py-10" />
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#6E6259]">You have not requested any appointments yet.</p>
                <Link
                  href="/services"
                  className="mt-4 inline-block px-4 py-2 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg transition-colors"
                >
                  Browse Salon Services
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#E5DDD0]/70">
                {appointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.id}
                    className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#F3EDE2]/35 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SalonImage
                        src={apt.service?.image || apt.serviceImage}
                        alt={apt.service?.serviceName || apt.serviceName || 'Salon Service'}
                        sizes="48px"
                        className="w-12 h-12 rounded-lg object-cover border border-[#E5DDD0] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#231A16] truncate">
                          {apt.service?.serviceName || apt.serviceName || 'Salon Service'}
                        </p>
                        <p className="text-xs text-[#6E6259] tabular-nums mt-0.5">
                          {apt.appointmentDate} · {apt.timeSlot} · {formatCurrency(apt.servicePrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <AppointmentStatusBadge status={apt.status} />
                      <PaymentStatusBadge status={apt.paymentStatus} />
                      {user && canCustomerPayAppointment(apt, user.id) && (
                        <button
                          type="button"
                          onClick={() => handlePayNow(apt.id)}
                          disabled={payingId === apt.id}
                          className="px-3 py-1.5 text-xs font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {payingId === apt.id ? 'Redirecting...' : 'Pay Now'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {section === 'appointments' && (
        <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
          <div className="px-4 sm:px-6 py-5 border-b border-[#E5DDD0]/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#231A16]">
                My Appointments
              </h2>
              <p className="text-xs text-[#6E6259] mt-0.5">
                Cancel pending requests or complete Stripe payment for confirmed bookings.
              </p>
            </div>
            <Link
              href="/services"
              className="px-4 py-2 text-xs font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg transition-colors whitespace-nowrap"
            >
              Book New Appointment
            </Link>
          </div>

          {loading ? (
            <SalonLoader size="sm" label="Loading appointments..." className="py-12" />
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-[#6E6259]">No appointment requests found.</p>
              <Link
                href="/services"
                className="mt-4 inline-block px-4 py-2 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] border border-[#B5893A]/40 rounded-lg"
              >
                Explore Salon Services
              </Link>
            </div>
          ) : (
            <>
              <div className="xl:hidden divide-y divide-[#E5DDD0]/70 md:divide-y-0 md:grid md:grid-cols-2 md:gap-4 md:p-5">
                {appointments.map((apt) => {
                  const canCancel = user ? canCustomerCancelAppointment(apt, user.id) : false;
                  const canPay = user ? canCustomerPayAppointment(apt, user.id) : false;

                  return (
                    <div
                      key={apt.id}
                      className="p-4 sm:p-5 space-y-3.5 md:rounded-xl md:border md:border-[#E5DDD0] md:bg-[#FBF8F3]/45 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <SalonImage
                              src={apt.service?.image || apt.serviceImage}
                              alt={apt.service?.serviceName || apt.serviceName || 'Service'}
                              sizes="48px"
                              className="w-11 h-11 rounded-lg object-cover border border-[#E5DDD0] shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#231A16] truncate">
                                {apt.service?.serviceName || apt.serviceName || 'Salon Service'}
                              </p>
                              <p className="text-xs text-[#6E6259] truncate">
                                {apt.service?.category || 'Salon'}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-[#231A16] tabular-nums shrink-0">
                            {formatCurrency(apt.servicePrice)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6259]">
                          <span className="font-medium text-[#231A16] tabular-nums">
                            {apt.appointmentDate} · {apt.timeSlot}
                          </span>
                          <span className="tabular-nums">
                            Requested {new Date(apt.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#E5DDD0]/60">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <AppointmentStatusBadge status={apt.status} />
                          <PaymentStatusBadge status={apt.paymentStatus} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedApt(apt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            Details
                          </button>
                          {canPay && (
                            <button
                              type="button"
                              onClick={() => handlePayNow(apt.id)}
                              disabled={payingId === apt.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg transition-colors whitespace-nowrap disabled:opacity-60"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-[#B5893A]" aria-hidden="true" />
                              {payingId === apt.id ? 'Starting...' : 'Pay Now'}
                            </button>
                          )}
                          {apt.paymentStatus === 'paid' && apt.stripeSessionId && (
                            <Link
                              href={`/payment/success?session_id=${encodeURIComponent(apt.stripeSessionId)}&appointment_id=${encodeURIComponent(apt.id)}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1F6E43] bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#1F6E43]/20 rounded-lg transition-colors whitespace-nowrap"
                            >
                              <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                              Receipt
                            </Link>
                          )}
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(apt)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-[#9F1239] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#9F1239]/20 rounded-lg transition-colors whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden xl:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5DDD0] bg-[#F3EDE2]/70 text-xs font-semibold text-[#6E6259]">
                      <th className="py-3 pl-4 pr-3">Service</th>
                      <th className="py-3 px-2.5">Appointment</th>
                      <th className="py-3 px-2.5">Price</th>
                      <th className="py-3 px-2.5">Status</th>
                      <th className="py-3 px-2.5">Payment</th>
                      <th className="py-3 pl-2.5 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DDD0]/70 text-sm">
                    {appointments.map((apt) => {
                      const canCancel = user ? canCustomerCancelAppointment(apt, user.id) : false;
                      const canPay = user ? canCustomerPayAppointment(apt, user.id) : false;

                      return (
                        <tr key={apt.id} className="hover:bg-[#F3EDE2]/35 transition-colors">
                          <td className="py-3.5 pl-4 pr-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <SalonImage
                                src={apt.service?.image || apt.serviceImage}
                                alt={apt.service?.serviceName || apt.serviceName || 'Service'}
                                sizes="48px"
                                className="w-10 h-10 rounded-lg object-cover border border-[#E5DDD0] shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-[#231A16] max-w-[165px] truncate">
                                  {apt.service?.serviceName || apt.serviceName || 'Salon Service'}
                                </p>
                                <p className="text-xs text-[#6E6259]">
                                  {apt.service?.category || 'Salon'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-2.5 whitespace-nowrap tabular-nums">
                            <p className="font-medium text-[#231A16]">
                              {apt.appointmentDate} · {apt.timeSlot}
                            </p>
                            <p className="text-xs text-[#6E6259]">
                              Requested {new Date(apt.createdAt).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-3.5 px-2.5 font-semibold text-[#231A16] tabular-nums whitespace-nowrap">
                            {formatCurrency(apt.servicePrice)}
                          </td>
                          <td className="py-3.5 px-2.5 whitespace-nowrap">
                            <AppointmentStatusBadge status={apt.status} />
                          </td>
                          <td className="py-3.5 px-2.5 whitespace-nowrap">
                            <PaymentStatusBadge status={apt.paymentStatus} />
                          </td>
                          <td className="py-3.5 pl-2.5 pr-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedApt(apt)}
                                aria-label={`View appointment details for ${apt.service?.serviceName || apt.serviceName || apt.id}`}
                                className="p-1.5 text-[#6E6259] hover:text-[#231A16] hover:bg-[#F3EDE2] rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {canPay && (
                                <button
                                  type="button"
                                  onClick={() => handlePayNow(apt.id)}
                                  disabled={payingId === apt.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg transition-colors whitespace-nowrap disabled:opacity-60"
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-[#B5893A]" aria-hidden="true" />
                                  {payingId === apt.id ? 'Starting...' : 'Pay Now'}
                                </button>
                              )}
                              {apt.paymentStatus === 'paid' && apt.stripeSessionId && (
                                <Link
                                  href={`/payment/success?session_id=${encodeURIComponent(apt.stripeSessionId)}&appointment_id=${encodeURIComponent(apt.id)}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1F6E43] bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#1F6E43]/20 rounded-lg transition-colors whitespace-nowrap"
                                >
                                  <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                                  Receipt
                                </Link>
                              )}
                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() => setCancelTarget(apt)}
                                  className="px-2.5 py-1.5 text-xs font-semibold text-[#9F1239] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#9F1239]/20 rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {section === 'payments' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
              <p className="text-xs font-medium text-[#6E6259]">Total Paid</p>
              <p className="mt-2 font-display text-3xl font-semibold text-[#1F6E43] tabular-nums">
                {loading ? '—' : formatCurrency(paymentSummary.totalPaid)}
              </p>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
              <p className="text-xs font-medium text-[#6E6259]">Verified Receipts</p>
              <p className="mt-2 font-display text-3xl font-semibold text-[#231A16] tabular-nums">
                {loading ? '—' : paymentSummary.completedPayments}
              </p>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
              <p className="text-xs font-medium text-[#6E6259]">Confirmed Balance Due</p>
              <p className="mt-2 font-display text-3xl font-semibold text-[#9A7028] tabular-nums">
                {loading ? '—' : formatCurrency(paymentSummary.unpaidConfirmedBalance)}
              </p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
            <div className="px-4 sm:px-6 py-5 border-b border-[#E5DDD0]/80 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#231A16]">
                  Payment History
                </h2>
                <p className="text-xs text-[#6E6259] mt-0.5">
                  Verified Stripe payments and printable studio receipts for your reservations.
                </p>
              </div>
              <Link
                href="/dashboard/customer/appointments"
                className="px-4 py-2 text-xs font-semibold text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg transition-colors whitespace-nowrap"
              >
                View Appointments
              </Link>
            </div>

            {loading ? (
              <SalonLoader size="sm" label="Loading payment history..." className="py-12" />
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-[#6E6259]">
                  No completed payment transactions yet. Confirmed appointments can be settled online from My Appointments.
                </p>
                <Link
                  href="/dashboard/customer/appointments"
                  className="mt-4 inline-block px-4 py-2 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg transition-colors"
                >
                  Go to My Appointments
                </Link>
              </div>
            ) : (
              <>
                <div className="xl:hidden divide-y divide-[#E5DDD0]/70 md:divide-y-0 md:grid md:grid-cols-2 md:gap-4 md:p-5">
                  {transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="p-4 sm:p-5 space-y-3 md:rounded-xl md:border md:border-[#E5DDD0] md:bg-[#FBF8F3]/45 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <SalonImage
                            src={txn.service?.image || txn.appointment?.serviceImage}
                            alt={txn.service?.serviceName || txn.appointment?.serviceName || 'Service'}
                            sizes="44px"
                            className="w-11 h-11 rounded-lg object-cover border border-[#E5DDD0] shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#231A16] truncate">
                              {txn.service?.serviceName || txn.appointment?.serviceName || 'Salon Service'}
                            </p>
                            <p className="text-xs text-[#6E6259] tabular-nums mt-0.5">
                              {txn.appointment
                                ? `${txn.appointment.appointmentDate} · ${txn.appointment.timeSlot}`
                                : new Date(txn.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#1F6E43] tabular-nums shrink-0">
                          {formatCurrency(txn.amount, txn.currency)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5DDD0]/60">
                        <div className="flex items-center gap-2">
                          <PaymentStatusBadge status={txn.status} />
                          <span className="text-xs text-[#6E6259] tabular-nums">
                            {new Date(txn.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {txn.status === 'paid' && (
                          <Link
                            href={`/payment/success?session_id=${encodeURIComponent(txn.stripeSessionId)}&appointment_id=${encodeURIComponent(txn.appointmentId)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg transition-colors whitespace-nowrap"
                          >
                            <span>View Receipt</span>
                            <ExternalLink className="w-3 h-3 text-[#9A7028]" aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden xl:block">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5DDD0] bg-[#F3EDE2]/70 text-xs font-semibold text-[#6E6259]">
                        <th className="py-3 pl-4 pr-3">Service &amp; Reference</th>
                        <th className="py-3 px-2.5">Appointment</th>
                        <th className="py-3 px-2.5">Amount</th>
                        <th className="py-3 px-2.5">Status</th>
                        <th className="py-3 pl-2.5 pr-4 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DDD0]/70 text-sm">
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-[#F3EDE2]/35 transition-colors">
                          <td className="py-3.5 pl-4 pr-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <SalonImage
                                src={txn.service?.image || txn.appointment?.serviceImage}
                                alt={txn.service?.serviceName || txn.appointment?.serviceName || 'Service'}
                                sizes="44px"
                                className="w-10 h-10 rounded-lg object-cover border border-[#E5DDD0] shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-[#231A16] max-w-[220px] truncate">
                                  {txn.service?.serviceName || txn.appointment?.serviceName || 'Salon Service'}
                                </p>
                                <p className="font-mono text-[11px] text-[#6E6259] truncate max-w-[220px]">
                                  {txn.stripeSessionId.length > 24
                                    ? `${txn.stripeSessionId.slice(0, 22)}…`
                                    : txn.stripeSessionId}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-2.5 whitespace-nowrap tabular-nums">
                            <p className="text-xs font-medium text-[#231A16]">
                              {txn.appointment
                                ? `${txn.appointment.appointmentDate} · ${txn.appointment.timeSlot}`
                                : '—'}
                            </p>
                            <p className="text-[11px] text-[#6E6259] mt-0.5">
                              Paid {new Date(txn.createdAt).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-3.5 px-2.5 font-semibold text-[#1F6E43] tabular-nums whitespace-nowrap">
                            {formatCurrency(txn.amount, txn.currency)}
                          </td>
                          <td className="py-3.5 px-2.5 whitespace-nowrap">
                            <PaymentStatusBadge status={txn.status} />
                          </td>
                          <td className="py-3.5 pl-2.5 pr-4 text-right whitespace-nowrap">
                            {txn.status === 'paid' ? (
                              <Link
                                href={`/payment/success?session_id=${encodeURIComponent(txn.stripeSessionId)}&appointment_id=${encodeURIComponent(txn.appointmentId)}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg transition-colors whitespace-nowrap"
                              >
                                <span>Receipt</span>
                                <ExternalLink className="w-3 h-3 text-[#9A7028]" aria-hidden="true" />
                              </Link>
                            ) : (
                              <span className="text-xs text-[#6E6259]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
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
                    title="Active Account"
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
                  Exclusive SalonBook Atelier Member
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

      {selectedApt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#231A16]/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="apt-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApt(null);
          }}
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5DDD0]/80">
              <div className="min-w-0">
                <h3 id="apt-detail-title" className="font-display text-2xl font-semibold text-[#231A16]">
                  Appointment Details
                </h3>
                <p className="text-xs font-mono text-[#6E6259] mt-0.5 break-all">{selectedApt.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApt(null)}
                aria-label="Close appointment details"
                className="p-1.5 text-[#6E6259] hover:text-[#231A16] shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#6E6259]">Service</span>
                <span className="font-semibold text-[#231A16] text-right">
                  {selectedApt.service?.serviceName || selectedApt.serviceName || 'Salon Service'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#6E6259]">Category</span>
                <span className="text-[#231A16]">{selectedApt.service?.category || '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#6E6259]">Scheduled Slot</span>
                <span className="font-medium text-[#231A16] tabular-nums">
                  {selectedApt.appointmentDate} · {selectedApt.timeSlot}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#6E6259]">Service Price</span>
                <span className="font-semibold text-[#231A16] tabular-nums">
                  {formatCurrency(selectedApt.servicePrice)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[#6E6259]">Booking Status</span>
                <AppointmentStatusBadge status={selectedApt.status} />
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[#6E6259]">Payment Status</span>
                <PaymentStatusBadge status={selectedApt.paymentStatus} />
              </div>
              {selectedApt.stripeSessionId && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#6E6259]">Stripe Reference</span>
                  <span className="font-mono text-xs text-[#231A16]">
                    {selectedApt.stripeSessionId.slice(0, 18)}...
                  </span>
                </div>
              )}
              {selectedApt.message && (
                <div className="pt-2 border-t border-[#E5DDD0]/80">
                  <span className="text-xs font-semibold text-[#6E6259]">Customer Message</span>
                  <p className="mt-1 text-sm text-[#231A16] bg-[#FBF8F3] p-3 rounded-lg border border-[#E5DDD0]">
                    {selectedApt.message}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              {selectedApt.paymentStatus === 'paid' && selectedApt.stripeSessionId && (
                <Link
                  href={`/payment/success?session_id=${encodeURIComponent(selectedApt.stripeSessionId)}&appointment_id=${encodeURIComponent(selectedApt.id)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#1F6E43] bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#1F6E43]/20 rounded-lg transition-colors"
                >
                  <Receipt className="w-4 h-4" aria-hidden="true" />
                  View Receipt
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSelectedApt(null)}
                className="px-4 py-2 text-sm font-medium text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel Appointment Request?"
        description={`Are you sure you want to cancel your pending request for ${
          cancelTarget?.service?.serviceName || cancelTarget?.serviceName || 'this service'
        } on ${cancelTarget?.appointmentDate} at ${cancelTarget?.timeSlot}?`}
        confirmLabel="Yes, Cancel Request"
        destructive
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </DashboardLayout>
  );
}
