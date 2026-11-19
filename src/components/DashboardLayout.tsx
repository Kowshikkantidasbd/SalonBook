'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SalonImage } from './SalonImage';

export interface SidebarItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  items: SidebarItem[];
  children: React.ReactNode;
}

export function DashboardLayout({
  title,
  subtitle,
  items,
  children,
}: DashboardLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname() || '/';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (item: SidebarItem) => {
    if (item.exact) return pathname === item.to;
    return pathname.startsWith(item.to);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="lg:hidden flex items-center justify-between gap-4 mb-5 p-4 bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9A7028]">
            {user?.role === 'admin' ? 'Admin Portal' : 'Customer Portal'}
          </p>
          <p className="font-display text-xl font-semibold text-[#231A16] truncate">{title}</p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-expanded={sidebarOpen}
          aria-label="Toggle dashboard navigation"
          className="p-2 rounded-lg border border-[#E5DDD0] bg-[#FBF8F3] text-[#231A16] hover:bg-[#F3EDE2] transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8 items-start">
        <aside
          aria-label="Dashboard Navigation"
          className={`w-full lg:w-64 shrink-0 bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-4 shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)] ${
            sidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {user && (
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E5DDD0]/80">
              <SalonImage
                src={user.image}
                alt={user.name}
                sizes="48px"
                className="w-10 h-10 rounded-lg object-cover border border-[#B5893A]/40 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#231A16] truncate">{user.name}</p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#9A7028]">
                  {user.role} Account
                </p>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-[#231A16] text-[#FBF8F3] border border-[#B5893A]/40'
                      : 'text-[#6E6259] hover:text-[#231A16] hover:bg-[#F3EDE2]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${active ? 'text-[#B5893A]' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 w-full">
          <div className="mb-7 hidden lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9A7028] mb-1">
              {user?.role === 'admin' ? 'Atelier Management' : 'Personal Concierge'}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#231A16] tracking-tight">
              {title}
            </h1>
            <p className="mt-1 text-sm text-[#6E6259]">{subtitle}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
