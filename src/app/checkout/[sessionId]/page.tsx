'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SalonLoader } from '@/components/SalonLoader';
import { apiFetch, invalidateApiCache } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/salonRules';
import {
  detectCardBrand,
  formatCardCvc,
  formatCardExpiry,
  formatCardNumber,
  isDeclinedTestCard,
  validateCheckoutPaymentForm,
  type CheckoutFieldErrors,
  type CheckoutPaymentFormValues,
} from '@/lib/checkoutValidation';

interface SessionInfo {
  sessionId: string;
  appointmentId: string;
  serviceName: string;
  amount: number;
  currency: string;
  appointmentDate?: string;
  timeSlot?: string;
}

const COUNTRIES = [
  'United States',
  'Bangladesh',
  'United Kingdom',
  'Canada',
  'Australia',
  'India',
  'Germany',
  'France',
  'Singapore',
  'United Arab Emirates',
];

const CARD_BRAND_LABELS: Record<string, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
  discover: 'DISC',
};

function CheckoutContent() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId;
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CheckoutPaymentFormValues>({
    email: user?.email || '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    cardholderName: '',
    country: 'United States',
    postalCode: '',
  });
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});

  useEffect(() => {
    if (user?.email) {
      setForm((prev) => (prev.email ? prev : { ...prev, email: user.email }));
    }
  }, [user?.email]);

  useEffect(() => {
    if (!sessionId) return;
    apiFetch<{
      session?: SessionInfo;
      appointment?: { appointmentDate?: string; timeSlot?: string } | null;
      completed: boolean;
    }>(`/api/payments/session/${encodeURIComponent(sessionId)}`)
      .then((res) => {
        if (res.completed) {
          router.replace(`/payment/success?session_id=${sessionId}`);
          return;
        }
        if (res.session) {
          setSession({
            ...res.session,
            appointmentDate: res.appointment?.appointmentDate || res.session.appointmentDate,
            timeSlot: res.appointment?.timeSlot || res.session.timeSlot,
          });
        } else {
          setSession(null);
        }
      })
      .catch((err) => setError(err.message || 'Invalid checkout session.'))
      .finally(() => setLoading(false));
  }, [sessionId, router]);

  const cardBrand = detectCardBrand(form.cardNumber);

  const updateField = <K extends keyof CheckoutPaymentFormValues>(
    field: K,
    value: CheckoutPaymentFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionId || processing) return;

    const validation = validateCheckoutPaymentForm(form);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      showToast('Please complete all required payment details.', 'error');
      return;
    }

    setFieldErrors({});
    setProcessing(true);

    const outcome = isDeclinedTestCard(form.cardNumber) ? 'fail' : 'success';

    try {
      const res = await apiFetch<{ redirectUrl: string }>('/api/payments/test-complete', {
        method: 'POST',
        body: JSON.stringify({ sessionId, outcome }),
      });
      invalidateApiCache('/api/appointments');
      invalidateApiCache('/api/admin');
      invalidateApiCache('/api/customer');
      invalidateApiCache('/api/transactions');
      router.replace(res.redirectUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment processing error.';
      showToast(msg, 'error');
      setProcessing(false);
    }
  };

  if (loading) {
    return <SalonLoader size="md" fullScreen label="Loading checkout session..." />;
  }

  if (error || !session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-[#231A16]">
            Checkout Session Unavailable
          </h1>
          <p className="mt-2 text-sm text-[#9F1239]">{error || 'Session not found.'}</p>
          <Link
            href="/dashboard/customer/appointments"
            className="mt-6 inline-block px-5 py-2.5 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] rounded-lg"
          >
            Return to My Appointments
          </Link>
        </div>
      </div>
    );
  }

  const formattedAmount = formatCurrency(session.amount, session.currency);

  return (
    <section className="min-h-[calc(100vh-4.5rem)] bg-[#FBF8F3] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#FFFFFF] border border-[#E5DDD0] rounded-2xl overflow-hidden shadow-[0_28px_72px_-36px_rgba(35,26,22,0.22)]">
          {/* Left Order Summary Panel */}
          <div className="lg:col-span-5 bg-[#231A16] text-[#FBF8F3] p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <Link
                href={`/payment/cancel?appointment_id=${encodeURIComponent(session.appointmentId)}`}
                className="inline-flex items-center gap-2 text-xs font-medium text-[#E5DDD0]/85 hover:text-[#FBF8F3] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF6A]" aria-hidden="true" />
                <span>SalonBook Studio</span>
              </Link>

              <div className="mt-8">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D4AF6A]">
                  Pay SalonBook Studio
                </p>
                <p className="mt-2 font-display text-4xl sm:text-[2.65rem] font-semibold tracking-tight tabular-nums text-[#FBF8F3]">
                  {formattedAmount}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#FBF8F3]/14 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#FBF8F3]">{session.serviceName}</p>
                    <p className="mt-1 text-xs text-[#E5DDD0]/75">
                      Confirmed Appointment · Qty 1
                    </p>
                    {session.appointmentDate && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[#E2C282] tabular-nums">
                        <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          {session.appointmentDate}
                          {session.timeSlot ? ` · ${session.timeSlot}` : ''}
                        </span>
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-[#FBF8F3] shrink-0">
                    {formattedAmount}
                  </span>
                </div>

                <div className="pt-4 border-t border-[#FBF8F3]/14 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#E5DDD0]/80">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formattedAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold text-[#FBF8F3] pt-2 border-t border-[#FBF8F3]/14">
                    <span>Total due</span>
                    <span className="tabular-nums">{formattedAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#FBF8F3]/14 flex flex-wrap items-center justify-between gap-2 text-xs text-[#E5DDD0]/70">
              <span className="break-all">Ref: {session.appointmentId}</span>
              <span className="inline-flex items-center gap-1 text-[#D4AF6A] shrink-0">
                <Lock className="w-3 h-3" aria-hidden="true" />
                Encrypted
              </span>
            </div>
          </div>

          {/* Right Manual Card Checkout Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 bg-[#FFFFFF]">
            <div className="mb-6">
              <h1 className="font-display text-2xl sm:text-[1.75rem] font-semibold text-[#231A16]">
                Pay with card
              </h1>
              <p className="mt-1 text-xs text-[#6E6259]">
                Enter your payment details below to confirm and complete your reservation.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="checkout-email"
                  className="block text-xs font-semibold text-[#231A16] mb-1.5"
                >
                  Email
                </label>
                <input
                  id="checkout-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={`w-full px-3.5 py-2.5 text-sm text-[#231A16] bg-[#FFFFFF] border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#B5893A]/35 ${
                    fieldErrors.email
                      ? 'border-[#9F1239] focus:border-[#9F1239]'
                      : 'border-[#DDD3C3] focus:border-[#231A16]'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-[#9F1239]">{fieldErrors.email}</p>
                )}
              </div>

              {/* Card Information Group */}
              <div>
                <label
                  htmlFor="checkout-card-number"
                  className="block text-xs font-semibold text-[#231A16] mb-1.5"
                >
                  Card information
                </label>
                <div
                  className={`rounded-lg border overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-[#B5893A]/35 ${
                    fieldErrors.cardNumber || fieldErrors.expiry || fieldErrors.cvc
                      ? 'border-[#9F1239]'
                      : 'border-[#DDD3C3] focus-within:border-[#231A16]'
                  }`}
                >
                  <div className="relative border-b border-[#E5DDD0]">
                    <input
                      id="checkout-card-number"
                      name="cardNumber"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 1234 1234 1234"
                      value={form.cardNumber}
                      onChange={(e) => updateField('cardNumber', formatCardNumber(e.target.value))}
                      aria-invalid={Boolean(fieldErrors.cardNumber)}
                      className="w-full px-3.5 py-2.5 pr-16 text-sm font-mono text-[#231A16] bg-[#FFFFFF] focus:outline-none"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1.5">
                      {CARD_BRAND_LABELS[cardBrand] ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider rounded bg-[#F5F0E7] text-[#231A16] border border-[#E5DDD0]">
                          {CARD_BRAND_LABELS[cardBrand]}
                        </span>
                      ) : (
                        <CreditCard className="w-4 h-4 text-[#8C7F72]" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-[#E5DDD0]">
                    <input
                      id="checkout-expiry"
                      name="expiry"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      aria-label="Expiration date"
                      placeholder="MM / YY"
                      value={form.expiry}
                      onChange={(e) => updateField('expiry', formatCardExpiry(e.target.value))}
                      aria-invalid={Boolean(fieldErrors.expiry)}
                      className="w-full min-w-0 px-3.5 py-2.5 text-sm font-mono text-[#231A16] bg-[#FFFFFF] focus:outline-none"
                    />
                    <input
                      id="checkout-cvc"
                      name="cvc"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      aria-label="CVC"
                      placeholder={cardBrand === 'amex' ? '4-digit CVC' : 'CVC'}
                      value={form.cvc}
                      onChange={(e) => updateField('cvc', formatCardCvc(e.target.value, cardBrand))}
                      aria-invalid={Boolean(fieldErrors.cvc)}
                      className="w-full min-w-0 px-3.5 py-2.5 text-sm font-mono text-[#231A16] bg-[#FFFFFF] focus:outline-none"
                    />
                  </div>
                </div>
                {(fieldErrors.cardNumber || fieldErrors.expiry || fieldErrors.cvc) && (
                  <p className="mt-1 text-xs text-[#9F1239]">
                    {fieldErrors.cardNumber || fieldErrors.expiry || fieldErrors.cvc}
                  </p>
                )}
              </div>

              {/* Cardholder Name */}
              <div>
                <label
                  htmlFor="checkout-cardholder"
                  className="block text-xs font-semibold text-[#231A16] mb-1.5"
                >
                  Cardholder name
                </label>
                <input
                  id="checkout-cardholder"
                  name="cardholderName"
                  type="text"
                  autoComplete="cc-name"
                  placeholder="Full name on card"
                  value={form.cardholderName}
                  onChange={(e) => updateField('cardholderName', e.target.value)}
                  aria-invalid={Boolean(fieldErrors.cardholderName)}
                  className={`w-full px-3.5 py-2.5 text-sm text-[#231A16] bg-[#FFFFFF] border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#B5893A]/35 ${
                    fieldErrors.cardholderName
                      ? 'border-[#9F1239] focus:border-[#9F1239]'
                      : 'border-[#DDD3C3] focus:border-[#231A16]'
                  }`}
                />
                {fieldErrors.cardholderName && (
                  <p className="mt-1 text-xs text-[#9F1239]">{fieldErrors.cardholderName}</p>
                )}
              </div>

              {/* Country or Region + Postal Code */}
              <div>
                <label
                  htmlFor="checkout-country"
                  className="block text-xs font-semibold text-[#231A16] mb-1.5"
                >
                  Country or region
                </label>
                <div
                  className={`rounded-lg border overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-[#B5893A]/35 ${
                    fieldErrors.country || fieldErrors.postalCode
                      ? 'border-[#9F1239]'
                      : 'border-[#DDD3C3] focus-within:border-[#231A16]'
                  }`}
                >
                  <select
                    id="checkout-country"
                    name="country"
                    autoComplete="country-name"
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm text-[#231A16] bg-[#FFFFFF] border-b border-[#E5DDD0] focus:outline-none"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  <input
                    id="checkout-postal"
                    name="postalCode"
                    type="text"
                    autoComplete="postal-code"
                    aria-label="ZIP or postal code"
                    placeholder="ZIP / Postal code"
                    value={form.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    aria-invalid={Boolean(fieldErrors.postalCode)}
                    className="w-full px-3.5 py-2.5 text-sm text-[#231A16] bg-[#FFFFFF] focus:outline-none"
                  />
                </div>
                {(fieldErrors.country || fieldErrors.postalCode) && (
                  <p className="mt-1 text-xs text-[#9F1239]">
                    {fieldErrors.country || fieldErrors.postalCode}
                  </p>
                )}
              </div>

              {/* Submit + Cancel */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#3A2C25] border border-[#B5893A]/45 rounded-xl shadow-[0_12px_24px_-12px_rgba(35,26,22,0.5)] transition-all duration-150 disabled:opacity-60 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-[#D4AF6A]" aria-hidden="true" />
                  <span>{processing ? 'Processing Payment...' : `Pay ${formattedAmount}`}</span>
                </button>

                <Link
                  href={`/payment/cancel?appointment_id=${encodeURIComponent(session.appointmentId)}`}
                  className="block w-full py-2.5 px-4 text-xs font-medium text-center text-[#6E6259] hover:text-[#231A16] bg-[#F5F0E7] hover:bg-[#EAE1D3] border border-[#E5DDD0] rounded-xl transition-colors"
                >
                  Cancel & Return to Appointments
                </Link>
              </div>

              <p className="pt-1 flex items-center justify-center gap-1.5 text-xs text-[#6E6259]">
                <ShieldCheck className="w-4 h-4 text-[#9A7028]" aria-hidden="true" />
                <span>Payments are encrypted and securely verified</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <CheckoutContent />
    </ProtectedRoute>
  );
}
