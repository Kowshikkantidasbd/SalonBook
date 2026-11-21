'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, XCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SalonLoader } from '@/components/SalonLoader';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const isFailed = reason === 'payment_failed';

  return (
    <section className="relative min-h-[calc(100vh-4.5rem)] bg-[#FBF8F3] py-10 sm:py-16 flex items-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(159,18,57,0.05),transparent_48%)]"
      />

      <div className="relative w-full max-w-xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-2xl p-8 sm:p-11 shadow-[0_28px_70px_-34px_rgba(35,26,22,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 text-xs font-medium text-[#9F1239]">
                <span className="w-6 h-px bg-[#9F1239]/60" aria-hidden="true" />
                <span>{isFailed ? 'Transaction Declined' : 'Checkout Cancelled'}</span>
              </div>
              <h1 className="mt-2.5 font-display text-3xl sm:text-[2.5rem] font-semibold tracking-[-0.015em] text-[#231A16] leading-[1.1]">
                {isFailed ? 'Payment Declined' : 'Payment Cancelled'}
              </h1>
              <p className="mt-2.5 text-sm text-[#6E6259] leading-relaxed">
                {isFailed
                  ? 'Your payment could not be completed. Your confirmed appointment remains reserved and unpaid so you can try again anytime.'
                  : 'No charge was made. Your confirmed appointment remains reserved and unpaid in your customer dashboard.'}
              </p>
            </div>

            <div
              aria-hidden="true"
              className="w-12 h-12 rounded-full bg-[#FFF1F2] border border-[#9F1239]/20 ring-4 ring-[#FFF1F2]/70 text-[#9F1239] flex items-center justify-center shrink-0"
            >
              <XCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#F0E9DC] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/dashboard/customer/appointments"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#352822] border border-[#B5893A]/55 hover:border-[#D4AF6A] rounded-xl transition-all duration-150 whitespace-nowrap"
            >
              <span>Return to My Appointments</span>
              <ArrowRight
                className="w-4 h-4 text-[#D4AF6A] transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-[#231A16] bg-[#F5F0E7] hover:bg-[#EAE1D3] border border-[#E5DDD0] rounded-xl transition-colors whitespace-nowrap"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PaymentCancelPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Suspense fallback={<SalonLoader size="md" fullScreen label="Loading payment status..." />}>
        <PaymentCancelContent />
      </Suspense>
    </ProtectedRoute>
  );
}
