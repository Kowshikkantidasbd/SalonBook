'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { PublicUser } from '@/lib/salonRules';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
            }
          ) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({
  label = 'signin_with',
  onSuccess,
  onError,
}: {
  label?: 'signin_with' | 'signup_with' | 'continue_with';
  onSuccess: (user: PublicUser) => void;
  onError: (message: string) => void;
}) {
  const { googleLogin } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
  const isConfigured = Boolean(clientId) && clientId !== 'MY_GOOGLE_CLIENT_ID';

  useEffect(() => {
    if (!isConfigured || !containerRef.current) return;

    let cancelled = false;
    const renderGsi = () => {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;
      containerRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response?.credential) {
            onError('Google sign-in did not return a verified credential.');
            return;
          }
          try {
            const user = await googleLogin({ credential: response.credential });
            onSuccess(user);
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Google sign-in failed.');
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 360,
        text: label,
        shape: 'rectangular',
      });
    };

    if (window.google?.accounts?.id) {
      renderGsi();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', renderGsi);
      return () => {
        cancelled = true;
        existingScript.removeEventListener('load', renderGsi);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGsi;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [clientId, googleLogin, isConfigured, label, onError, onSuccess]);

  if (!isConfigured) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="my-5 flex items-center gap-3 text-xs text-[#6E6259]">
        <div className="h-px flex-1 bg-[#E5DDD0]" />
        <span>or</span>
        <div className="h-px flex-1 bg-[#E5DDD0]" />
      </div>
      <div ref={containerRef} className="flex justify-center min-h-[40px]" />
    </div>
  );
}
