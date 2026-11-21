'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle2, Clock, Info, LogIn } from 'lucide-react';
import {
  ApiError,
  apiFetchRevalidate,
  appointmentsApi,
  getCachedApiData,
  isApiCacheFresh,
  primeApiCache,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  formatCurrency,
  formatDuration,
  getDefaultBookingDate,
  getLocalDateString,
  pickNextAvailableSlot,
  PREDEFINED_TIME_SLOTS,
  type ServiceRecord,
} from '@/lib/salonRules';
import { SalonImage } from '@/components/SalonImage';
import { SalonLoader } from '@/components/SalonLoader';

function getDefaultDate(): string {
  return getDefaultBookingDate();
}

function getCachedServiceById(id: string, detailPath: string): ServiceRecord | null {
  if (!id || !detailPath) return null;
  const direct = getCachedApiData<{ service: ServiceRecord }>(detailPath, 300000);
  if (direct?.service) return direct.service;
  const list = getCachedApiData<{ services: ServiceRecord[] }>('/api/services', 300000);
  return list?.services?.find((item) => item.id === id) || null;
}

export function ServiceDetailsClient({
  id,
  initialService,
}: {
  id: string;
  initialService: ServiceRecord | null;
}) {
  const detailPath = id ? `/api/services/${encodeURIComponent(id)}` : '';
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [service, setService] = useState<ServiceRecord | null>(() => initialService);
  const [loading, setLoading] = useState(() => initialService === null);
  const [error, setError] = useState<string | null>(null);

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(getDefaultDate);
  const [timeSlot, setTimeSlot] = useState<string>(PREDEFINED_TIME_SLOTS[0]);
  const timeSlotRef = useRef(timeSlot);
  timeSlotRef.current = timeSlot;

  const [message, setMessage] = useState('');
  const [slots, setSlots] = useState<{ timeSlot: string; available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [bookedSuccessId, setBookedSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !detailPath) {
      setLoading(false);
      setError('Invalid service ID.');
      return;
    }

    if (initialService) {
      primeApiCache(detailPath, { service: initialService });
      setService(initialService);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    const cachedNow = getCachedServiceById(id, detailPath);
    if (cachedNow) {
      setService(cachedNow);
      setLoading(false);
      if (isApiCacheFresh(detailPath, 20000)) {
        return () => {
          active = false;
        };
      }
    } else {
      setLoading(true);
    }

    apiFetchRevalidate<{ service: ServiceRecord }>(detailPath)
      .then((res) => {
        if (active) {
          setService(res.service);
          setError(null);
        }
      })
      .catch((err) => {
        if (active && !cachedNow) {
          setError(err instanceof Error ? err.message : 'Service not found.');
          setService(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, detailPath, initialService]);

  useEffect(() => {
    if (!service || !appointmentDate || !showBookingForm || !user) return;
    const todayStr = getLocalDateString();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate) || appointmentDate < todayStr) {
      setSlots([]);
      return;
    }
    let active = true;
    setSlotsLoading(true);
    appointmentsApi
      .getSlots(service.id, appointmentDate)
      .then((res) => {
        if (active) {
          setSlots(res.slots);
          setTimeSlot(pickNextAvailableSlot(res.slots, timeSlotRef.current));
        }
      })
      .catch(() => {
        if (active) {
          const fallback = PREDEFINED_TIME_SLOTS.map((s) => ({ timeSlot: s, available: true }));
          setSlots(fallback);
          setTimeSlot(pickNextAvailableSlot(fallback, timeSlotRef.current));
        }
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [service, appointmentDate, showBookingForm, user]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    const todayStr = getLocalDateString();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate) || appointmentDate < todayStr) {
      showToast('Past dates cannot be booked. Please choose today or a future date.', 'error');
      return;
    }
    if (!timeSlot) {
      showToast('No available time slots remain for this date. Please choose another day.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await appointmentsApi.create<{ id: string }>({
        serviceId: service.id,
        appointmentDate,
        timeSlot,
        message,
      });
      setBookedSuccessId(res.appointment.id);
      showToast('Appointment request submitted! Pending studio confirmation.', 'success');
      const updatedSlots = await appointmentsApi.getSlots(service.id, appointmentDate);
      setSlots(updatedSlots.slots);
      setTimeSlot(pickNextAvailableSlot(updatedSlots.slots, ''));
      setMessage('');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'FORBIDDEN_ROLE') {
        await refreshUser();
      }
      const msg = err instanceof Error ? err.message : 'Unable to submit appointment request.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <SalonLoader size="md" fullScreen label="Loading treatment details..." />;
  }

  if (error || !service) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-10 text-center">
          <h1 className="font-display text-3xl font-semibold text-[#231A16]">
            Service Unavailable
          </h1>
          <p className="mt-2 text-sm text-[#9F1239]">{error || 'Invalid service ID.'}</p>
          <Link
            href="/services"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#3A2C25] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF6A]" aria-hidden="true" />
            Back to Browse Services
          </Link>
        </div>
      </div>
    );
  }

  const todayStr = getLocalDateString();
  const displaySlots =
    slots.length > 0
      ? slots
      : PREDEFINED_TIME_SLOTS.map((s) => ({ timeSlot: s, available: true }));
  const allSlotsFull = !slotsLoading && slots.length > 0 && slots.every((s) => !s.available);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <Link
        href="/services"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6E6259] hover:text-[#231A16] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-[#B5893A]" aria-hidden="true" />
        Back to all services
      </Link>

      <div className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E5DDD0] bg-[#FFFFFF]">
            <SalonImage
              src={service.image}
              alt={service.serviceName}
              fallbackTitle={service.serviceName}
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6259]">
              <span className="font-semibold text-[#9A7028]">{service.category}</span>
              <span aria-hidden="true" className="text-[#B5893A]">
                ·
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#9A7028]" aria-hidden="true" />
                {formatDuration(service.duration)}
              </span>
            </div>

            <h1 className="mt-2.5 font-display text-3xl sm:text-4xl font-semibold text-[#231A16]">
              {service.serviceName}
            </h1>

            <div className="mt-4 w-12 h-px bg-[#B5893A]/60" />

            <p className="mt-4 text-base text-[#6E6259] leading-relaxed">
              {service.description}
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-6 sm:p-8 shadow-sm shadow-[#231A16]/[0.03]">
          <div className="flex items-baseline justify-between pb-5 border-b border-[#F3EDE2]">
            <div>
              <span className="text-xs font-medium text-[#6E6259]">Session Investment</span>
              <p className="text-3xl font-semibold text-[#231A16] tabular-nums mt-0.5">
                {formatCurrency(service.price)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-[#6E6259]">Estimated Duration</span>
              <p className="text-sm font-semibold text-[#9A7028] tabular-nums mt-0.5">
                {formatDuration(service.duration)}
              </p>
            </div>
          </div>

          {user?.role === 'admin' ? (
            <div className="mt-6 p-4 rounded-lg bg-[#F3EDE2] border border-[#E5DDD0] flex items-start gap-3">
              <Info className="w-5 h-5 text-[#9A7028] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-[#231A16]">
                <p className="font-semibold">Administrator Account</p>
                <p className="mt-1 text-[#6E6259]">
                  Admin accounts cannot submit customer appointment requests. Manage this service or customer bookings from your{' '}
                  <Link href="/dashboard/admin" className="text-[#9A7028] font-semibold underline">
                    Admin Dashboard
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : bookedSuccessId ? (
            <div className="mt-6 p-5 rounded-xl bg-[#ECFDF5] border border-[#1F6E43]/25 space-y-3">
              <div className="flex items-center gap-2 text-[#1F6E43] font-semibold text-base">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                Appointment Request Received
              </div>
              <p className="text-sm text-[#231A16] leading-relaxed">
                Your booking request (<span className="font-mono text-xs">{bookedSuccessId}</span>) is currently <strong>Pending</strong> studio confirmation. Once confirmed, you can complete payment from your dashboard.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <Link
                  href="/dashboard/customer/appointments"
                  className="w-full sm:w-auto text-center px-4 py-2.5 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#3A2C25] rounded-lg transition-colors"
                >
                  View My Appointments
                </Link>
                <button
                  type="button"
                  onClick={() => setBookedSuccessId(null)}
                  className="w-full sm:w-auto text-center px-4 py-2.5 text-sm font-medium text-[#231A16] bg-[#FFFFFF] border border-[#E5DDD0] hover:bg-[#F3EDE2] rounded-lg transition-colors"
                >
                  Book Another Slot
                </button>
              </div>
            </div>
          ) : !user ? (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-[#6E6259] leading-relaxed">
                Appointments are personally reviewed by our salon concierge. Sign in to select your preferred date and time slot.
              </p>
              <Link
                href={`/sign-in?redirect=${encodeURIComponent(`/services/${service.id}`)}`}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#3A2C25] border border-[#B5893A]/40 rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4 text-[#D4AF6A]" aria-hidden="true" />
                Sign In to Request Appointment
              </Link>
            </div>
          ) : !showBookingForm ? (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-[#6E6259] leading-relaxed">
                Appointments are personally reviewed by our salon concierge. Online Stripe payment is requested only once your date and time slot are confirmed.
              </p>
              <button
                type="button"
                onClick={() => setShowBookingForm(true)}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#3A2C25] border border-[#B5893A]/40 rounded-lg transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-[#D4AF6A]" aria-hidden="true" />
                Request Appointment
              </button>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="appointment-date"
                  className="block text-xs font-semibold text-[#231A16] mb-1.5"
                >
                  Preferred Date
                </label>
                <input
                  id="appointment-date"
                  type="date"
                  min={todayStr}
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] focus:outline-none focus:border-[#B5893A]"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#231A16] mb-2">
                  Available Time Slot
                </span>
                {slotsLoading ? (
                  <div className="py-2">
                    <SalonLoader size="xs" inline label="Checking open time slots..." />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                      {displaySlots.map((slotObj) => {
                        const selected = timeSlot === slotObj.timeSlot && slotObj.available;
                        return (
                          <button
                            key={slotObj.timeSlot}
                            type="button"
                            disabled={!slotObj.available}
                            onClick={() => setTimeSlot(slotObj.timeSlot)}
                            className={`py-2 px-2.5 text-xs font-medium rounded-lg border transition-colors tabular-nums ${
                              !slotObj.available
                                ? 'bg-[#F3EDE2] text-[#9C8E80] border-[#E5DDD0] line-through cursor-not-allowed'
                                : selected
                                ? 'bg-[#231A16] text-[#FBF8F3] border-[#B5893A]'
                                : 'bg-[#FBF8F3] text-[#231A16] border-[#E5DDD0] hover:border-[#B5893A]'
                            }`}
                          >
                            {slotObj.timeSlot}
                          </button>
                        );
                      })}
                    </div>
                    {allSlotsFull && (
                      <p className="mt-2 text-xs text-[#9F1239] font-medium">
                        All studio time slots are reserved for this date. Please select another day.
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label
                  htmlFor="appointment-message"
                  className="block text-xs font-semibold text-[#231A16] mb-1.5"
                >
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="appointment-message"
                  rows={3}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share stylist preferences, sensitivities, or inspiration notes..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] placeholder:text-[#9C8E80] focus:outline-none focus:border-[#B5893A]"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting || slotsLoading || allSlotsFull || !timeSlot}
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#3A2C25] border border-[#B5893A]/40 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting Request...' : 'Submit Appointment Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="py-2.5 px-4 text-sm font-medium text-[#6E6259] hover:text-[#231A16] bg-[#F3EDE2] rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
