'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { AuthShell } from '@/components/AuthShell';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { SalonLoader } from '@/components/SalonLoader';
import { resolvePostLoginRedirect } from '@/lib/salonRules';

function SignInContent() {
  const { user, loading, login } = useAuth();
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
      router.replace(resolvePostLoginRedirect(role, redirectTarget));
    },
    [redirectTarget, router]
  );

  useEffect(() => {
    if (!loading && user && !submitting) {
      navigateAfterAuth(user.role);
    }
  }, [loading, user, submitting, navigateAfterAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const signedIn = await login(email, password);
      showToast(`Welcome back, ${signedIn.name}.`, 'success');
      navigateAfterAuth(signedIn.role);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const googleCallbackUrl =
    redirectTarget && redirectTarget.startsWith('/') && !redirectTarget.startsWith('//')
      ? redirectTarget
      : '/dashboard';

  return (
    <AuthShell
      heroImage="/images/hero_salon_interior_1795006413558.jpg"
      heroAlt="Sunlit SalonBook studio chairs, travertine counters, and brass mirrors"
      insetImage="/images/stylist_camille_director_1795011102351.jpg"
      insetAlt="Camille Laurent, Creative Director at SalonBook"
      insetCaption="San Francisco Atelier · Est. 2021"
      eyebrow="SalonBook Atelier"
      quote="A quiet sanctuary crafted around unhurried care and precision artistry."
      attribution="Camille Laurent"
      studioNote="Concierge Confirmed"
      formEyebrow="Studio Access"
      formTitle="Welcome back"
      formSubtitle="Sign in to view your upcoming reservations, studio receipts, or concierge schedule."
    >
      {errorMsg && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FFF1F2] border border-[#9F1239]/25 text-sm text-[#9F1239]"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="group">
          <label
            htmlFor="signin-email"
            className="block text-xs font-semibold text-[#231A16] mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail
              className="w-4 h-4 text-[#9C8E80] group-focus-within:text-[#9A7028] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
              className="w-full pl-10 pr-4 py-3.5 text-sm bg-[#FAF7F1] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 hover:border-[#D3C6B4] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-3 focus:ring-[#B5893A]/15"
            />
          </div>
        </div>

        <div className="group">
          <label
            htmlFor="signin-password"
            className="block text-xs font-semibold text-[#231A16] mb-2"
          >
            Password
          </label>
          <div className="relative">
            <Lock
              className="w-4 h-4 text-[#9C8E80] group-focus-within:text-[#9A7028] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
              className="w-full pl-10 pr-11 py-3.5 text-sm bg-[#FAF7F1] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 hover:border-[#D3C6B4] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-3 focus:ring-[#B5893A]/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#6E6259] hover:text-[#231A16] hover:bg-[#F3EDE2]/80 transition-colors cursor-pointer"
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
          className="group w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 text-sm font-semibold tracking-[0.015em] text-[#FBF8F3] bg-[#231A16] hover:bg-[#352822] border border-[#B5893A]/55 hover:border-[#D4AF6A] rounded-xl shadow-[0_14px_28px_-14px_rgba(35,26,22,0.55)] transition-all duration-150 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5893A]/50 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
        >
          <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
          {!submitting && (
            <ArrowRight
              className="w-4 h-4 text-[#D4AF6A] transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          )}
        </button>
      </form>

      <GoogleSignInButton
        label="signin_with"
        callbackURL={googleCallbackUrl}
        onSuccess={(user) => {
          showToast(`Welcome back, ${user.name}.`, 'success');
          navigateAfterAuth(user.role);
        }}
        onError={(msg) => {
          setErrorMsg(msg);
          showToast(msg, 'error');
        }}
      />

      <p className="mt-7 pt-5 border-t border-[#F0E9DC] text-center text-sm text-[#6E6259]">
        New to SalonBook?{' '}
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-1 font-semibold text-[#9A7028] hover:text-[#231A16] transition-colors"
        >
          Create an account
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SalonLoader size="md" fullScreen label="Loading sign in..." />}>
      <SignInContent />
    </Suspense>
  );
}
