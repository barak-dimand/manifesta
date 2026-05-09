'use client';

import posthog from 'posthog-js';
import { PostHogProvider, usePostHog } from 'posthog-js/react';
import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    capture_pageview: false,  // fired manually below so we include the full URL
    capture_pageleave: true,
    person_profiles: 'identified_only',
  });
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph) return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    ph.capture('$pageview', { $current_url: url });
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams, ph]);

  return null;
}

function ClerkIdentitySync() {
  const { isSignedIn, isLoaded, user } = useUser();
  const ph = usePostHog();
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !ph) return;
    if (isSignedIn && user) {
      if (lastIdRef.current === user.id) return;
      lastIdRef.current = user.id;
      ph.identify(user.id, {
        email: user.emailAddresses?.[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || undefined,
        createdAt: user.createdAt,
      });
    } else if (!isSignedIn && lastIdRef.current) {
      lastIdRef.current = null;
      ph.reset();
    }
  }, [isSignedIn, isLoaded, user, ph]);

  return null;
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <Suspense>
        <PageViewTracker />
        <ClerkIdentitySync />
      </Suspense>
      {children}
    </PostHogProvider>
  );
}
