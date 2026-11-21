import Link from 'next/link';
import { Clock, Globe, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#231A16] text-[#F3EDE2] border-t border-[#B5893A]/25 mt-14 sm:mt-20 lg:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10">
          {/* Logo, Short Description & Social Media Links */}
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 font-display text-3xl font-semibold text-[#FBF8F3] hover:text-[#D4AF6A] transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5 text-[#D4AF6A] shrink-0"
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
                Salon<span className="italic font-medium text-[#D4AF6A]">Book</span>
              </span>
            </Link>
            <div className="mt-3.5 w-10 h-px bg-[#B5893A]/60" />
            <p className="mt-4 text-sm text-[#C7BBAE] leading-relaxed max-w-sm">
              An editorial beauty and wellness atelier connecting guests with master stylists, botanical skincare, and effortless studio scheduling.
            </p>

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D4AF6A]">
                Social Media
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-medium text-[#E5DDD0]">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3B2E28] bg-[#2C211C] hover:border-[#B5893A]/70 hover:text-[#D4AF6A] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#D4AF6A]" aria-hidden="true" />
                  Instagram
                </a>
                <a
                  href="https://pinterest.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3B2E28] bg-[#2C211C] hover:border-[#B5893A]/70 hover:text-[#D4AF6A] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#D4AF6A]" aria-hidden="true" />
                  Pinterest
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3B2E28] bg-[#2C211C] hover:border-[#B5893A]/70 hover:text-[#D4AF6A] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#D4AF6A]" aria-hidden="true" />
                  Facebook
                </a>
              </div>
            </div>
          </div>

          {/* Important Navigation Links */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF6A]">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#C7BBAE]">
              <li>
                <Link href="/" className="hover:text-[#FBF8F3] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-[#FBF8F3] transition-colors">
                  Browse Services
                </Link>
              </li>
              <li>
                <Link href="/#specialists" className="hover:text-[#FBF8F3] transition-colors">
                  Our Specialists
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-[#FBF8F3] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-[#FBF8F3] transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Salon Contact Information */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF6A]">
              Contact Information
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[#C7BBAE]">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#D4AF6A] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#9C8E80]">Studio Desk</p>
                  <a href="tel:+14155550192" className="hover:text-[#FBF8F3] transition-colors">
                    +1 (415) 555-0192
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#D4AF6A] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#9C8E80]">Concierge Email</p>
                  <a
                    href="mailto:concierge@salonbook.studio"
                    className="hover:text-[#FBF8F3] transition-colors break-all"
                  >
                    concierge@salonbook.studio
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Salon Address & Opening Hours */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF6A]">
              Address & Opening Hours
            </h3>
            <div className="mt-4 space-y-3.5 text-sm text-[#C7BBAE] leading-relaxed">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D4AF6A] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p>418 Sutter Street, Suite 300</p>
                  <p>San Francisco, CA 94108</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#D4AF6A] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <p>Tue – Fri: 9:00 AM – 7:00 PM</p>
                  <p>Saturday: 9:00 AM – 6:00 PM</p>
                  <p>Sun – Mon: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Information */}
        <div className="mt-10 sm:mt-14 pt-6 border-t border-[#3B2E28] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-[#9C8E80] text-center sm:text-left">
          <p>© {new Date().getFullYear()} SalonBook Studio. All rights reserved.</p>
          <p>Online Appointment Scheduling & Verified Stripe Payments</p>
        </div>
      </div>
    </footer>
  );
}
