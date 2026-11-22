const TOKEN_STORAGE_KEY = 'salonbook_jwt';
const USER_CACHE_KEY = 'salonbook_user_cache';
const SESSION_CACHE_PREFIX = 'salonbook_api_v1:';

export function normalizeApiOrigin(raw: string, browserHostname?: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '').replace(/\/api$/i, '');
  if (!trimmed) return '';
  const withProto =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `${trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1') ? 'http' : 'https'}://${trimmed}`;
  if (browserHostname) {
    const isLiveBrowser = browserHostname !== 'localhost' && browserHostname !== '127.0.0.1';
    const pointsToLocalhost =
      withProto.startsWith('http://localhost') ||
      withProto.startsWith('http://127.0.0.1');
    if (isLiveBrowser && pointsToLocalhost) {
      return '';
    }
  }
  return withProto;
}

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim() || '';
  const host = typeof window !== 'undefined' ? window.location.hostname : undefined;
  return normalizeApiOrigin(configured, host);
}

export function resolveApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}

let memoryToken: string | null = null;
let memoryUser: unknown | null = null;

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const lsToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (lsToken) {
      memoryToken = lsToken;
      return lsToken;
    }
  } catch {
    // Fall back to sessionStorage / in-memory token when iframe blocks localStorage
  }
  try {
    const ssToken = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (ssToken) {
      memoryToken = ssToken;
      return ssToken;
    }
  } catch {
    // Fall back to in-memory token
  }
  return memoryToken;
}

export function setStoredToken(token: string | null): void {
  memoryToken = token;
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or iframe storage errors
  }

  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore sessionStorage errors
  }

  try {
    const isHttps = window.location.protocol === 'https:';
    if (token) {
      const attrs = isHttps
        ? 'Path=/; Max-Age=604800; SameSite=None; Secure; Partitioned'
        : 'Path=/; Max-Age=604800; SameSite=Lax';
      document.cookie = `salonbook_client_session=1; ${attrs}`;
    } else {
      const attrs = isHttps
        ? 'Path=/; Max-Age=0; SameSite=None; Secure; Partitioned'
        : 'Path=/; Max-Age=0; SameSite=Lax';
      document.cookie = `salonbook_client_session=; ${attrs}`;
    }
  } catch {
    // Ignore document.cookie restrictions
  }
}

export function getCachedUser<T>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      memoryUser = parsed;
      return parsed;
    }
  } catch {
    // Fall back to sessionStorage / in-memory cache
  }
  try {
    const raw = window.sessionStorage.getItem(USER_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      memoryUser = parsed;
      return parsed;
    }
  } catch {
    // Fall back to in-memory cache
  }
  return (memoryUser as T | null) ?? null;
}

export function setCachedUser(user: unknown | null): void {
  memoryUser = user;
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
  try {
    if (user) {
      window.sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      window.sessionStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface CacheEntry<T = unknown> {
  data: T;
  fetchedAt: number;
  scope: string;
}

const apiCache = new Map<string, CacheEntry>();
const inflightGets = new Map<string, Promise<unknown>>();

function getTokenScope(token: string | null): string {
  if (!token) return 'anon';
  // Use last 16 chars of JWT signature as lightweight session scope key
  return token.slice(-16);
}

function getStorageKey(path: string): string {
  return `${SESSION_CACHE_PREFIX}${path}`;
}

function readSessionEntry<T>(path: string, scope: string): CacheEntry<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(getStorageKey(path));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || parsed.scope !== scope || typeof parsed.fetchedAt !== 'number') {
      window.sessionStorage.removeItem(getStorageKey(path));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionEntry(path: string, entry: CacheEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(entry);
    // Skip unusually large payloads (> 250KB) to keep sessionStorage snappy
    if (serialized.length > 250000) return;
    window.sessionStorage.setItem(getStorageKey(path), serialized);
  } catch {
    // Ignore sessionStorage quota errors
  }
}

function clearSessionPrefix(prefix?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (!key || !key.startsWith(SESSION_CACHE_PREFIX)) continue;
      const cachePath = key.slice(SESSION_CACHE_PREFIX.length);
      if (!prefix || cachePath.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore sessionStorage errors
  }
}

function seedRelatedEntries(path: string, data: unknown, scope: string, now: number): void {
  if (!data || typeof data !== 'object') return;
  const record = data as Record<string, unknown>;

  // Automatically seed individual /api/services/:id entries when full list loads
  if (path === '/api/services' && Array.isArray(record.services)) {
    for (const item of record.services) {
      if (item && typeof item === 'object' && 'id' in item && typeof item.id === 'string') {
        const detailPath = `/api/services/${encodeURIComponent(item.id)}`;
        const entry: CacheEntry = { data: { service: item }, fetchedAt: now, scope };
        apiCache.set(detailPath, entry);
      }
    }
  }

  // Automatically seed stats & appointments when combined admin overview loads
  if (path === '/api/admin/overview') {
    if ('stats' in record && record.stats) {
      const statsEntry: CacheEntry = { data: { stats: record.stats }, fetchedAt: now, scope };
      apiCache.set('/api/admin/stats', statsEntry);
      writeSessionEntry('/api/admin/stats', statsEntry);
    }
    if ('appointments' in record && Array.isArray(record.appointments)) {
      const aptEntry: CacheEntry = {
        data: { appointments: record.appointments },
        fetchedAt: now,
        scope,
      };
      apiCache.set('/api/admin/appointments', aptEntry);
      writeSessionEntry('/api/admin/appointments', aptEntry);
    }
  }
}

export function primeApiCache<T>(path: string, data: T): void {
  const scope = getTokenScope(getStoredToken());
  const now = Date.now();
  const entry: CacheEntry<T> = { data, fetchedAt: now, scope };
  apiCache.set(path, entry);
  writeSessionEntry(path, entry);
  seedRelatedEntries(path, data, scope, now);
}

export function invalidateApiCache(prefix?: string): void {
  if (!prefix) {
    apiCache.clear();
    clearSessionPrefix();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix)) {
      apiCache.delete(key);
    }
  }
  clearSessionPrefix(prefix);
}

export function getCachedApiData<T>(path: string, maxAgeMs = 120000): T | null {
  const scope = getTokenScope(getStoredToken());
  let entry = apiCache.get(path) as CacheEntry<T> | undefined;

  if (entry && entry.scope !== scope) {
    apiCache.delete(path);
    entry = undefined;
  }

  if (!entry) {
    const hydrated = readSessionEntry<T>(path, scope);
    if (hydrated) {
      apiCache.set(path, hydrated);
      entry = hydrated;
    }
  }

  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > maxAgeMs) {
    return null;
  }
  return entry.data;
}

export function isApiCacheFresh(path: string, freshMs = 15000): boolean {
  const scope = getTokenScope(getStoredToken());
  let entry = apiCache.get(path);
  if (!entry || entry.scope !== scope) {
    const hydrated = readSessionEntry(path, scope);
    if (!hydrated) return false;
    apiCache.set(path, hydrated);
    entry = hydrated;
  }
  return Date.now() - entry.fetchedAt <= freshMs;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  let response: Response;
  try {
    response = await fetch(resolveApiUrl(path), {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 504, 'TIMEOUT');
    }
    throw new ApiError(
      'Unable to reach SalonBook backend server. Please verify it is running.',
      502,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    const isAuthEndpoint =
      path.startsWith('/api/auth/login') ||
      path.startsWith('/api/auth/register') ||
      path.startsWith('/api/auth/google');
    if (
      typeof window !== 'undefined' &&
      !isAuthEndpoint &&
      token &&
      (response.status === 401 || (response.status === 403 && data?.code === 'ACCOUNT_BLOCKED'))
    ) {
      window.dispatchEvent(
        new CustomEvent('salonbook:auth-invalid', {
          detail: { status: response.status, code: data?.code, message: data?.error },
        })
      );
    }
    throw new ApiError(
      data?.error || `Request failed (${response.status})`,
      response.status,
      data?.code
    );
  }

  if (method !== 'GET') {
    if (path.startsWith('/api/auth')) {
      invalidateApiCache();
    } else {
      invalidateApiCache('/api/services');
      invalidateApiCache('/api/appointments');
      invalidateApiCache('/api/transactions');
      invalidateApiCache('/api/customer');
      invalidateApiCache('/api/admin');
    }
  }

  return data as T;
}

export async function apiFetchCached<T>(
  path: string,
  ttlMs = 30000
): Promise<T> {
  const cached = getCachedApiData<T>(path, ttlMs);
  if (cached !== null) {
    return cached;
  }

  return apiFetchRevalidate<T>(path);
}

export async function apiFetchRevalidate<T>(path: string): Promise<T> {
  const token = getStoredToken();
  const scope = getTokenScope(token);
  const dedupeKey = `${scope}:${path}`;
  const existing = inflightGets.get(dedupeKey);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = apiFetch<T>(path)
    .then((data) => {
      const now = Date.now();
      const entry: CacheEntry<T> = { data, fetchedAt: now, scope };
      apiCache.set(path, entry);
      writeSessionEntry(path, entry);
      seedRelatedEntries(path, data, scope, now);
      return data;
    })
    .finally(() => {
      inflightGets.delete(dedupeKey);
    });

  inflightGets.set(dedupeKey, promise);
  return promise;
}

export function prefetchApiData(path: string, ttlMs = 30000): void {
  if (typeof window === 'undefined') return;
  if (isApiCacheFresh(path, ttlMs)) return;
  apiFetchRevalidate(path).catch(() => {
    // Silent background prefetch
  });
}

export async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await apiFetch<{ url: string }>('/api/upload', {
    method: 'POST',
    body: formData,
  });
  return res.url;
}

// ============================================================================
// Clean Domain REST API Modules (Express + MongoDB + JWT + Stripe + ImgBB)
// ============================================================================

export const authApi = {
  register: <TUser = unknown>(payload: {
    name: string;
    email: string;
    password: string;
    image?: string;
  }) =>
    apiFetch<{ token: string; user: TUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: <TUser = unknown>(email: string, password: string) =>
    apiFetch<{ token: string; user: TUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: <TUser = unknown>(ttlMs = 15000) =>
    apiFetchCached<{ user: TUser }>('/api/auth/me', ttlMs),

  providers: () =>
    apiFetch<{ jwt: boolean; google: boolean }>('/api/auth/providers'),

  startGoogleAuth: (handoffId: string, next = '/dashboard') =>
    apiFetch<{ url: string; handoffId: string }>('/api/auth/google/start', {
      method: 'POST',
      body: JSON.stringify({ handoffId, next }),
    }),

  googleAuth: <TUser = unknown>(payload: {
    credential?: string;
    accessToken?: string;
    email?: string;
    name?: string;
    image?: string;
    handoffId?: string;
    next?: string;
  }) =>
    apiFetch<{ token: string; user: TUser; next?: string }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPopupStatus: <TUser = unknown>(handoffId: string) =>
    apiFetch<{
      status: 'pending' | 'success' | 'error';
      token?: string;
      user?: TUser;
      next?: string;
      error?: string;
    }>(`/api/auth/popup-status?handoff=${encodeURIComponent(handoffId)}`),

  getProfile: <TUser = unknown>() => apiFetch<{ user: TUser }>('/api/profile'),

  updateProfile: <TUser = unknown>(payload: {
    name: string;
    phone?: string;
    image?: string;
  }) =>
    apiFetch<{ user: TUser }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

export const servicesApi = {
  list: <TService = unknown>(params?: {
    search?: string;
    category?: string;
    sort?: 'newest' | 'price_asc' | 'price_desc';
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.sort) query.set('sort', params.sort);
    const qs = query.toString();
    return apiFetchCached<{ services: TService[] }>(`/api/services${qs ? `?${qs}` : ''}`, 30000);
  },

  getById: <TService = unknown>(id: string) =>
    apiFetchCached<{ service: TService }>(`/api/services/${encodeURIComponent(id)}`, 30000),
};

export const appointmentsApi = {
  getSlots: (serviceId: string, date: string) =>
    apiFetch<{ slots: Array<{ timeSlot: string; available: boolean }> }>(
      `/api/appointments/slots?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`
    ),

  create: <TAppointment = unknown>(payload: {
    serviceId: string;
    appointmentDate: string;
    timeSlot: string;
    message?: string;
  }) =>
    apiFetch<{ appointment: TAppointment }>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMy: <TAppointment = unknown>() =>
    apiFetchRevalidate<{ appointments: TAppointment[] }>('/api/appointments/my'),

  cancel: <TAppointment = unknown>(appointmentId: string) =>
    apiFetch<{ appointment: TAppointment; alreadyUpdated?: boolean }>(
      `/api/appointments/${encodeURIComponent(appointmentId)}/cancel`,
      { method: 'PATCH' }
    ),

  getCustomerStats: () =>
    apiFetch<{
      stats: {
        totalRequests: number;
        pendingAppointments: number;
        confirmedAppointments: number;
        cancelledAppointments: number;
      };
    }>('/api/customer/stats'),
};

export const paymentsApi = {
  createCheckoutSession: (appointmentId: string) =>
    apiFetch<{ url: string; sessionId: string; mode: 'stripe' }>(
      '/api/payments/create-checkout-session',
      {
        method: 'POST',
        body: JSON.stringify({ appointmentId }),
      }
    ),

  getSession: <TResponse = unknown>(sessionId: string) =>
    apiFetch<TResponse>(`/api/payments/session/${encodeURIComponent(sessionId)}`),

  completeTestPayment: async (sessionId: string) => {
    return { redirectUrl: `/payment/success?session_id=${encodeURIComponent(sessionId)}` };
  },

  getMyTransactions: <TResponse = unknown>() =>
    apiFetchRevalidate<TResponse>('/api/transactions/my'),
};

export const adminApi = {
  getOverview: <TResponse = unknown>() => apiFetchRevalidate<TResponse>('/api/admin/overview'),

  getStats: <TStats = unknown>() => apiFetch<{ stats: TStats }>('/api/admin/stats'),

  getServices: <TService = unknown>() =>
    apiFetchRevalidate<{ services: TService[] }>('/api/admin/services'),

  createService: <TService = unknown>(payload: Record<string, unknown>) =>
    apiFetch<{ service: TService }>('/api/admin/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateService: <TService = unknown>(id: string, payload: Record<string, unknown>) =>
    apiFetch<{ service: TService }>(`/api/admin/services/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  toggleServiceStatus: <TService = unknown>(id: string, status: 'active' | 'inactive') =>
    apiFetch<{ service: TService }>(`/api/admin/services/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteService: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/services/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getAppointments: <TAppointment = unknown>() =>
    apiFetchRevalidate<{ appointments: TAppointment[] }>('/api/admin/appointments'),

  updateAppointmentStatus: <TAppointment = unknown>(
    id: string,
    status: 'confirmed' | 'cancelled'
  ) =>
    apiFetch<{ appointment: TAppointment; alreadyUpdated?: boolean }>(
      `/api/admin/appointments/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    ),

  getUsers: <TUser = unknown>() => apiFetchRevalidate<{ users: TUser[] }>('/api/admin/users'),

  setUserBlocked: <TUser = unknown>(id: string, isBlocked: boolean) =>
    apiFetch<{ user: TUser }>(`/api/admin/users/${encodeURIComponent(id)}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked }),
    }),

  getTransactions: <TTransaction = unknown>() =>
    apiFetchRevalidate<{ transactions: TTransaction[] }>('/api/admin/transactions'),
};

export const uploadApi = {
  uploadImage: uploadImageFile,
};

