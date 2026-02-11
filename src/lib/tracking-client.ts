'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { TrackingEventType } from '@/types';

// Stable session ID per browser tab
let sessionId: string | null = null;
function getSessionId(): string {
  if (!sessionId) {
    sessionId =
      typeof window !== 'undefined'
        ? (sessionStorage.getItem('gi_sid') ??
          (() => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            sessionStorage.setItem('gi_sid', id);
            return id;
          })())
        : 'ssr';
  }
  return sessionId;
}

/**
 * Fire-and-forget POST to /api/tracking.
 * Uses navigator.sendBeacon when available for reliability.
 */
function sendEvent(
  eventType: TrackingEventType,
  page?: string,
  metadata?: Record<string, unknown>
) {
  const payload = JSON.stringify({
    event_type: eventType,
    page: page ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
    metadata,
    session_id: getSessionId(),
  });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/tracking', blob);
  } else {
    fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* tracking should never fail the app */
    });
  }
}

// ─── Public helpers ──────────────────────────────────────────────

export function trackLogin() {
  sendEvent('login');
}

export function trackLogout() {
  sendEvent('logout');
}

export function trackPageView(page?: string) {
  sendEvent('page_view', page);
}

export function trackFilterChange(filters: Record<string, unknown>) {
  sendEvent('filter_change', undefined, filters);
}

export function trackButtonClick(buttonName: string, extra?: Record<string, unknown>) {
  sendEvent('button_click', undefined, { button: buttonName, ...extra });
}

// ─── React hooks ─────────────────────────────────────────────────

/**
 * Automatically tracks page views when the route changes.
 * Drop this into a layout that wraps authenticated pages.
 */
export function usePageViewTracking() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    // Avoid double-firing on mount + route change to the same path
    if (pathname && pathname !== prevPath.current) {
      prevPath.current = pathname;
      trackPageView(pathname);
    }
  }, [pathname]);
}

/**
 * Returns memoized tracking helpers so components don't re-render.
 */
export function useTracking() {
  const trackFilter = useCallback((filters: Record<string, unknown>) => {
    trackFilterChange(filters);
  }, []);

  const trackButton = useCallback((buttonName: string, extra?: Record<string, unknown>) => {
    trackButtonClick(buttonName, extra);
  }, []);

  return { trackLogin, trackLogout, trackPageView, trackFilter, trackButton };
}
