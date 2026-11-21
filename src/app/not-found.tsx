import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-2xl p-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7028]">
          404 · Page Not Found
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-[#231A16]">
          Lost Your Way?
        </h1>
        <p className="mt-2 text-sm text-[#6E6259]">
          The SalonBook page you requested could not be found. Return to the main studio directory to explore treatments.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#3A2C25] border border-[#B5893A]/40 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4AF6A]" aria-hidden="true" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
