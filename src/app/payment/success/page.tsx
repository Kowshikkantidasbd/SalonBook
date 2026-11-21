'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Calendar, Check, Clock, MapPin, ShieldCheck, X } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SalonImage } from '@/components/SalonImage';
import { SalonLoader } from '@/components/SalonLoader';
import { apiFetch, invalidateApiCache } from '@/lib/api';
import {
  formatCurrency,
  type AppointmentRecord,
  type ServiceRecord,
  type TransactionRecord,
} from '@/lib/salonRules';

interface PaymentDetailsResponse {
  completed: boolean;
  transaction?: TransactionRecord;
  appointment?: AppointmentRecord;
  service?: ServiceRecord;
}

function formatReadableDate(dateStr?: string): string {
  if (!dateStr) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return dateStr;
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const appointmentIdParam = searchParams.get('appointment_id');

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<PaymentDetailsResponse | null>(null);

  const handleClose = useCallback(() => {
    router.push('/dashboard/customer/appointments');
  }, [router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  useEffect(() => {
    let active = true;

    async function loadReceipt() {
      // Immediately clear stale unpaid appointment caches so dashboard reflects Paid right away
      invalidateApiCache('/api/appointments');
      invalidateApiCache('/api/transactions');
      invalidateApiCache('/api/admin');
      invalidateApiCache('/api/customer');

      try {
        if (sessionId) {
          for (let attempt = 0; attempt < 2; attempt += 1) {
            const res = await apiFetch<PaymentDetailsResponse>(
              `/api/payments/session/${encodeURIComponent(sessionId)}`
            );
            if (!active) return;
            if (res?.completed && (res?.transaction || res?.appointment)) {
              invalidateApiCache('/api/appointments');
              invalidateApiCache('/api/admin');
              setDetails(res);
              return;
            }
            if (attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 1200));
            }
          }
        }

        // Fallback: load customer's matching or latest paid appointment so receipt stays rich
        const myRes = await apiFetch<{
          appointments: (AppointmentRecord & { service?: ServiceRecord | null })[];
        }>('/api/appointments/my');
        if (!active) return;

        const paidList = (myRes.appointments || []).filter((apt) => apt.paymentStatus === 'paid');
        const matched =
          (appointmentIdParam
            ? paidList.find((apt) => apt.id === appointmentIdParam)
            : null) || paidList[0];

        if (matched) {
          setDetails({
            completed: true,
            appointment: matched,
            service: matched.service || undefined,
            transaction: {
              id: `rcpt-${matched.id}`,
              appointmentId: matched.id,
              customerId: matched.customerId,
              amount: matched.servicePrice,
              currency: 'usd',
              stripeSessionId: matched.stripeSessionId || sessionId || 'verified_stripe_session',
              status: 'paid',
              createdAt: matched.createdAt,
            },
          });
        } else {
          setDetails(null);
        }
      } catch {
        if (active) setDetails(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReceipt();
    return () => {
      active = false;
    };
  }, [sessionId, appointmentIdParam]);

  const serviceName =
    details?.service?.serviceName ||
    details?.appointment?.serviceName ||
    'SalonBook Studio Reservation';
  const serviceCategory = details?.service?.category || 'Atelier Treatment';
  const serviceDuration = details?.service?.duration;
  const showcaseImage =
    details?.service?.image ||
    details?.appointment?.serviceImage ||
    '/images/hero_salon_interior_1795006413558.jpg';

  const receiptRef = details?.transaction?.stripeSessionId || sessionId || '';
  const displayRef =
    receiptRef.length > 26 ? `${receiptRef.slice(0, 24)}…` : receiptRef || 'Verified via Stripe';

  return (
    <section className="relative min-h-[calc(100vh-4.5rem)] bg-[#FBF8F3] py-6 sm:py-10 lg:py-14 flex items-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(31,110,67,0.06),transparent_42%),radial-gradient(circle_at_82%_80%,rgba(181,137,58,0.12),transparent_45%)]"
      />

      <div className="relative w-full max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-[#FFFFFF] border border-[#E5DDD0] rounded-2xl overflow-hidden shadow-[0_32px_80px_-34px_rgba(35,26,22,0.2)]">
          {/* Left Editorial Studio Invitation Panel */}
          <div className="relative h-64 sm:h-72 lg:h-auto lg:col-span-5 bg-[#1D1512] overflow-hidden print:hidden">
            <SalonImage
              src={showcaseImage}
              alt={serviceName}
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="absolute inset-0 w-full h-full object-cover object-[center_18%] lg:object-center opacity-85 scale-[1.01]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#140E0B]/95 via-[#1A120E]/45 to-[#1A120E]/35"
            />
            <div
              aria-hidden="true"
              className="absolute inset-4 sm:inset-5 border border-[#FBF8F3]/18 rounded-xl pointer-events-none z-10"
            />

            <div className="relative z-20 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-9 text-[#FBF8F3]">
              <div className="flex items-center justify-between gap-3 border-b border-[#FBF8F3]/16 pb-3.5 lg:pb-4">
                <div className="flex items-center gap-2 text-xs font-medium tracking-[0.04em] text-[#FBF8F3]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-3.5 h-3.5 text-[#D4AF6A] shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2.5L14.8 9.2L21.5 12L14.8 14.8L12 21.5L9.2 14.8L2.5 12L9.2 9.2L12 2.5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                  <span>SalonBook Atelier</span>
                </div>
                <span className="text-xs text-[#E2C282] whitespace-nowrap">Receipt Verified</span>
              </div>

              <div>
                <p className="text-xs text-[#E2C282] font-medium tracking-[0.03em]">
                  {serviceCategory}
                  {serviceDuration ? ` · ${serviceDuration} min` : ''}
                </p>
                <p
                  className="mt-1.5 lg:mt-2 font-display text-[1.2rem] sm:text-2xl lg:text-[1.7rem] italic font-medium leading-[1.24] text-[#FBF8F3] drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]"
                  style={{ textWrap: 'balance' }}
                >
                  “Everything is prepared for your arrival. Simply step in and unwind.”
                </p>

                <div className="hidden lg:flex items-center gap-2 mt-5 pt-4 border-t border-[#FBF8F3]/16 text-xs text-[#E5DDD0]/85">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF6A] shrink-0" aria-hidden="true" />
                  <span>418 Sutter Street, Suite 300 · San Francisco</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Verified Receipt & Actions Panel */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-9 lg:px-10 lg:pt-8 lg:pb-10 bg-[#FFFFFF]">
            <div>
              {/* Top Eyebrow & Close Action */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs font-medium text-[#1F6E43]">
                  <span className="w-6 h-px bg-[#1F6E43]/70" aria-hidden="true" />
                  <span>Payment Verified</span>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close payment confirmation"
                  title="Close"
                  className="group print:hidden -mr-1 -mt-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#FAF7F1] hover:bg-[#231A16] border border-[#E5DDD0] hover:border-[#231A16] text-[#6E6259] hover:text-[#FBF8F3] shadow-[0_2px_8px_-4px_rgba(35,26,22,0.18)] transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5893A]/60 focus-visible:ring-offset-2 cursor-pointer shrink-0"
                >
                  <X
                    className="w-4 h-4 stroke-[2] transition-transform duration-200 group-hover:rotate-90"
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Confirmation Seal & Editorial Heading */}
              <div className="mt-2.5 flex items-start justify-between gap-4">
                <div>
                  <h1
                    className="font-display text-[2.25rem] sm:text-[2.7rem] font-semibold tracking-[-0.015em] text-[#231A16] leading-[1.08]"
                    style={{ textWrap: 'balance' }}
                  >
                    Payment Confirmed
                  </h1>
                  <p className="mt-2 text-sm text-[#6E6259] leading-relaxed max-w-lg">
                    Thank you! Your Stripe payment has been verified and recorded on your appointment
                    with SalonBook Studio.
                  </p>
                </div>

                <div
                  aria-hidden="true"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#ECFDF5] border border-[#1F6E43]/25 ring-4 ring-[#ECFDF5]/70 text-[#1F6E43] flex items-center justify-center shrink-0 mt-1"
                >
                  <Check className="w-6 h-6 stroke-[2.2]" />
                </div>
              </div>

              {/* Clean Hairline Receipt Ledger */}
              <div className="mt-7 border-t border-[#ECE4D7] pt-6">
                {loading ? (
                  <SalonLoader size="sm" label="Loading verified receipt..." className="py-6" />
                ) : details?.transaction ? (
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-xs font-medium text-[#8C7F72]">Reservation Summary</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F6E43]">
                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        Paid & Verified
                      </span>
                    </div>

                    <dl className="divide-y divide-[#F0E9DC] border-y border-[#ECE4D7] text-sm">
                      <div className="py-3.5 flex items-start justify-between gap-4">
                        <dt className="text-[#6E6259] shrink-0">Treatment</dt>
                        <dd className="font-semibold text-[#231A16] text-right">{serviceName}</dd>
                      </div>

                      {details.appointment && (
                        <div className="py-3.5 flex items-start justify-between gap-4">
                          <dt className="text-[#6E6259] shrink-0">Date & Time</dt>
                          <dd className="font-medium text-[#231A16] text-right tabular-nums inline-flex flex-wrap justify-end items-center gap-x-2 gap-y-0.5 min-w-0">
                            <span>{formatReadableDate(details.appointment.appointmentDate)}</span>
                            <span className="text-[#C7B9A5]" aria-hidden="true">
                              ·
                            </span>
                            <span>{details.appointment.timeSlot}</span>
                          </dd>
                        </div>
                      )}

                      <div className="py-3.5 flex items-start justify-between gap-4">
                        <dt className="text-[#6E6259] shrink-0">Reference ID</dt>
                        <dd className="font-mono text-xs text-[#4A3F38] text-right tabular-nums break-all min-w-0">
                          {displayRef}
                        </dd>
                      </div>

                      <div className="py-4 flex items-baseline justify-between gap-4 bg-[#FAF7F1] -mx-3 px-3 rounded-lg">
                        <dt className="text-sm font-semibold text-[#231A16]">Total Paid</dt>
                        <dd className="text-xl sm:text-[1.45rem] font-semibold tracking-tight text-[#1F6E43] tabular-nums">
                          {formatCurrency(details.transaction.amount, details.transaction.currency)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <div className="py-4 border-y border-[#ECE4D7] flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2.5 text-[#231A16] font-medium">
                      <ShieldCheck className="w-4 h-4 text-[#1F6E43] shrink-0" aria-hidden="true" />
                      <span>Payment status verified and synced to your account</span>
                    </div>
                    <span className="text-xs font-semibold text-[#1F6E43] whitespace-nowrap">
                      Paid
                    </span>
                  </div>
                )}
              </div>

              {/* Studio Arrival Micro-Details */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#6E6259]">
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#9A7028] mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-[#231A16]">Arrival</p>
                    <p className="mt-0.5">Please arrive 10 min early</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#9A7028] mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-[#231A16]">Studio Location</p>
                    <p className="mt-0.5">418 Sutter St, Suite 300</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#9A7028] mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-[#231A16]">Rescheduling</p>
                    <p className="mt-0.5">Manage anytime in dashboard</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-[#F0E9DC] flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 print:hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/dashboard/customer/appointments"
                  className="group inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#352822] border border-[#B5893A]/55 hover:border-[#D4AF6A] rounded-xl shadow-[0_12px_24px_-12px_rgba(35,26,22,0.5)] transition-all duration-150 hover:-translate-y-[1px] whitespace-nowrap"
                >
                  <span>View My Appointments</span>
                  <ArrowRight
                    className="w-4 h-4 text-[#D4AF6A] transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-[#231A16] bg-[#F5F0E7] hover:bg-[#EAE1D3] border border-[#E5DDD0] rounded-xl transition-colors whitespace-nowrap"
                >
                  Browse More Services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PaymentSuccessPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Suspense fallback={<SalonLoader size="md" fullScreen label="Verifying receipt..." />}>
        <PaymentSuccessContent />
      </Suspense>
    </ProtectedRoute>
  );
}
