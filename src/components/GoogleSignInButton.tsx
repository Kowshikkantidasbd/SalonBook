'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi, setStoredToken } from '@/lib/api';
import type { PublicUser } from '@/lib/salonRules';

const BUTTON_LABELS: Record<'signin_with' | 'signup_with' | 'continue_with', string> = {
  signin_with: 'Sign in with Google',
  signup_with: 'Sign up with Google',
  continue_with: 'Continue with Google',
};

const DEFAULT_GOOGLE_CLIENT_ID =
  '801397027922-te0vr2mpme4oi60g1m6oh8hvmc0tt8q4.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function ensureGsiScriptLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.oauth2) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      if (window.google?.accounts?.oauth2) resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function GoogleSignInButton({
  label = 'signin_with',
  callbackURL = '/dashboard',
  onSuccess,
  onError,
}: {
  label?: 'signin_with' | 'signup_with' | 'continue_with';
  callbackURL?: string;
  onSuccess?: (user: PublicUser) => void;
  onError: (message: string) => void;
}) {
  const { signInWithGoogle, setUserDirect } = useAuth();
  const [loading, setLoading] = useState(false);
  const tokenClientRef = useRef<{ requestAccessToken: (opts?: { prompt?: string }) => void } | null>(null);

  const buttonText = BUTTON_LABELS[label] || 'Sign in with Google';
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let mounted = true;

    void ensureGsiScriptLoaded().then((loaded) => {
      if (!mounted || !loaded || !window.google?.accounts) return;

      try {
        // Initialize Token Client for Google Sign-In popup (does NOT require client_secret)
        if (window.google.accounts.oauth2) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            callback: async (tokenResponse) => {
              if (tokenResponse.error || !tokenResponse.access_token) {
                setLoading(false);
                if (tokenResponse.error !== 'popup_closed_by_user') {
                  const errMessage =
                    tokenResponse.error_description ||
                    tokenResponse.error ||
                    'Google sign-in was cancelled.';
                  onError(errMessage);
                }
                return;
              }

              try {
                const res = await authApi.googleAuth<PublicUser>({
                  accessToken: tokenResponse.access_token,
                  next: callbackURL,
                });
                setStoredToken(res.token);
                setUserDirect(res.user);
                onSuccess?.(res.user);
              } catch (err: unknown) {
                setLoading(false);
                const message =
                  err instanceof Error && err.message
                    ? err.message
                    : 'Google sign-in failed. Please try again.';
                onError(message);
              }
            },
          });
        }

        // Also initialize GIS One-Tap Credential callback
        if (window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            auto_select: false,
            callback: async (credentialResponse) => {
              if (!credentialResponse?.credential) return;
              setLoading(true);
              try {
                const res = await authApi.googleAuth<PublicUser>({
                  credential: credentialResponse.credential,
                  next: callbackURL,
                });
                setStoredToken(res.token);
                setUserDirect(res.user);
                onSuccess?.(res.user);
              } catch (err: unknown) {
                setLoading(false);
                const message =
                  err instanceof Error && err.message
                    ? err.message
                    : 'Google sign-in failed. Please try again.';
                onError(message);
              }
            },
          });
        }
      } catch (err) {
        console.warn('Google GSI initialization warning:', err);
      }
    });

    return () => {
      mounted = false;
    };
  }, [clientId, callbackURL, onSuccess, onError, setUserDirect]);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);

    // 1. Try Google Identity Services Token Client directly:
    // This opens Google's native popup from accounts.google.com and DOES NOT require client_secret!
    if (!tokenClientRef.current && window.google?.accounts?.oauth2) {
      try {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse.error || !tokenResponse.access_token) {
              setLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                onError(tokenResponse.error_description || tokenResponse.error || 'Google sign-in was cancelled.');
              }
              return;
            }
            try {
              const res = await authApi.googleAuth<PublicUser>({
                accessToken: tokenResponse.access_token,
                next: callbackURL,
              });
              setStoredToken(res.token);
              setUserDirect(res.user);
              onSuccess?.(res.user);
            } catch (err: unknown) {
              setLoading(false);
              onError(err instanceof Error ? err.message : 'Google sign-in failed.');
            }
          },
        });
      } catch {
        // Fall back below
      }
    }

    if (tokenClientRef.current) {
      try {
        tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('tokenClient.requestAccessToken failed, falling back:', err);
      }
    }

    // 2. Fallback to AuthContext popup flow
    try {
      const signedInUser = await signInWithGoogle(callbackURL);
      if (signedInUser) {
        onSuccess?.(signedInUser);
      } else {
        setLoading(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Google sign-in failed. Please try again.';
      onError(message);
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3.5 text-xs text-[#8C7F72]">
        <div className="h-px flex-1 bg-[#EAE2D5]" />
        <span className="text-xs font-medium text-[#8C7F72] whitespace-nowrap">
          or continue with
        </span>
        <div className="h-px flex-1 bg-[#EAE2D5]" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        aria-label={buttonText}
        className="w-full inline-flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF6EF] active:bg-[#F3EDE2] text-[#231A16] border border-[#DDD3C4] hover:border-[#B5893A]/75 shadow-[0_2px_10px_-4px_rgba(35,26,22,0.1)] hover:shadow-[0_8px_18px_-10px_rgba(35,26,22,0.2)] text-sm font-medium transition-all duration-150 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5893A]/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="w-[18px] h-[18px] rounded-full border-2 border-[#E5DDD0] border-t-[#B5893A] animate-spin shrink-0"
          />
        ) : (
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="w-[18px] h-[18px] shrink-0 block"
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        )}
        <span className="whitespace-nowrap">
          {loading ? 'Connecting with Google...' : buttonText}
        </span>
      </button>
    </div>
  );
}
