'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import {
  apiFetchCached,
  getCachedApiData,
  prefetchApiData,
  primeApiCache,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { SALON_CATEGORIES, type ServiceRecord } from '@/lib/salonRules';
import { ServiceCard } from '@/components/ServiceCard';
import { SalonImage } from '@/components/SalonImage';
import { SalonLoader } from '@/components/SalonLoader';

const HERO_IMAGE = '/images/hero_salon_interior_1795006413558.jpg';

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Haircut & Styling': 'Architectural cuts, precision trims, and luminous blowouts.',
  'Hair Coloring': 'Custom dimensional balayage, glossing, and tonal color.',
  'Hair Treatment': 'Botanical keratin smoothing and restorative scalp rituals.',
  'Facial & Skincare': 'Enzymatic cellular facials and lymphatic sculpting care.',
  Makeup: 'Skin-first bridal, gala, and editorial studio artistry.',
  'Manicure & Pedicure': 'Japanese builder gel care and mineral spa pedicures.',
  'Spa & Massage': 'Warm basalt stone therapy and aromatherapy bodywork.',
};

const MASTER_STYLISTS = [
  {
    name: 'Camille Laurent',
    role: 'Creative Director · Precision Cutting',
    experience: '14 Years · Paris & San Francisco',
    category: 'Haircut & Styling',
    bio: 'Specializes in effortless architectural silhouettes tailored to natural movement and bone structure.',
    image: '/images/stylist_camille_director_1795011102351.jpg',
  },
  {
    name: 'Julian Mercer',
    role: 'Master Colorist · Dimensional Balayage',
    experience: '11 Years · London & New York',
    category: 'Hair Coloring',
    bio: 'Crafts luminous, low-maintenance lived-in color and restorative botanical gloss formulations.',
    image: '/images/stylist_julian_colorist_1795011100902.jpg',
  },
  {
    name: 'Sora Takahashi',
    role: 'Lead Esthetician · Holistic Skincare',
    experience: '9 Years · Kyoto & San Francisco',
    category: 'Facial & Skincare',
    bio: 'Blends lymphatic facial sculpting with cold-pressed botanical actives for calm, radiant skin.',
    image: '/images/stylist_sora_esthetician_1795011103240.jpg',
  },
];

const GUEST_REVIEWS = [
  {
    quote:
      'I requested a Saturday balayage slot in thirty seconds, received studio confirmation that afternoon, and settled payment cleanly online before arriving.',
    author: 'Hannah Sato',
    service: 'Lived-In Dimensional Balayage',
    location: 'Pacific Heights, San Francisco',
  },
  {
    quote:
      'The studio feels like stepping into an architectural gallery—calm light, botanical scents, and Camille gave me the best precision bob I have ever worn.',
    author: 'Claire Moreau',
    service: 'Architectural Precision Haircut',
    location: 'Marin County',
  },
  {
    quote:
      'No waiting room clutter or surprise fees. Sora tailored my cellular facial around sensitive skin notes I added right inside the booking form.',
    author: 'David Chen',
    service: 'Hydra-Botanical Cellular Facial',
    location: 'Nob Hill, San Francisco',
  },
];

export function HomePageClient({
  initialServices,
}: {
  initialServices: ServiceRecord[] | null;
}) {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceRecord[]>(() => initialServices ?? []);
  const [loading, setLoading] = useState(() => initialServices === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialServices !== null) {
      primeApiCache('/api/services', { services: initialServices });
      return;
    }

    let active = true;
    const cached = getCachedApiData<{ services: ServiceRecord[] }>('/api/services', 300000);
    if (cached) {
      setServices(cached.services);
      setLoading(false);
    }

    apiFetchCached<{ services: ServiceRecord[] }>('/api/services', 30000)
      .then((res) => {
        if (active) {
          setServices(res.services);
          setError(null);
        }
      })
      .catch((err) => {
        if (active && !cached) setError(err.message || 'Unable to load salon services.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialServices]);

  const featuredServices = (() => {
    const picked: ServiceRecord[] = [];
    const seenCategories = new Set<string>();
    for (const svc of services) {
      if (!seenCategories.has(svc.category)) {
        seenCategories.add(svc.category);
        picked.push(svc);
      }
      if (picked.length === 6) break;
    }
    if (picked.length < 6) {
      for (const svc of services) {
        if (!picked.some((p) => p.id === svc.id)) {
          picked.push(svc);
        }
        if (picked.length === 6) break;
      }
    }
    return picked;
  })();

  const categoryCounts = SALON_CATEGORIES.map((cat, idx) => ({
    index: String(idx + 1).padStart(2, '0'),
    name: cat,
    count: services.filter((s) => s.category === cat).length,
    description: CATEGORY_DESCRIPTIONS[cat] || 'Curated salon treatment.',
  }));

  return (
    <div>
      <section className="relative border-b border-[#E5DDD0] bg-[#FBF8F3] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-14 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-[#B5893A]" aria-hidden="true" />
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#9A7028]">
                  San Francisco Atelier · Est. 2021
                </p>
              </div>

              <h1 className="mt-4 sm:mt-5 font-display text-[2.25rem] sm:text-5xl lg:text-[3.75rem] font-semibold text-[#231A16] leading-[1.08] tracking-tight text-balance">
                Thoughtful salon care,{' '}
                <em className="italic font-medium text-[#9A7028]">reserved</em> on your schedule.
              </h1>

              <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#6E6259] leading-relaxed max-w-xl">
                Explore architectural haircuts, dimensional balayage, botanical facials, and restorative spa rituals. Request your time online and settle payment effortlessly once confirmed.
              </p>

              <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href="/services"
                  onMouseEnter={() => prefetchApiData('/api/services')}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#3A2C25] border border-[#B5893A]/40 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  Explore Salon Services
                  <ArrowRight className="w-4 h-4 text-[#D4AF6A]" aria-hidden="true" />
                </Link>
                {user ? (
                  <Link
                    href={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer/appointments'}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#231A16] bg-[#FFFFFF] border border-[#E5DDD0] hover:border-[#B5893A] rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Calendar className="w-4 h-4 text-[#9A7028]" aria-hidden="true" />
                    <span>{user.role === 'admin' ? 'Admin Dashboard' : 'My Appointments'}</span>
                  </Link>
                ) : (
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center px-5 py-3.5 text-sm font-semibold text-[#231A16] bg-[#FFFFFF] border border-[#E5DDD0] hover:border-[#B5893A] rounded-lg transition-colors whitespace-nowrap"
                  >
                    Join SalonBook
                  </Link>
                )}
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div
                aria-hidden="true"
                className="hidden lg:block absolute -inset-3 bg-[#F3EDE2] rounded-2xl border border-[#E5DDD0]/80 -z-10 translate-x-2 translate-y-2"
              />
              <div className="aspect-[16/10] md:aspect-[21/10] lg:aspect-auto lg:h-full lg:min-h-[400px] rounded-xl overflow-hidden border border-[#E5DDD0] bg-[#FFFFFF] shadow-sm">
                <SalonImage
                  src={HERO_IMAGE}
                  alt="Sunlit SalonBook studio interior with warm travertine stations and oak mirrors"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7028]">
              Signature Menu
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#231A16]">
              Featured Salon Services
            </h2>
          </div>
          <Link
            href="/services"
            onMouseEnter={() => prefetchApiData('/api/services')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#231A16] hover:text-[#9A7028] border-b border-[#B5893A]/50 pb-0.5 transition-colors whitespace-nowrap"
          >
            View all active services
            <ArrowRight className="w-4 h-4 text-[#B5893A]" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <SalonLoader size="md" label="Curating signature services..." className="py-20" />
        ) : error ? (
          <div className="p-8 rounded-xl bg-[#FFFFFF] border border-[#E5DDD0] text-center">
            <p className="text-sm text-[#9F1239] font-medium">{error}</p>
          </div>
        ) : featuredServices.length === 0 ? (
          <div className="p-10 rounded-xl bg-[#FFFFFF] border border-[#E5DDD0] text-center">
            <p className="text-sm text-[#6E6259]">No active services are available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
            {featuredServices.map((service, idx) => (
              <ServiceCard key={service.id} service={service} priority={idx < 3} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-[#F3EDE2]/75 border-y border-[#E5DDD0] py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7028]">
                Atelier Disciplines
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#231A16]">
                Explore by Service Category
              </h2>
              <p className="mt-2 text-sm text-[#6E6259]">
                Select a treatment discipline to explore specialist menus, session durations, and transparent studio pricing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryCounts.map((cat) => (
              <Link
                key={cat.name}
                href={`/services?category=${encodeURIComponent(cat.name)}`}
                className="group bg-[#FFFFFF] border border-[#E5DDD0] hover:border-[#B5893A] rounded-xl p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F3EDE2]">
                    <span className="font-mono text-xs text-[#9A7028] font-medium">
                      {cat.index}
                    </span>
                    <span className="text-xs font-medium text-[#6E6259] tabular-nums">
                      {cat.count} {cat.count === 1 ? 'service' : 'services'}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-[#231A16] group-hover:text-[#9A7028] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-xs text-[#6E6259] leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#231A16] group-hover:text-[#9A7028] transition-colors">
                  Browse category
                  <ArrowRight
                    className="w-3.5 h-3.5 text-[#B5893A] transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        id="specialists"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 scroll-mt-20"
      >
        <div className="max-w-2xl mb-8 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7028]">
            The Specialists
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#231A16]">
            Meet Our Master Stylists & Estheticians
          </h2>
          <p className="mt-2 text-sm text-[#6E6259]">
            Every session is led by a senior practitioner dedicated to unhurried craft and personalized consultation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {MASTER_STYLISTS.map((stylist) => (
            <article
              key={stylist.name}
              className="group bg-[#FFFFFF] border border-[#E5DDD0] hover:border-[#B5893A]/60 rounded-xl overflow-hidden flex flex-col transition-all duration-300"
            >
              <div className="aspect-[4/3] lg:aspect-[3/4] overflow-hidden bg-[#F3EDE2]">
                <SalonImage
                  src={stylist.image}
                  alt={`${stylist.name}, ${stylist.role}`}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5 lg:p-6 flex flex-col flex-1">
                <p className="text-xs font-medium text-[#9A7028]">{stylist.experience}</p>
                <h3 className="mt-1.5 font-display text-2xl font-semibold text-[#231A16]">
                  {stylist.name}
                </h3>
                <p className="text-xs font-semibold text-[#6E6259] mt-0.5">{stylist.role}</p>
                <p className="mt-3 text-sm text-[#6E6259] leading-relaxed flex-1">
                  {stylist.bio}
                </p>
                <div className="mt-5 pt-4 border-t border-[#F3EDE2]">
                  <Link
                    href={`/services?category=${encodeURIComponent(stylist.category)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#231A16] hover:text-[#9A7028] transition-colors"
                  >
                    Explore {stylist.category}
                    <ArrowRight className="w-3.5 h-3.5 text-[#B5893A]" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#F3EDE2]/60 border-t border-[#E5DDD0] py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7028]">
                The SalonBook Standard
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#231A16] text-balance">
                Transparent scheduling from request to studio chair.
              </h2>
              <p className="mt-4 text-sm text-[#6E6259] leading-relaxed">
                Every appointment is personally reviewed by our salon concierge before you are asked to pay, guaranteeing dedicated chair time and zero double-bookings.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5 bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5">
                  <Calendar className="w-5 h-5 text-[#9A7028] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#231A16]">01. Request a Slot</h3>
                    <p className="mt-1 text-xs text-[#6E6259] leading-relaxed">
                      Choose your treatment, preferred date, and an open studio time slot with real-time conflict checks.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5 bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5">
                  <Sparkles className="w-5 h-5 text-[#9A7028] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#231A16]">02. Concierge Review</h3>
                    <p className="mt-1 text-xs text-[#6E6259] leading-relaxed">
                      Our salon administrator confirms specialist availability or lets you cancel pending requests freely.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5 bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-5">
                  <ShieldCheck className="w-5 h-5 text-[#9A7028] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#231A16]">03. Verified Payment</h3>
                    <p className="mt-1 text-xs text-[#6E6259] leading-relaxed">
                      Once confirmed, complete checkout securely via Stripe with instant webhook-verified receipt tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7028]">
                Guest Voices
              </p>
              <div className="space-y-4">
                {GUEST_REVIEWS.map((review) => (
                  <blockquote
                    key={review.author}
                    className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-6 sm:p-7"
                  >
                    <p className="font-display text-xl text-[#231A16] leading-relaxed italic">
                      “{review.quote}”
                    </p>
                    <footer className="mt-4 pt-3 border-t border-[#F3EDE2] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6259]">
                      <span>
                        <strong className="font-semibold text-[#231A16]">{review.author}</strong> ·{' '}
                        {review.location}
                      </span>
                      <span className="text-[#9A7028] font-medium">{review.service}</span>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
