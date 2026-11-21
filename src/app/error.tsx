'use client';

import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-2xl p-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9F1239]">
          Studio Notice
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#231A16]">
          Something Went Wrong
        </h1>
        <p className="mt-2 text-sm text-[#6E6259]">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#3A2C25] border border-[#B5893A]/40 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 text-sm font-medium text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
