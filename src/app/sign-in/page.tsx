'use client';

import React, { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { SalonImage } from '@/components/SalonImage';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { SalonLoader } from '@/components/SalonLoader';

function SignInContent() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigateAfterAuth = useCallback(
    (role: 'admin' | 'customer') => {
      if (redirectTarget && redirectTarget.startsWith('/')) {
        router.replace(redirectTarget);
      } else {
        router.replace(role === 'admin' ? '/dashboard/admin' : '/dashboard/customer');
      }
    },
    [redirectTarget, router]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}.`, 'success');
      navigateAfterAuth(user.role);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isCustomerDemo = email === 'customer@salonbook.com';
  const isAdminDemo = email === 'admin@salonbook.com';

  return (
    <section className="relative py-6 sm:py-12 lg:py-16 bg-[radial-gradient(ellipse_at_top,_#F3EDE2_0%,_#FBF8F3_68%)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-[#FFFFFF] border border-[#E5DDD0] rounded-2xl overflow-hidden shadow-[0_24px_60px_-28px_rgba(35,26,22,0.18)] lg:min-h-[650px]">
          <div className="hidden lg:flex lg:col-span-6 relative bg-[#231A16] overflow-hidden">
            <SalonImage
              src="/images/stylist_camille_director_1795011102351.jpg"
              alt="Camille Laurent inside the sunlit SalonBook San Francisco studio"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="w-full h-full object-cover object-center opacity-95 scale-[1.01]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#231A16]/95 via-[#231A16]/30 to-[#231A16]/30"
            />

            <div className="absolute inset-0 flex flex-col justify-between p-10 text-[#FBF8F3]">
              <div className="flex items-center gap-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 text-[#D4AF6A] shrink-0"
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
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FBF8F3]/90">
                  San Francisco Atelier · Est. 2021
                </span>
              </div>

              <div className="max-w-md">
                <div className="w-10 h-px bg-[#D4AF6A]/80 mb-4" />
                <blockquote className="font-display text-[1.75rem] font-medium leading-[1.32] italic text-[#FBF8F3]">
                  “A quiet sanctuary crafted around unhurried care and precision artistry.”
                </blockquote>
                <div className="mt-4 flex items-center justify-between gap-4 text-xs text-[#E5DDD0]/85 border-t border-[#FBF8F3]/15 pt-4">
                  <span>Camille Laurent · Creative Director</span>
                  <span className="text-[#D4AF6A]">Tue – Sat · 9 AM – 7 PM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center p-5 sm:p-10 lg:p-14 bg-[#FFFFFF]">
            <div className="w-full max-w-md mx-auto">
              <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A7028]">
                <span className="w-6 h-px bg-[#B5893A]/75" aria-hidden="true" />
                <span>Studio Access</span>
              </div>

              <h1 className="mt-3 font-display text-4xl sm:text-[2.65rem] font-semibold tracking-[-0.015em] text-[#231A16] leading-tight">
                Sign In
              </h1>
              <p className="mt-2.5 text-sm text-[#6E6259] leading-relaxed">
                Access your SalonBook appointments, payment receipts, or studio management dashboard.
              </p>

              {errorMsg && (
                <div
                  role="alert"
                  className="mt-5 p-3.5 rounded-xl bg-[#FFF1F2] border border-[#9F1239]/25 text-sm text-[#9F1239]"
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-xs font-semibold tracking-[0.02em] text-[#231A16] mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 text-[#9A7028] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="signin-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-2 focus:ring-[#B5893A]/15"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signin-password"
                    className="block text-xs font-semibold tracking-[0.02em] text-[#231A16] mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 text-[#9A7028] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-3 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-2 focus:ring-[#B5893A]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#6E6259] hover:text-[#231A16] hover:bg-[#F3EDE2]/70 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 text-sm font-semibold tracking-[0.02em] text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/50 hover:border-[#D4AF6A] rounded-xl shadow-[0_12px_26px_-12px_rgba(35,26,22,0.5)] transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                >
                  <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
                  {!submitting && (
                    <ArrowRight
                      className="w-4 h-4 text-[#D4AF6A] transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </form>

              <GoogleSignInButton
                label="signin_with"
                onSuccess={(user) => {
                  showToast(`Signed in with Google as ${user.name}.`, 'success');
                  navigateAfterAuth(user.role);
                }}
                onError={(msg) => {
                  setErrorMsg(msg);
                  showToast(msg, 'error');
                }}
              />

              <div className="mt-8 pt-6 border-t border-[#E5DDD0]/80">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6E6259]">
                    Quick Demo Access
                  </p>
                  <span className="text-[11px] text-[#9C8E80]">One-click fill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setEmail('customer@salonbook.com');
                      setPassword('Customer123');
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      isCustomerDemo
                        ? 'bg-[#F3EDE2] border-[#B5893A] text-[#231A16]'
                        : 'bg-[#FBF8F3] border-[#E5DDD0] text-[#231A16] hover:border-[#B5893A]/70 hover:bg-[#F3EDE2]/65'
                    }`}
                  >
                    <User className="w-4 h-4 text-[#9A7028] shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#231A16] truncate">
                        Fill Customer Demo
                      </p>
                      <p className="text-[11px] text-[#6E6259] truncate">
                        Guest booking view
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setEmail('admin@salonbook.com');
                      setPassword('Admin123');
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      isAdminDemo
                        ? 'bg-[#F3EDE2] border-[#B5893A] text-[#231A16]'
                        : 'bg-[#FBF8F3] border-[#E5DDD0] text-[#231A16] hover:border-[#B5893A]/70 hover:bg-[#F3EDE2]/65'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#9A7028] shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#9A7028] truncate">
                        Fill Admin Demo
                      </p>
                      <p className="text-[11px] text-[#6E6259] truncate">
                        Concierge console
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <p className="mt-7 text-center text-sm text-[#6E6259]">
                New to SalonBook?{' '}
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-1 font-semibold text-[#9A7028] hover:text-[#231A16] transition-colors"
                >
                  Create an account
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SalonLoader size="md" fullScreen label="Loading sign in..." />}>
      <SignInContent />
    </Suspense>
  );
}
