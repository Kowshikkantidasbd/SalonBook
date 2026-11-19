'use client';

import Link from 'next/link';
import { SalonLoader } from '@/components/SalonLoader';
import { formatCurrency } from '@/lib/salonRules';
import type { AdminAppointment, AdminStats } from './types';

export function AdminOverviewTab({
  loading,
  stats,
  appointments,
  onAction,
}: {
  loading: boolean;
  stats: AdminStats | null;
  appointments: AdminAppointment[];
  onAction: (apt: AdminAppointment, nextStatus: 'confirmed' | 'cancelled') => void;
}) {
  const pending = appointments.filter((a) => a.status === 'pending');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
          <p className="text-xs font-medium text-[#6E6259]">Total Registered Customers</p>
          <p className="mt-2 font-display text-3xl font-semibold text-[#231A16] tabular-nums">
            {loading ? '—' : stats?.totalCustomers ?? 0}
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
          <p className="text-xs font-medium text-[#6E6259]">Total Active Services</p>
          <p className="mt-2 font-display text-3xl font-semibold text-[#231A16] tabular-nums">
            {loading ? '—' : stats?.totalActiveServices ?? 0}
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
          <p className="text-xs font-medium text-[#6E6259]">Total Appointment Requests</p>
          <p className="mt-2 font-display text-3xl font-semibold text-[#231A16] tabular-nums">
            {loading ? '—' : stats?.totalAppointments ?? 0}
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
          <p className="text-xs font-medium text-[#6E6259]">Pending Appointments</p>
          <p className="mt-2 font-display text-3xl font-semibold text-[#9A7028] tabular-nums">
            {loading ? '—' : stats?.pendingAppointments ?? 0}
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
          <p className="text-xs font-medium text-[#6E6259]">Confirmed Appointments</p>
          <p className="mt-2 font-display text-3xl font-semibold text-[#1F6E43] tabular-nums">
            {loading ? '—' : stats?.confirmedAppointments ?? 0}
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
          <p className="text-xs font-medium text-[#6E6259]">Total Successful Payments</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="font-display text-3xl font-semibold text-[#231A16] tabular-nums">
              {loading ? '—' : stats?.totalSuccessfulPayments ?? 0}
            </p>
            <span className="text-sm font-semibold text-[#1F6E43] tabular-nums">
              {loading ? '' : formatCurrency(stats?.totalRevenue ?? 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
        <div className="px-4 sm:px-6 py-4 border-b border-[#E5DDD0]/80 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-[#231A16]">
            Pending Appointment Requests
          </h2>
          <Link
            href="/dashboard/admin/appointments"
            className="text-xs font-semibold text-[#9A7028] hover:text-[#231A16] hover:underline whitespace-nowrap"
          >
            Open full queue
          </Link>
        </div>
        {loading ? (
          <SalonLoader size="sm" label="Loading requests..." className="py-10" />
        ) : pending.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6E6259]">
            All appointment requests have been reviewed.
          </div>
        ) : (
          <div className="divide-y divide-[#E5DDD0]/70">
            {pending.slice(0, 4).map((apt) => (
              <div
                key={apt.id}
                className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#F3EDE2]/35 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#231A16] truncate">
                    {apt.customer?.name || 'Guest'} ·{' '}
                    <span className="font-normal text-[#6E6259]">
                      {apt.service?.serviceName || apt.serviceName || 'Salon Service'}
                    </span>
                  </p>
                  <p className="text-xs text-[#6E6259] tabular-nums mt-0.5">
                    {apt.appointmentDate} at {apt.timeSlot} · {formatCurrency(apt.servicePrice)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => onAction(apt, 'confirmed')}
                    className="px-3 py-1.5 text-xs font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction(apt, 'cancelled')}
                    className="px-3 py-1.5 text-xs font-semibold text-[#9F1239] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#9F1239]/20 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
