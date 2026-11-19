'use client';

import React from 'react';
import { SalonImage } from '@/components/SalonImage';

interface AuthShellProps {
  heroImage: string;
  heroAlt: string;
  insetImage: string;
  insetAlt: string;
  insetCaption: string;
  eyebrow: string;
  quote: string;
  attribution: string;
  studioNote: string;
  formEyebrow: string;
  formTitle: string;
  formSubtitle: string;
  children: React.ReactNode;
}

export function AuthShell({
  heroImage,
  heroAlt,
  insetImage,
  insetAlt,
  insetCaption,
  eyebrow,
  quote,
  attribution,
  studioNote,
  formEyebrow,
  formTitle,
  formSubtitle,
  children,
}: AuthShellProps) {
  return (
    <section className="relative min-h-[calc(100vh-4.5rem)] bg-[#FBF8F3] py-4 sm:py-6 lg:py-8 flex items-center">
      {/* Subtle architectural warmth backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(212,175,106,0.14),transparent_42%),radial-gradient(circle_at_85%_85%,rgba(181,137,58,0.1),transparent_45%)]"
      />

      <div className="relative w-full max-w-[1260px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-[#FFFFFF] border border-[#E5DDD0] rounded-2xl overflow-hidden shadow-[0_32px_80px_-34px_rgba(35,26,22,0.22)] lg:min-h-[650px]">
          {/* Mobile Editorial Banner */}
          <div className="relative h-44 sm:h-52 lg:hidden bg-[#1D1512] overflow-hidden">
            <SalonImage
              src={heroImage}
              alt={heroAlt}
              priority
              sizes="100vw"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-85"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#160F0C]/95 via-[#160F0C]/60 to-[#160F0C]/40"
            />
            <div
              aria-hidden="true"
              className="absolute inset-3 border border-[#FBF8F3]/18 rounded-xl pointer-events-none"
            />
            <div className="relative z-10 h-full flex flex-col justify-between p-6 text-[#FBF8F3]">
              <div className="flex items-center gap-2 text-xs text-[#EED9B3]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-3.5 h-3.5 text-[#D4AF6A] shrink-0"
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
                <span className="tracking-[0.04em] font-medium">{eyebrow}</span>
              </div>
              <p className="font-display text-xl italic leading-snug text-[#FBF8F3] max-w-sm drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]">
                “{quote}”
              </p>
            </div>
          </div>

          {/* Desktop Full-Height Editorial Showcase */}
          <div className="hidden lg:block lg:col-span-6 xl:col-span-7 relative bg-[#1D1512] overflow-hidden">
            <SalonImage
              src={heroImage}
              alt={heroAlt}
              priority
              sizes="(max-width: 1280px) 50vw, 58vw"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-85 scale-[1.01]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#140E0B]/95 via-[#1C1411]/45 to-[#1C1411]/45"
            />
            {/* Bespoke Lookbook Inset Frame */}
            <div
              aria-hidden="true"
              className="absolute inset-6 border border-[#FBF8F3]/18 rounded-xl pointer-events-none z-10"
            />

            <div className="relative z-20 flex flex-col justify-between w-full h-full p-11 xl:p-12 text-[#FBF8F3]">
              {/* Top Editorial Header */}
              <div className="flex items-center justify-between gap-4 border-b border-[#FBF8F3]/18 pb-5">
                <div className="flex items-center gap-2.5 text-xs tracking-[0.04em] text-[#FBF8F3] font-medium">
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
                  <span>{eyebrow}</span>
                </div>
                <span className="text-xs text-[#E5DDD0]/90 whitespace-nowrap">
                  418 Sutter St · San Francisco
                </span>
              </div>

              {/* Bottom Editorial Composition */}
              <div className="space-y-6">
                {/* Secondary Curated Inset Lookbook Frame */}
                <div className="flex items-end gap-5">
                  <div className="w-24 h-28 rounded-lg overflow-hidden border border-[#FBF8F3]/30 bg-[#231A16] shrink-0 shadow-[0_18px_36px_-12px_rgba(0,0,0,0.75)]">
                    <SalonImage
                      src={insetImage}
                      alt={insetAlt}
                      sizes="96px"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0 pb-0.5">
                    <p className="text-xs text-[#E2C282] font-medium tracking-[0.03em]">
                      {insetCaption}
                    </p>
                    <blockquote
                      className="mt-2 font-display text-[1.65rem] xl:text-[1.9rem] font-medium leading-[1.22] italic text-[#FBF8F3] drop-shadow-[0_1px_12px_rgba(0,0,0,0.4)]"
                      style={{ textWrap: 'balance' }}
                    >
                      “{quote}”
                    </blockquote>
                  </div>
                </div>

                {/* Unboxed Editorial Studio Strip */}
                <div className="grid grid-cols-3 gap-4 border-t border-[#FBF8F3]/18 pt-5 text-xs">
                  <div>
                    <p className="text-[#E5DDD0]/70">Atelier Lead</p>
                    <p className="mt-1 font-medium text-[#FBF8F3]">{attribution}</p>
                  </div>
                  <div>
                    <p className="text-[#E5DDD0]/70">Studio Hours</p>
                    <p className="mt-1 font-medium text-[#FBF8F3] tabular-nums">
                      Tue – Sat · 9 – 7
                    </p>
                  </div>
                  <div>
                    <p className="text-[#E5DDD0]/70">Guest Standard</p>
                    <p className="mt-1 font-medium text-[#E2C282]">{studioNote}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Vessel */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center px-5 py-6 sm:px-10 sm:py-8 lg:px-11 xl:px-12 bg-[#FFFFFF]">
            <div className="w-full max-w-[420px] mx-auto">
              {/* Editorial Heading Block */}
              <div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-[#9A7028]">
                  <span className="w-6 h-px bg-[#B5893A]" aria-hidden="true" />
                  <span>{formEyebrow}</span>
                </div>
                <h1
                  className="mt-2 font-display text-[2.2rem] sm:text-[2.5rem] font-semibold tracking-[-0.015em] text-[#231A16] leading-[1.08]"
                  style={{ textWrap: 'balance' }}
                >
                  {formTitle}
                </h1>
                <p className="mt-1.5 text-sm text-[#6E6259] leading-relaxed">{formSubtitle}</p>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
