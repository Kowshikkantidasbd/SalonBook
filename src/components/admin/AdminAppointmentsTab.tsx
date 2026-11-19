'use client';

import { Eye } from 'lucide-react';
import { SalonLoader } from '@/components/SalonLoader';
import { AppointmentStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import {
  canAdminCancelAppointment,
  canAdminConfirmAppointment,
  formatCurrency,
} from '@/lib/salonRules';
import type { AdminAppointment } from './types';

export function AdminAppointmentsTab({
  loading,
  appointments,
  onInspect,
  onAction,
}: {
  loading: boolean;
  appointments: AdminAppointment[];
  onInspect: (apt: AdminAppointment) => void;
  onAction: (apt: AdminAppointment, nextStatus: 'confirmed' | 'cancelled') => void;
}) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
      <div className="px-4 sm:px-6 py-5 border-b border-[#E5DDD0]/80">
        <h2 className="font-display text-2xl font-semibold text-[#231A16]">
          Manage Appointments
        </h2>
        <p className="text-xs text-[#6E6259] mt-0.5">
          Review customer appointment requests, confirm pending bookings, or cancel appointments.
        </p>
      </div>

      {loading ? (
        <SalonLoader size="sm" label="Loading appointments..." className="py-12" />
      ) : appointments.length === 0 ? (
        <div className="p-10 text-center text-sm text-[#6E6259]">No appointments found.</div>
      ) : (
        <>
          <div className="lg:hidden divide-y divide-[#E5DDD0]/70">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-4 sm:px-6 sm:py-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#231A16] truncate">
                      {apt.service?.serviceName || apt.serviceName || 'Salon Service'}
                    </p>
                    <p className="text-xs text-[#6E6259] truncate mt-0.5">
                      {apt.customer?.name || 'Guest'} · {apt.customer?.email || '—'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#231A16] tabular-nums shrink-0">
                    {formatCurrency(apt.servicePrice)}
                  </span>
                </div>

                <p className="text-xs font-medium text-[#231A16] tabular-nums">
                  {apt.appointmentDate} · {apt.timeSlot}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AppointmentStatusBadge status={apt.status} />
                    <PaymentStatusBadge status={apt.paymentStatus} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onInspect(apt)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg whitespace-nowrap transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      Inspect
                    </button>
                    {canAdminConfirmAppointment(apt) && (
                      <button
                        type="button"
                        onClick={() => onAction(apt, 'confirmed')}
                        className="px-2.5 py-1.5 text-xs font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg whitespace-nowrap transition-colors"
                      >
                        Confirm
                      </button>
                    )}
                    {canAdminCancelAppointment(apt) && (
                      <button
                        type="button"
                        onClick={() => onAction(apt, 'cancelled')}
                        className="px-2.5 py-1.5 text-xs font-semibold text-[#9F1239] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#9F1239]/20 rounded-lg whitespace-nowrap transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DDD0] bg-[#F3EDE2]/70 text-xs font-semibold text-[#6E6259]">
                  <th className="py-3 pl-5 pr-3">Customer</th>
                  <th className="py-3 px-3">Service</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD0]/70 text-sm">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-[#F3EDE2]/35 transition-colors">
                    <td className="py-3.5 pl-5 pr-3">
                      <p className="font-semibold text-[#231A16] max-w-[140px] truncate">
                        {apt.customer?.name || 'Guest'}
                      </p>
                      <p className="text-xs text-[#6E6259] max-w-[140px] truncate">
                        {apt.customer?.email || '—'}
                      </p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-medium text-[#231A16] max-w-[165px] truncate">
                        {apt.service?.serviceName || apt.serviceName || 'Salon Service'}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap tabular-nums">
                      <p className="text-[#231A16]">{apt.appointmentDate}</p>
                      <p className="text-xs text-[#6E6259]">{apt.timeSlot}</p>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#231A16] tabular-nums whitespace-nowrap">
                      {formatCurrency(apt.servicePrice)}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AppointmentStatusBadge status={apt.status} />
                        <PaymentStatusBadge status={apt.paymentStatus} />
                      </div>
                    </td>
                    <td className="py-3.5 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onInspect(apt)}
                          aria-label={`Inspect appointment ${apt.id}`}
                          className="p-1.5 text-[#6E6259] hover:text-[#231A16] hover:bg-[#F3EDE2] rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canAdminConfirmAppointment(apt) && (
                          <button
                            type="button"
                            onClick={() => onAction(apt, 'confirmed')}
                            className="px-2.5 py-1.5 text-xs font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg whitespace-nowrap transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        {canAdminCancelAppointment(apt) && (
                          <button
                            type="button"
                            onClick={() => onAction(apt, 'cancelled')}
                            className="px-2.5 py-1.5 text-xs font-semibold text-[#9F1239] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#9F1239]/20 rounded-lg whitespace-nowrap transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
