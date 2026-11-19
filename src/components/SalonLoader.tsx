'use client';

interface SalonLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  fullScreen?: boolean;
  inline?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-5 h-5 border-2',
  sm: 'w-8 h-8 border-[2.5px]',
  md: 'w-10 h-10 border-[3px]',
  lg: 'w-12 h-12 border-[3px]',
} as const;

export function SalonLoader({
  size = 'md',
  label,
  fullScreen = false,
  inline = false,
  className = '',
}: SalonLoaderProps) {
  const circle = (
    <span
      aria-hidden="true"
      className={`inline-block rounded-full ${SIZE_MAP[size]} border-[#E5DDD0] border-t-[#B5893A] animate-spin shrink-0`}
    />
  );

  if (inline) {
    return (
      <span
        role="status"
        aria-live="polite"
        className={`inline-flex items-center justify-center ${className}`}
      >
        {circle}
        <span className="sr-only">{label || 'Loading'}</span>
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center ${
        fullScreen ? 'min-h-[60vh] w-full px-4' : 'py-10 px-4'
      } ${className}`}
    >
      {circle}
      <span className="sr-only">{label || 'Loading'}</span>
    </div>
  );
}
