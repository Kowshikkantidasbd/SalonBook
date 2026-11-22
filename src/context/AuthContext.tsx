'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ApiError,
  authApi,
  getCachedUser,
  getStoredToken,
  invalidateApiCache,
  prefetchApiData,
  setCachedUser,
  setStoredToken,
} from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { PublicUser } from '@/lib/salonRules';

const PROTECTED_ROUTE_PREFIXES = ['/dashboard', '/profile', '/payment'];

function isProtectedRoutePath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  loggingOut: boolean;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    image?: string;
  }) => Promise<PublicUser>;
  signInWithGoogle: (callbackURL?: string) => Promise<PublicUser | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserDirect: (user: PublicUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function warmDashboardForUser(user: PublicUser | null): void {
  if (!user) return;
  if (user.role === 'admin') {
    prefetchApiData('/api/admin/overview', 15000);
    prefetchApiData('/api/admin/services', 30000);
  } else {
    prefetchApiData('/api/appointments/my', 15000);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const activeTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (loggingOut && !isProtectedRoutePath(pathname)) {
      setLoggingOut(false);
    }
  }, [loggingOut, pathname]);

  const updateUserState = useCallback((nextUser: PublicUser | null) => {
    setUser(nextUser);
    setCachedUser(nextUser);
    activeTokenRef.current = getStoredToken();
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      updateUserState(null);
      setLoading(false);
      return;
    }

    const cached = getCachedUser<PublicUser>();
    if (cached && activeTokenRef.current === null) {
      setUser(cached);
      setLoading(false);
    }

    try {
      const res = await authApi.me<PublicUser>(15000);
      updateUserState(res.user);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setStoredToken(null);
        invalidateApiCache();
        updateUserState(null);
      } else if (!cached) {
        updateUserState(null);
      }
    } finally {
      setLoading(false);
    }
  }, [updateUserState]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const syncSessionIfChanged = () => {
      const currentToken = getStoredToken();
      if (currentToken !== activeTokenRef.current) {
        invalidateApiCache('/api/auth/me');
        refreshUser();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'salonbook_jwt' || e.key === 'salonbook_user_cache') {
        invalidateApiCache('/api/auth/me');
        refreshUser();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncSessionIfChanged();
      }
    };

    const handleAuthInvalid = () => {
      setStoredToken(null);
      invalidateApiCache();
      updateUserState(null);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', syncSessionIfChanged);
    window.addEventListener('salonbook:auth-invalid', handleAuthInvalid);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', syncSessionIfChanged);
      window.removeEventListener('salonbook:auth-invalid', handleAuthInvalid);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshUser, updateUserState]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoggingOut(false);
      try {
        await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
        });
      } catch {
        // Continue with unified authApi
      }
      const res = await authApi.login<PublicUser>(email.trim().toLowerCase(), password);
      setStoredToken(res.token);
      updateUserState(res.user);
      warmDashboardForUser(res.user);
      return res.user;
    },
    [updateUserState]
  );

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; image?: string }) => {
      setLoggingOut(false);
      try {
        await authClient.signUp.email({
          name: payload.name.trim(),
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
          image: payload.image?.trim() || undefined,
        });
      } catch {
        // Continue with unified authApi
      }
      const res = await authApi.register<PublicUser>({
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        image: payload.image?.trim() || undefined,
      });
      setStoredToken(res.token);
      updateUserState(res.user);
      warmDashboardForUser(res.user);
      return res.user;
    },
    [updateUserState]
  );

  const signInWithGoogle = useCallback(
    async (callbackURL = '/dashboard'): Promise<PublicUser | null> => {
      if (typeof window === 'undefined') return null;

      const safeNext =
        callbackURL.startsWith('/') && !callbackURL.startsWith('//')
          ? callbackURL
          : '/dashboard';
      const handoffId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;

      const origin = window.location.origin;
      const width = 540;
      const height = 660;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

      // Open popup synchronously inside user click gesture so browsers allow it inside iframes
      const popup = window.open(
        'about:blank',
        'salonbook_google_oauth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error(
          'Your browser blocked the Google sign-in popup. Please allow popups for this site and click Sign in with Google again.'
        );
      }

      try {
        popup.document.write(
          '<!doctype html><html><head><title>Connecting to Google…</title></head><body style="font-family:system-ui,-apple-system,sans-serif;background:#FBF8F3;color:#231A16;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><p style="font-size:14px;">Connecting to Google Sign-In…</p></body></html>'
        );
      } catch {
        // Ignore cross-origin document write restrictions
      }

      let authUrl = '';
      try {
        const startRes = await authApi.startGoogleAuth(handoffId, safeNext);
        authUrl = startRes.url;
      } catch (err) {
        try {
          popup.close();
        } catch {
          // Ignore popup close errors
        }
        throw err instanceof Error
          ? err
          : new Error('Unable to start Google Sign-In. Please try again.');
      }

      if (!authUrl) {
        try {
          popup.close();
        } catch {
          // Ignore popup close errors
        }
        throw new Error('Unable to generate Google authorization URL.');
      }

      popup.location.replace(authUrl);

      return new Promise<PublicUser | null>((resolve, reject) => {
        let settled = false;
        let pollTimer: number | null = null;
        let timeoutTimer: number | null = null;

        const cleanup = () => {
          window.removeEventListener('message', handleMessage);
          if (pollTimer !== null) window.clearInterval(pollTimer);
          if (timeoutTimer !== null) window.clearTimeout(timeoutTimer);
        };

        const finishSuccess = (token: string, nextUser: PublicUser) => {
          if (settled) return;
          settled = true;
          cleanup();
          setLoggingOut(false);
          setStoredToken(token);
          updateUserState(nextUser);
          warmDashboardForUser(nextUser);
          resolve(nextUser);
        };

        const finishError = (message: string) => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(new Error(message));
        };

        const finishCancelled = () => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(null);
        };

        const checkHandoffStatus = async (wasClosed: boolean) => {
          try {
            const status = await authApi.getPopupStatus<PublicUser>(handoffId);

            if (status.status === 'success' && status.token && status.user) {
              finishSuccess(status.token, status.user);
              return;
            }
            if (status.status === 'error') {
              finishError(status.error || 'Google sign-in failed.');
              return;
            }
          } catch {
            // Ignore transient polling failures
          }

          if (wasClosed) {
            finishCancelled();
          }
        };

        const handleMessage = (event: MessageEvent) => {
          const eventOrigin = event.origin || '';
          const trusted =
            eventOrigin === origin ||
            eventOrigin.endsWith('.run.app') ||
            eventOrigin.includes('localhost') ||
            eventOrigin.includes('127.0.0.1');
          if (!trusted) return;

          const data = event.data as {
            type?: string;
            token?: string;
            user?: PublicUser;
            error?: string;
          } | null;

          if (data?.type === 'SALONBOOK_OAUTH_SUCCESS' && data.token && data.user) {
            finishSuccess(data.token, data.user);
          } else if (data?.type === 'SALONBOOK_OAUTH_ERROR') {
            finishError(data.error || 'Google sign-in failed.');
          }
        };

        window.addEventListener('message', handleMessage);

        pollTimer = window.setInterval(() => {
          if (settled) return;
          const isClosed = Boolean(popup.closed);
          void checkHandoffStatus(isClosed);
        }, 700);

        timeoutTimer = window.setTimeout(() => {
          if (!settled) {
            try {
              popup.close();
            } catch {
              // Ignore cross-origin close restrictions
            }
            finishError('Google sign-in timed out. Please try again.');
          }
        }, 5 * 60 * 1000);
      });
    },
    [updateUserState]
  );

  const logout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await authClient.signOut().catch(() => {});
    } catch {
      // Ignore Better Auth client logout errors
    }
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    setStoredToken(null);
    invalidateApiCache();
    updateUserState(null);
  }, [updateUserState]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loggingOut,
        login,
        register,
        signInWithGoogle,
        logout,
        refreshUser,
        setUserDirect: updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
