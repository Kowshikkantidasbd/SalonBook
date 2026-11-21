'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { apiFetchCached, getCachedApiData, primeApiCache } from '@/lib/api';
import {
  filterAndSortServices,
  normalizeServiceSort,
  SALON_CATEGORIES,
  type ServiceRecord,
} from '@/lib/salonRules';
import { ServiceCard } from '@/components/ServiceCard';
import { SalonLoader } from '@/components/SalonLoader';

export function BrowseServicesClient({
  initialServices,
}: {
  initialServices: ServiceRecord[] | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = normalizeServiceSort(searchParams.get('sort'));

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>(initialSort);

  const [allServices, setAllServices] = useState<ServiceRecord[]>(() => initialServices ?? []);
  const [loading, setLoading] = useState(() => initialServices === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paramCat = searchParams.get('category') || 'All';
    const paramSearch = searchParams.get('search') || '';
    const paramSort = normalizeServiceSort(searchParams.get('sort'));
    setCategory(paramCat);
    if (searchParams.has('search')) {
      setSearch(paramSearch);
    }
    if (searchParams.has('sort')) {
      setSort(paramSort);
    }
  }, [searchParams]);

  useEffect(() => {
    if (initialServices !== null) {
      primeApiCache('/api/services', { services: initialServices });
      return;
    }

    let active = true;
    const cached = getCachedApiData<{ services: ServiceRecord[] }>('/api/services', 300000);
    if (cached) {
      setAllServices(cached.services);
      setLoading(false);
    }

    apiFetchCached<{ services: ServiceRecord[] }>('/api/services', 30000)
      .then((res) => {
        if (active) {
          setAllServices(res.services);
          setError(null);
        }
      })
      .catch((err) => {
        if (active && !cached) setError(err.message || 'Failed to fetch services.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialServices]);

  const services = useMemo(
    () => filterAndSortServices(allServices, { search, category, sort }),
    [allServices, search, category, sort]
  );

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory);
    const next = new URLSearchParams(searchParams.toString());
    if (nextCategory === 'All') {
      next.delete('category');
    } else {
      next.set('category', nextCategory);
    }
    const qs = next.toString();
    router.replace(qs ? `/services?${qs}` : '/services');
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setSort('newest');
    router.replace('/services');
  };

  return (
    <div>
      <div className="bg-[#F3EDE2]/65 border-b border-[#E5DDD0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="w-6 h-px bg-[#B5893A]" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7028]">
                Service Menu
              </p>
            </div>
            <h1 className="mt-3 font-display text-3xl sm:text-5xl font-semibold text-[#231A16]">
              Browse Salon Services
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[#6E6259]">
              Filter by discipline, search by treatment name, or sort by investment to reserve your next studio session.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
        <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-4 sm:p-5 space-y-4 shadow-sm shadow-[#231A16]/[0.02]">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-[#9A7028] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="service-search" className="sr-only">
                Search services by name
              </label>
              <input
                id="service-search"
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services by name (e.g. Balayage, Facial, Manicure)..."
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] placeholder:text-[#9C8E80] focus:outline-none focus:border-[#B5893A]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search query"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6259] hover:text-[#231A16]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-[#9A7028] shrink-0" aria-hidden="true" />
              <label htmlFor="service-sort" className="text-xs font-semibold text-[#6E6259] whitespace-nowrap">
                Sort by
              </label>
              <select
                id="service-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as 'newest' | 'price_asc' | 'price_desc')}
                className="flex-1 md:flex-initial py-2.5 pl-3 pr-8 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] focus:outline-none focus:border-[#B5893A]"
              >
                <option value="newest">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Filter services by category"
            className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-3 border-t border-[#F3EDE2]"
          >
            {['All', ...SALON_CATEGORIES].map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#231A16] text-[#FBF8F3] border border-[#B5893A]/40'
                      : 'bg-[#F3EDE2]/70 text-[#6E6259] hover:text-[#231A16] hover:bg-[#E5DDD0]/70 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-[#6E6259]">
          <span className="tabular-nums">
            {!loading &&
              `Showing ${services.length} active ${services.length === 1 ? 'service' : 'services'}`}
          </span>
          {(search || category !== 'All' || sort !== 'newest') && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-[#9A7028] hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>

        <div className="mt-5">
          {loading ? (
            <SalonLoader size="md" label="Loading salon menu..." className="py-20" />
          ) : error ? (
            <div className="p-10 rounded-xl bg-[#FFFFFF] border border-[#E5DDD0] text-center">
              <p className="text-sm font-medium text-[#9F1239]">{error}</p>
            </div>
          ) : services.length === 0 ? (
            <div className="p-12 rounded-xl bg-[#FFFFFF] border border-[#E5DDD0] text-center">
              <h2 className="font-display text-2xl font-semibold text-[#231A16]">
                No matching services found
              </h2>
              <p className="mt-1.5 text-sm text-[#6E6259]">
                Try adjusting your search query or switching to another discipline.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 px-5 py-2.5 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#3A2C25] rounded-lg transition-colors"
              >
                Show All Services
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
              {services.map((svc, idx) => (
                <ServiceCard key={svc.id} service={svc} priority={idx < 6} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
