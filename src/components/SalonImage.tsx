'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Scissors } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface SalonImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  sizes?: string;
  priority?: boolean;
}

const OPTIMIZED_HOSTS = ['i.ibb.co', 'lh3.googleusercontent.com'];

function normalizeImageSrc(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('/src/assets/images/')) {
    return raw.replace('/src/assets/images/', '/images/');
  }
  if (raw.startsWith('/uploads/')) {
    const base = getApiBaseUrl();
    return base ? `${base}${raw}` : raw;
  }
  return raw;
}

function canUseNextOptimizer(src: string): boolean {
  if (
    src.startsWith('/images/') ||
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.startsWith('/uploads/')
  ) {
    return false;
  }
  try {
    const parsed = new URL(src);
    return (
      OPTIMIZED_HOSTS.includes(parsed.hostname) ||
      parsed.hostname.endsWith('.ibb.co') ||
      parsed.hostname.endsWith('.googleusercontent.com')
    );
  } catch {
    return false;
  }
}

export function SalonImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
}: SalonImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = normalizeImageSrc(src);

  if (!resolvedSrc || failedSrc === resolvedSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#F3EDE2] text-[#6E6259] border border-[#E5DDD0] p-4 text-center ${className}`}
      >
        <Scissors className="w-6 h-6 mb-2 text-[#9A7028]/70" aria-hidden="true" />
        <span className="text-xs font-medium text-[#6E6259] line-clamp-2">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  const optimize = canUseNextOptimizer(resolvedSrc);

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={800}
      height={600}
      sizes={sizes}
      priority={priority}
      unoptimized={!optimize}
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(resolvedSrc)}
      className={className}
    />
  );
}
