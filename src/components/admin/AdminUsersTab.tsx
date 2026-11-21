'use client';

import { Eye } from 'lucide-react';
import { SalonImage } from '@/components/SalonImage';
import { SalonLoader } from '@/components/SalonLoader';
import { UserBlockBadge } from '@/components/StatusBadge';
import type { AdminCustomer } from './types';

export function AdminUsersTab({
  loading,
  users,
  onInspect,
  onToggleBlock,
}: {
  loading: boolean;
  users: AdminCustomer[];
  onInspect: (cust: AdminCustomer) => void;
  onToggleBlock: (cust: AdminCustomer) => void;
}) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
      <div className="px-4 sm:px-6 py-5 border-b border-[#E5DDD0]/80">
        <h2 className="font-display text-2xl font-semibold text-[#231A16]">
          Manage Registered Customers
        </h2>
        <p className="text-xs text-[#6E6259] mt-0.5">
          View customer accounts and block or unblock access to protected booking features.
        </p>
      </div>

      {loading ? (
        <SalonLoader size="sm" label="Loading customers..." className="py-12" />
      ) : users.length === 0 ? (
        <div className="p-10 text-center text-sm text-[#6E6259]">
          No registered customers found.
        </div>
      ) : (
        <>
          <div className="xl:hidden divide-y divide-[#E5DDD0]/70 md:divide-y-0 md:grid md:grid-cols-2 md:gap-4 md:p-5">
            {users.map((cust) => (
              <div
                key={cust.id}
                className="p-4 sm:p-5 space-y-3 md:rounded-xl md:border md:border-[#E5DDD0] md:bg-[#FBF8F3]/45 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <SalonImage
                        src={cust.image}
                        alt={cust.name}
                        sizes="48px"
                        className="w-10 h-10 rounded-lg object-cover border border-[#E5DDD0] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#231A16] truncate">{cust.name}</p>
                        <p className="text-xs text-[#6E6259] truncate">{cust.email}</p>
                      </div>
                    </div>
                    <UserBlockBadge isBlocked={cust.isBlocked} />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6259] tabular-nums">
                    <span>{cust.phone || 'Phone not provided'}</span>
                    <span>
                      {cust.appointmentCount} bookings · Joined{' '}
                      {new Date(cust.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#E5DDD0]/60">
                  <button
                    type="button"
                    onClick={() => onInspect(cust)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg whitespace-nowrap transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleBlock(cust)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                      cust.isBlocked
                        ? 'text-[#1F6E43] bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#1F6E43]/20'
                        : 'text-[#9F1239] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#9F1239]/20'
                    }`}
                  >
                    {cust.isBlocked ? 'Unblock User' : 'Block User'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden xl:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DDD0] bg-[#F3EDE2]/70 text-xs font-semibold text-[#6E6259]">
                  <th className="py-3 pl-4 pr-3">Customer</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Bookings</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Joined</th>
                  <th className="py-3 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD0]/70 text-sm">
                {users.map((cust) => (
                  <tr key={cust.id} className="hover:bg-[#F3EDE2]/35 transition-colors">
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SalonImage
                          src={cust.image}
                          alt={cust.name}
                          sizes="40px"
                          className="w-9 h-9 rounded-lg object-cover border border-[#E5DDD0] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#231A16] max-w-[175px] truncate">
                            {cust.name}
                          </p>
                          <p className="text-xs text-[#6E6259] max-w-[175px] truncate">
                            {cust.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-[#6E6259] tabular-nums whitespace-nowrap">
                      {cust.phone || 'Not provided'}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#231A16] tabular-nums">
                      {cust.appointmentCount}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <UserBlockBadge isBlocked={cust.isBlocked} />
                    </td>
                    <td className="py-3.5 px-3 text-xs text-[#6E6259] tabular-nums whitespace-nowrap">
                      {new Date(cust.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onInspect(cust)}
                          aria-label={`View profile for ${cust.name}`}
                          className="p-1.5 text-[#6E6259] hover:text-[#231A16] hover:bg-[#F3EDE2] rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleBlock(cust)}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                            cust.isBlocked
                              ? 'text-[#1F6E43] bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#1F6E43]/20'
                              : 'text-[#9F1239] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#9F1239]/20'
                          }`}
                        >
                          {cust.isBlocked ? 'Unblock User' : 'Block User'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
