'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { primeApiCache } from '@/lib/api';
import { formatCurrency, formatDuration, type ServiceRecord } from '@/lib/salonRules';
import { SalonImage } from './SalonImage';

export function ServiceCard({
  service,
  priority = false,
}: {
  service: ServiceRecord;
  priority?: boolean;
}) {
  const handleWarmDetail = () => {
    primeApiCache(`/api/services/${encodeURIComponent(service.id)}`, { service });
  };

  return (
    <article className="group flex flex-col bg-[#FFFFFF] border border-[#E5DDD0] hover:border-[#B5893A]/60 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#231A16]/[0.05]">
      <Link
        href={`/services/${service.id}`}
        onMouseEnter={handleWarmDetail}
        onFocus={handleWarmDetail}
        aria-label={`View details for ${service.serviceName}`}
        className="flex flex-col flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B5893A]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3EDE2]">
          <SalonImage
            src={service.image}
            alt={service.serviceName}
            fallbackTitle={service.serviceName}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#231A16]/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>

        <div className="flex flex-col flex-1 p-6">
          <div className="flex items-center gap-2 text-xs text-[#6E6259]">
            <span className="font-medium text-[#9A7028]">{service.category}</span>
            <span aria-hidden="true" className="text-[#B5893A]">
              ·
            </span>
            <span className="tabular-nums">{formatDuration(service.duration)}</span>
          </div>

          <h3 className="mt-2 font-display text-[1.375rem] font-semibold text-[#231A16] leading-snug line-clamp-1 group-hover:text-[#9A7028] transition-colors">
            {service.serviceName}
          </h3>

          <p className="mt-2 text-sm text-[#6E6259] leading-relaxed line-clamp-2 flex-1">
            {service.description}
          </p>

          <div className="mt-5 pt-4 border-t border-[#F3EDE2] flex items-center justify-between gap-3">
            <span className="text-base font-semibold text-[#231A16] tabular-nums">
              {formatCurrency(service.price)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#231A16] bg-[#F3EDE2] group-hover:bg-[#231A16] group-hover:text-[#FBF8F3] rounded-lg transition-colors whitespace-nowrap shrink-0">
              View Details
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
