import type { ServiceRecord } from './salonRules';

export function normalizeBackendOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '').replace(/\/api$/i, '');
  if (!trimmed) return 'http://127.0.0.1:5000';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const isLocal = trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1');
  return `${isLocal ? 'http' : 'https'}://${trimmed}`;
}

function getServerBackendOrigin(): string {
  return normalizeBackendOrigin(
    process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:5000'
  );
}

/**
 * Fetches active salon services directly from the backend during SSR so initial
 * page loads and hard reloads render complete service menus immediately without
 * waiting for client-side hydration and a secondary API waterfall.
 */
export async function fetchInitialActiveServices(): Promise<ServiceRecord[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${getServerBackendOrigin()}/api/services`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { services?: ServiceRecord[] };
    return Array.isArray(data?.services) ? data.services : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches a single public active salon service on the server so View Details
 * renders complete content immediately without a loading spinner or hydration mismatch.
 */
export async function fetchInitialServiceById(id: string): Promise<ServiceRecord | null> {
  if (!id) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      `${getServerBackendOrigin()}/api/services/${encodeURIComponent(id)}`,
      {
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { service?: ServiceRecord };
    return data?.service ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
