'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  Mail,
  Phone,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ProfileSection } from '@/components/ProfileSection';
import { SalonImage } from '@/components/SalonImage';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

function ProfilePageContent() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const dashboardHref = isAdmin ? '/dashboard/admin' : '/dashboard/customer';

  const handleLogout = async () => {
    await logout();
    showToast('Signed out successfully.', 'success');
    router.replace('/');
  };

  return (
    <section className="relative min-h-[calc(100vh-4.5rem)] bg-[#FBF8F3] py-8 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(181,137,58,0.1),transparent_42%),radial-gradient(circle_at_88%_85%,rgba(35,26,22,0.05),transparent_45%)]"
      />

      <div className="relative max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DDD0] pb-6">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-medium text-[#9A7028]">
              <span className="w-6 h-px bg-[#B5893A]" aria-hidden="true" />
              <span>Account Profile</span>
            </div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-[-0.015em] text-[#231A16]">
              My Profile
            </h1>
            <p className="mt-1.5 text-sm text-[#6E6259]">
              Manage your SalonBook identity and contact details.
            </p>
          </div>

          <Link
            href={dashboardHref}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#352822] border border-[#B5893A]/50 rounded-xl transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#D4AF6A]" aria-hidden="true" />
            <span>Open {isAdmin ? 'Admin' : 'Customer'} Dashboard</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Identity Summary Card */}
          <aside className="lg:col-span-4 bg-[#FFFFFF] border border-[#E5DDD0] rounded-2xl overflow-hidden shadow-[0_16px_40px_-20px_rgba(35,26,22,0.18)] transition-all">
            {/* Luxury Atelier Cover Banner (Replaced plain solid color with luxury salon visual) */}
            <div className="relative h-40 sm:h-44 w-full overflow-hidden border-b border-[#B5893A]/30 bg-[#1A1412]">
              <SalonImage
                src="/images/hero_salon_interior_1795006413558.jpg"
                alt="SalonBook Atelier Interior"
                sizes="(max-width: 1024px) 100vw, 380px"
                className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-700 hover:scale-110"
              />
              {/* Rich warm gradient overlay for luxury salon atmosphere */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#1F1714] via-[#1F1714]/40 to-black/25"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(212,175,106,0.35),transparent_60%)]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(135deg,rgba(181,137,58,0.18)_0%,transparent_50%)]"
              />
            </div>

            <div className="relative z-10 px-6 pb-6">
              <div className="-mt-16 sm:-mt-18 flex items-end">
                <div className="relative group">
                  <SalonImage
                    src={user.image}
                    alt={user.name}
                    sizes="120px"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-[#FFFFFF] ring-2 ring-[#B5893A]/70 shadow-2xl bg-[#F3EDE2] transition-transform duration-300 group-hover:scale-105"
                  />
                  <span
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-bold"
                    title="Active Account"
                    aria-label="Active status"
                  >
                    ✓
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <h2 className="font-display text-2xl sm:text-[26px] font-semibold text-[#231A16] leading-tight">
                  {user.name}
                </h2>
                <p className="text-xs font-medium text-[#9A7028] mt-0.5">
                  Exclusive SalonBook Atelier Member
                </p>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F1] border border-[#EAE2D5] text-[#3D332C] transition-colors hover:border-[#D4AF6A]/50">
                    <Mail className="w-4 h-4 text-[#9A7028] shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F1] border border-[#EAE2D5] text-[#3D332C] transition-colors hover:border-[#D4AF6A]/50">
                    <Phone className="w-4 h-4 text-[#9A7028] shrink-0" aria-hidden="true" />
                    <span className="tabular-nums font-medium">
                      {user.phone || 'No phone number added yet'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[#F0E9DC]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#9F1239] bg-[#FFF1F2] hover:bg-[#FFE4E6] active:bg-[#FECDD3] border border-[#9F1239]/20 rounded-xl transition-all duration-150 cursor-pointer shadow-xs hover:-translate-y-[1px]"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Editable Profile Form */}
          <div className="lg:col-span-8">
            <ProfileSection className="w-full max-w-none" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['customer', 'admin']}>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
