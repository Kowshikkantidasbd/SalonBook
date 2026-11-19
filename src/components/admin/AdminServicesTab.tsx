'use client';

import Link from 'next/link';
import { Edit3, PlusCircle, Trash2 } from 'lucide-react';
import { SalonImage } from '@/components/SalonImage';
import { SalonLoader } from '@/components/SalonLoader';
import { ServiceStatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDuration, type ServiceRecord } from '@/lib/salonRules';

export function AdminServicesTab({
  loading,
  services,
  onToggleStatus,
  onDelete,
}: {
  loading: boolean;
  services: ServiceRecord[];
  onToggleStatus: (svc: ServiceRecord) => void;
  onDelete: (svc: ServiceRecord) => void;
}) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
      <div className="px-4 sm:px-6 py-5 border-b border-[#E5DDD0]/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#231A16]">
            Manage Salon Services
          </h2>
          <p className="text-xs text-[#6E6259] mt-0.5">
            Only active services appear on the public catalog and booking pages.
          </p>
        </div>
        <Link
          href="/dashboard/admin/services/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg transition-colors whitespace-nowrap"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#B5893A]" aria-hidden="true" />
          Add New Service
        </Link>
      </div>

      {loading ? (
        <SalonLoader size="sm" label="Loading services..." className="py-12" />
      ) : services.length === 0 ? (
        <div className="p-10 text-center text-sm text-[#6E6259]">No services added yet.</div>
      ) : (
        <>
          <div className="lg:hidden divide-y divide-[#E5DDD0]/70">
            {services.map((svc) => (
              <div key={svc.id} className="p-4 sm:px-6 sm:py-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <SalonImage
                      src={svc.image}
                      alt={svc.serviceName}
                      sizes="48px"
                      className="w-11 h-11 rounded-lg object-cover border border-[#E5DDD0] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#231A16] truncate">
                        {svc.serviceName}
                      </p>
                      <p className="text-xs text-[#6E6259] tabular-nums mt-0.5">
                        {svc.category} · {formatDuration(svc.duration)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#231A16] tabular-nums shrink-0">
                    {formatCurrency(svc.price)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <ServiceStatusBadge status={svc.status} />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(svc)}
                      className="px-2.5 py-1.5 text-xs font-medium text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg whitespace-nowrap transition-colors"
                    >
                      {svc.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <Link
                      href={`/dashboard/admin/services/edit/${svc.id}`}
                      aria-label={`Edit ${svc.serviceName}`}
                      className="p-2 text-[#6E6259] hover:text-[#9A7028] hover:bg-[#F3EDE2] rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(svc)}
                      aria-label={`Delete ${svc.serviceName}`}
                      className="p-2 text-[#6E6259] hover:text-[#9F1239] hover:bg-[#FFF1F2] rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DDD0] bg-[#F3EDE2]/70 text-xs font-semibold text-[#6E6259]">
                  <th className="py-3 pl-5 pr-3">Service</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD0]/70 text-sm">
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-[#F3EDE2]/35 transition-colors">
                    <td className="py-3.5 pl-5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <SalonImage
                          src={svc.image}
                          alt={svc.serviceName}
                          sizes="48px"
                          className="w-10 h-10 rounded-lg object-cover border border-[#E5DDD0] shrink-0"
                        />
                        <span className="font-semibold text-[#231A16] max-w-[175px] truncate">
                          {svc.serviceName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-[#6E6259] whitespace-nowrap">
                      {svc.category}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#231A16] tabular-nums whitespace-nowrap">
                      {formatCurrency(svc.price)}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-[#6E6259] tabular-nums whitespace-nowrap">
                      {formatDuration(svc.duration)}
                    </td>
                    <td className="py-3.5 px-3">
                      <ServiceStatusBadge status={svc.status} />
                    </td>
                    <td className="py-3.5 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(svc)}
                          className="px-2.5 py-1.5 text-xs font-medium text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg whitespace-nowrap transition-colors"
                        >
                          {svc.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <Link
                          href={`/dashboard/admin/services/edit/${svc.id}`}
                          aria-label={`Edit ${svc.serviceName}`}
                          className="p-2 text-[#6E6259] hover:text-[#9A7028] hover:bg-[#F3EDE2] rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(svc)}
                          aria-label={`Delete ${svc.serviceName}`}
                          className="p-2 text-[#6E6259] hover:text-[#9F1239] hover:bg-[#FFF1F2] rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
