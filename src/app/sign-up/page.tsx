'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Upload,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, uploadImageFile } from '@/lib/api';
import { validatePassword, type PublicUser } from '@/lib/salonRules';
import { SalonImage } from '@/components/SalonImage';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export default function SignUpPage() {
  const { register, setUserDirect } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasMinLen = password.length >= 6;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    showToast('Profile photo selected and will upload on account creation.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const passValidation = validatePassword(password);
    if (!passValidation.valid) {
      setErrorMsg(passValidation.message || 'Invalid password.');
      return;
    }

    setSubmitting(true);
    try {
      let user = await register({ name, email, password, image });
      if (pendingFile) {
        try {
          const uploadedUrl = await uploadImageFile(pendingFile);
          const updated = await apiFetch<{ user: PublicUser }>('/api/profile', {
            method: 'PUT',
            body: JSON.stringify({ name: user.name, image: uploadedUrl }),
          });
          user = updated.user;
          setUserDirect(user);
        } catch {
          showToast('Account created! Photo upload can be retried in My Profile.', 'info');
        }
      }
      showToast('Account created successfully!', 'success');
      router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedPreview = previewUrl || image;

  return (
    <section className="relative py-6 sm:py-12 lg:py-16 bg-[radial-gradient(ellipse_at_top,_#F3EDE2_0%,_#FBF8F3_68%)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-[#FFFFFF] border border-[#E5DDD0] rounded-2xl overflow-hidden shadow-[0_24px_60px_-28px_rgba(35,26,22,0.18)] lg:min-h-[680px]">
          <div className="hidden lg:flex lg:col-span-6 relative bg-[#231A16] overflow-hidden">
            <SalonImage
              src="/images/service_hair_treatment_ritual_1795011102653.jpg"
              alt="Botanical salon elixir and linen towels"
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
                  Guest Membership · SalonBook
                </span>
              </div>

              <div className="max-w-md">
                <div className="w-10 h-px bg-[#D4AF6A]/80 mb-4" />
                <blockquote className="font-display text-[1.75rem] font-medium leading-[1.32] italic text-[#FBF8F3]">
                  “Reserve your preferred stylist, save skin notes, and track every visit in one place.”
                </blockquote>
                <div className="mt-4 flex items-center justify-between gap-4 text-xs text-[#E5DDD0]/85 border-t border-[#FBF8F3]/15 pt-4">
                  <span>418 Sutter Street · San Francisco</span>
                  <span className="text-[#D4AF6A]">Verified Online Booking</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center p-5 sm:p-10 lg:p-14 bg-[#FFFFFF]">
            <div className="w-full max-w-md mx-auto">
              <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A7028]">
                <span className="w-6 h-px bg-[#B5893A]/75" aria-hidden="true" />
                <span>Complimentary Guest Profile</span>
              </div>

              <h1 className="mt-3 font-display text-4xl sm:text-[2.65rem] font-semibold tracking-[-0.015em] text-[#231A16] leading-tight">
                Create Account
              </h1>
              <p className="mt-2.5 text-sm text-[#6E6259] leading-relaxed">
                Join SalonBook as a customer to request appointments and manage your studio visits.
              </p>

              {errorMsg && (
                <div
                  role="alert"
                  className="mt-5 p-3.5 rounded-xl bg-[#FFF1F2] border border-[#9F1239]/25 text-sm text-[#9F1239]"
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-xs font-semibold tracking-[0.02em] text-[#231A16] mb-1.5"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="w-4 h-4 text-[#9A7028] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="signup-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sophia Bennett"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-2 focus:ring-[#B5893A]/15"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-semibold tracking-[0.02em] text-[#231A16] mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 text-[#9A7028] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="signup-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sophia@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-2 focus:ring-[#B5893A]/15"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-semibold tracking-[0.02em] text-[#231A16] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 text-[#9A7028] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="w-full pl-10 pr-11 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-2 focus:ring-[#B5893A]/15"
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
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <li className={`flex items-center gap-1.5 ${hasMinLen ? 'text-[#1F6E43]' : 'text-[#6E6259]'}`}>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      6+ characters
                    </li>
                    <li className={`flex items-center gap-1.5 ${hasUpper ? 'text-[#1F6E43]' : 'text-[#6E6259]'}`}>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      Uppercase
                    </li>
                    <li className={`flex items-center gap-1.5 ${hasLower ? 'text-[#1F6E43]' : 'text-[#6E6259]'}`}>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      Lowercase
                    </li>
                  </ul>
                </div>

                <div>
                  <label
                    htmlFor="signup-image-url"
                    className="block text-xs font-semibold tracking-[0.02em] text-[#231A16] mb-1.5"
                  >
                    Profile Image (Optional File or URL)
                  </label>
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {displayedPreview && (
                      <SalonImage
                        src={displayedPreview}
                        alt="Profile preview"
                        className="w-10 h-10 rounded-xl object-cover border border-[#E5DDD0] shrink-0"
                      />
                    )}
                    <input
                      id="signup-image-url"
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://... or choose a file"
                      className="min-w-0 flex-1 px-3.5 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-2 focus:ring-[#B5893A]/15"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] border border-[#E5DDD0] rounded-xl whitespace-nowrap shrink-0 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#9A7028]" aria-hidden="true" />
                      {pendingFile ? 'Change' : 'Choose'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 text-sm font-semibold tracking-[0.02em] text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/50 hover:border-[#D4AF6A] rounded-xl shadow-[0_12px_26px_-12px_rgba(35,26,22,0.5)] transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                >
                  <span>{submitting ? 'Creating Account...' : 'Create Customer Account'}</span>
                  {!submitting && (
                    <ArrowRight
                      className="w-4 h-4 text-[#D4AF6A] transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </form>

              <GoogleSignInButton
                label="signup_with"
                onSuccess={(user) => {
                  showToast(`Signed in with Google as ${user.name}.`, 'success');
                  router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer');
                }}
                onError={(msg) => {
                  setErrorMsg(msg);
                  showToast(msg, 'error');
                }}
              />

              <p className="mt-7 text-center text-sm text-[#6E6259]">
                Already have an account?{' '}
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1 font-semibold text-[#9A7028] hover:text-[#231A16] transition-colors"
                >
                  Sign In
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
