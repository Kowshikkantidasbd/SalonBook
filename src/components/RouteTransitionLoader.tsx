'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { SalonLoader } from './SalonLoader';

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCircle, setShowCircle] = useState(false);
  const circleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (circleTimerRef.current) {
      clearTimeout(circleTimerRef.current);
      circleTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  useEffect(() => {
    clearTimers();
    setShowCircle(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const rawHref = anchor.getAttribute('href') || '';
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        return;
      }

      let dest: URL;
      try {
        dest = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (dest.origin !== window.location.origin) return;

      const currentUrl = new URL(window.location.href);
      if (dest.pathname === currentUrl.pathname && dest.search === currentUrl.search) {
        return;
      }

      clearTimers();
      circleTimerRef.current = setTimeout(() => {
        setShowCircle(true);
      }, 160);
      safetyTimerRef.current = setTimeout(() => {
        setShowCircle(false);
      }, 12000);
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      clearTimers();
    };
  }, []);

  if (!showCircle) return null;

  return (
    <div
      aria-live="polite"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#FBF8F3]/45 backdrop-blur-[1px] pointer-events-none"
    >
      <SalonLoader size="md" label="Loading page" className="py-0 px-0" />
    </div>
  );
}
