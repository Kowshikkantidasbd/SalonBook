'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  Eye,
  EyeOff,
  Link2,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { authApi, uploadApi } from '@/lib/api';
import { validatePassword, type PublicUser } from '@/lib/salonRules';
import { AuthShell } from '@/components/AuthShell';
import { SalonImage } from '@/components/SalonImage';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export default function SignUpPage() {
  const { user, loading, register, setUserDirect } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasMinLen = password.length >= 6;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasLower;
  const showPasswordRules = password.length > 0 && !isPasswordValid;

  useEffect(() => {
    if (!loading && user && !submitting) {
      router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer');
    }
  }, [loading, user, submitting, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
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
      let createdUser = await register({ name, email, password, image });
      if (pendingFile) {
        try {
          const uploadedUrl = await uploadApi.uploadImage(pendingFile);
          const updated = await authApi.updateProfile<PublicUser>({
            name: createdUser.name,
            image: uploadedUrl,
          });
          createdUser = updated.user;
          setUserDirect(createdUser);
        } catch {
          showToast('Account created! Photo upload can be retried in My Profile.', 'info');
        }
      }
      showToast('Account created successfully!', 'success');
      router.replace(createdUser.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedPreview = previewUrl || image;
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  return (
    <AuthShell
      heroImage="/images/service_hair_treatment_ritual_1795011102653.jpg"
      heroAlt="Botanical hair ritual bottles and warm stone towels at SalonBook"
      insetImage="/images/stylist_sora_esthetician_1795011103240.jpg"
      insetAlt="Sora Takahashi, Lead Esthetician at SalonBook"
      insetCaption="Complimentary Guest Membership"
      eyebrow="Guest Membership"
      quote="Reserve your preferred specialist, save care preferences, and track every visit effortlessly."
      attribution="Sora Takahashi"
      studioNote="Verified Booking"
      formEyebrow="New Guest Profile"
      formTitle="Create account"
      formSubtitle="Join SalonBook to request tailored treatments and manage every visit in one place."
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

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="group">
          <label
            htmlFor="signup-name"
            className="block text-xs font-semibold text-[#231A16] mb-1.5"
          >
            Full Name
          </label>
          <div className="relative">
            <User
              className="w-4 h-4 text-[#9C8E80] group-focus-within:text-[#9A7028] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="signup-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sophia Bennett"
              className="w-full pl-10 pr-4 py-3 text-sm bg-[#FAF7F1] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 hover:border-[#D3C6B4] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-3 focus:ring-[#B5893A]/15"
            />
          </div>
        </div>

        <div className="group">
          <label
            htmlFor="signup-email"
            className="block text-xs font-semibold text-[#231A16] mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail
              className="w-4 h-4 text-[#9C8E80] group-focus-within:text-[#9A7028] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
              className="w-full pl-10 pr-4 py-3 text-sm bg-[#FAF7F1] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 hover:border-[#D3C6B4] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-3 focus:ring-[#B5893A]/15"
            />
          </div>
        </div>

        <div className="group">
          <label
            htmlFor="signup-password"
            className="block text-xs font-semibold text-[#231A16] mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock
              className="w-4 h-4 text-[#9C8E80] group-focus-within:text-[#9A7028] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
              className="w-full pl-10 pr-11 py-3 text-sm bg-[#FAF7F1] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 hover:border-[#D3C6B4] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-3 focus:ring-[#B5893A]/15"
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
          {showPasswordRules && (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-live="polite">
              <li
                className={`flex items-center gap-1.5 ${hasMinLen ? 'text-[#1F6E43]' : 'text-[#9F1239]'}`}
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                6+ characters
              </li>
              <li
                className={`flex items-center gap-1.5 ${hasUpper ? 'text-[#1F6E43]' : 'text-[#9F1239]'}`}
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Uppercase
              </li>
              <li
                className={`flex items-center gap-1.5 ${hasLower ? 'text-[#1F6E43]' : 'text-[#9F1239]'}`}
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Lowercase
              </li>
            </ul>
          )}
        </div>

        {/* Sleek Optional Profile Portrait Picker */}
        <div className="pt-1">
          <div className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl bg-[#FAF7F1] border border-[#E8E0D3]">
            <div className="flex items-center gap-3 min-w-0">
              {displayedPreview ? (
                <SalonImage
                  src={displayedPreview}
                  alt="Profile preview"
                  className="w-10 h-10 rounded-full object-cover border border-[#B5893A]/50 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#EFE7DA] border border-[#DDD2C0] flex items-center justify-center text-xs font-semibold text-[#6E6259] shrink-0">
                  {initials || <Camera className="w-4 h-4 text-[#9A7028]" aria-hidden="true" />}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#231A16] truncate">
                  {pendingFile ? pendingFile.name : 'Profile Portrait'}
                </p>
                <p className="text-[11px] text-[#6E6259]">Optional · JPG, PNG or WEBP</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#231A16] bg-[#FFFFFF] hover:bg-[#F3EDE2] border border-[#DDD3C4] rounded-lg whitespace-nowrap transition-colors">
                <span>{pendingFile ? 'Change' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowUrlField((prev) => !prev)}
                aria-expanded={showUrlField}
                aria-label="Use image URL instead"
                title="Use image URL instead"
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showUrlField
                    ? 'bg-[#231A16] text-[#FBF8F3] border-[#231A16]'
                    : 'bg-[#FFFFFF] text-[#6E6259] hover:text-[#231A16] border-[#DDD3C4]'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {showUrlField && (
            <div className="mt-2.5">
              <label htmlFor="signup-image-url" className="sr-only">
                Profile Image URL
              </label>
              <input
                id="signup-image-url"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/your-portrait.jpg"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F1] border border-[#E5DDD0] rounded-xl text-[#231A16] placeholder:text-[#9C8E80] transition-all duration-150 focus:bg-[#FFFFFF] focus:outline-none focus:border-[#B5893A] focus:ring-3 focus:ring-[#B5893A]/15"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="group w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 text-sm font-semibold tracking-[0.015em] text-[#FBF8F3] bg-[#231A16] hover:bg-[#352822] border border-[#B5893A]/55 hover:border-[#D4AF6A] rounded-xl shadow-[0_14px_28px_-14px_rgba(35,26,22,0.55)] transition-all duration-150 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5893A]/50 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
        >
          <span>{submitting ? 'Creating Account...' : 'Create Customer Account'}</span>
          {!submitting && (
            <ArrowRight
              className="w-4 h-4 text-[#D4AF6A] transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          )}
        </button>
      </form>

      <GoogleSignInButton
        label="signup_with"
        callbackURL="/dashboard"
        onSuccess={(user) => {
          showToast(`Welcome to SalonBook, ${user.name}.`, 'success');
          router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer');
        }}
        onError={(msg) => {
          setErrorMsg(msg);
          showToast(msg, 'error');
        }}
      />

      <p className="mt-6 pt-5 border-t border-[#F0E9DC] text-center text-sm text-[#6E6259]">
        Already have an account?{' '}
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1 font-semibold text-[#9A7028] hover:text-[#231A16] transition-colors"
        >
          Sign In
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </p>
    </AuthShell>
  );
}
