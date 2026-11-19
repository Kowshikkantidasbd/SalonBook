'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, ChevronDown, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { prefetchApiData } from '@/lib/api';
import { SalonImage } from './SalonImage';

export function Navbar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname() || '/';
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dashboardPath =
    user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer';

  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    showToast('Signed out successfully.', 'success');
    router.push('/');
  };

  const navLinkClass = (path: string) => {
    const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
    return `group relative py-1 text-[13.5px] font-medium tracking-[0.02em] transition-colors whitespace-nowrap shrink-0 ${
      active ? 'text-[#231A16]' : 'text-[#6E6259] hover:text-[#231A16]'
    }`;
  };

  const navUnderline = (path: string) => {
    const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
    return (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#B5893A] origin-left transition-transform duration-200 ease-out ${
          active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}
      />
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF8F3]/95 backdrop-blur-md border-b border-[#E5DDD0] shadow-[0_6px_24px_-16px_rgba(35,26,22,0.14)]">
      <div
        aria-hidden="true"
        className="h-[2px] w-full bg-gradient-to-r from-[#E5DDD0]/30 via-[#B5893A]/75 to-[#E5DDD0]/30"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4 md:gap-6 lg:gap-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 font-display text-[1.75rem] leading-none font-semibold tracking-[-0.015em] text-[#231A16] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5893A]/60 rounded-sm"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5 text-[#B5893A] transition-transform duration-200 group-hover:scale-105 shrink-0"
            aria-hidden="true"
          >
            <path
              d="M12 2.5L14.8 9.2L21.5 12L14.8 14.8L12 21.5L9.2 14.8L2.5 12L9.2 9.2L12 2.5Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
          <span>
            Salon
            <span className="italic font-medium text-[#9A7028] transition-colors group-hover:text-[#B5893A]">
              Book
            </span>
          </span>
        </Link>

        <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-8">
          <Link href="/" className={navLinkClass('/')}>
            Home
            {navUnderline('/')}
          </Link>
          <Link
            href="/services"
            onMouseEnter={() => prefetchApiData('/api/services')}
            onFocus={() => prefetchApiData('/api/services')}
            className={navLinkClass('/services')}
          >
            Browse Services
            {navUnderline('/services')}
          </Link>
          {user && (
            <Link
              href={dashboardPath}
              onMouseEnter={() =>
                prefetchApiData(
                  user.role === 'admin' ? '/api/admin/overview' : '/api/appointments/my',
                  15000
                )
              }
              onFocus={() =>
                prefetchApiData(
                  user.role === 'admin' ? '/api/admin/overview' : '/api/appointments/my',
                  15000
                )
              }
              className={navLinkClass('/dashboard')}
            >
              Dashboard
              {navUnderline('/dashboard')}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                aria-label={`Account menu for ${user.name}`}
                className="flex items-center gap-2.5 py-1.5 pl-1.5 pr-3.5 rounded-lg border border-[#E5DDD0] bg-[#FFFFFF] hover:border-[#B5893A]/70 shadow-[0_1px_6px_-2px_rgba(35,26,22,0.08)] transition-all duration-200 whitespace-nowrap shrink-0"
              >
                <SalonImage
                  src={user.image}
                  alt={user.name}
                  sizes="32px"
                  className="w-7 h-7 rounded-md object-cover ring-1 ring-[#B5893A]/45"
                />
                <span className="text-[13.5px] font-medium text-[#231A16] max-w-[130px] truncate hidden sm:inline">
                  {user.name}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#9A7028] transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {dropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-[#FFFFFF] border border-[#E5DDD0] shadow-xl py-1.5 z-50"
                >
                  <div className="px-4 py-3 border-b border-[#F3EDE2]">
                    <p className="text-sm font-semibold text-[#231A16] truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-[#9A7028] font-medium capitalize mt-0.5">
                      {user.role} Account
                    </p>
                  </div>
                  <Link
                    role="menuitem"
                    href={dashboardPath}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#231A16] hover:bg-[#FBF8F3] transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#9A7028]" aria-hidden="true" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#9F1239] hover:bg-[#FFF1F2] transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2.5 shrink-0">
              <Link
                href="/sign-in"
                className={`inline-flex items-center px-4 py-2.5 text-[13px] font-semibold tracking-[0.02em] rounded-lg border transition-all duration-200 whitespace-nowrap shrink-0 ${
                  pathname.startsWith('/sign-in')
                    ? 'text-[#231A16] bg-[#F3EDE2] border-[#B5893A]'
                    : 'text-[#231A16] bg-[#FFFFFF] border-[#E5DDD0] hover:border-[#B5893A] hover:bg-[#F3EDE2]/60'
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold tracking-[0.025em] text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/50 hover:border-[#D4AF6A] rounded-lg shadow-[0_3px_12px_-4px_rgba(35,26,22,0.35)] transition-all duration-200 hover:-translate-y-[1px] whitespace-nowrap shrink-0"
              >
                Sign Up
                <ArrowUpRight
                  className="w-3.5 h-3.5 text-[#D4AF6A] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-lg text-[#231A16] hover:bg-[#F3EDE2] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5DDD0] bg-[#FFFFFF] px-4 py-4 space-y-2">
          <Link
            href="/"
            className="block py-2 text-sm font-medium text-[#231A16] hover:text-[#9A7028]"
          >
            Home
          </Link>
          <Link
            href="/services"
            className="block py-2 text-sm font-medium text-[#231A16] hover:text-[#9A7028]"
          >
            Browse Services
          </Link>
          {user ? (
            <>
              <Link
                href={dashboardPath}
                className="block py-2 text-sm font-medium text-[#9A7028]"
              >
                Dashboard ({user.role})
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full text-left py-2 text-sm font-medium text-[#9F1239]"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/sign-in"
                className="flex-1 text-center py-2.5 text-sm font-medium text-[#231A16] bg-[#F3EDE2] rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="flex-1 text-center py-2.5 text-sm font-medium text-[#FBF8F3] bg-[#231A16] rounded-lg"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
