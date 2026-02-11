import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { trackEvent } from '@/lib/tracking';
import type { TrackingPayload } from '@/types';

// ── Simple rate limiter for tracking (per IP) ─────────────────────
const TRACKING_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_TRACKING_PER_WINDOW = 60; // max 60 events per minute per IP

const trackingCounts = new Map<string, { count: number; resetAt: number }>();

function isTrackingRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = trackingCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    trackingCounts.set(ip, { count: 1, resetAt: now + TRACKING_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_TRACKING_PER_WINDOW;
}

// Clean up stale entries every 2 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, entry] of trackingCounts) {
      if (now > entry.resetAt) trackingCounts.delete(ip);
    }
  },
  2 * 60 * 1000
).unref();

const VALID_EVENT_TYPES = new Set([
  'login',
  'page_view',
  'filter_change',
  'button_click',
  'logout',
]);

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress =
      forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';

    if (isTrackingRateLimited(ipAddress)) {
      return NextResponse.json({ success: true }); // Silently drop
    }

    const body: TrackingPayload = await request.json();

    if (!body.event_type || !VALID_EVENT_TYPES.has(body.event_type)) {
      return NextResponse.json({ success: false, error: 'Invalid event_type' }, { status: 400 });
    }

    // Extract user from token (optional — some events may happen pre-login)
    const token = request.cookies.get('token')?.value;
    const user = token ? verifyToken(token) : null;

    const userAgent = request.headers.get('user-agent') ?? null;

    await trackEvent({
      eventType: body.event_type,
      userId: user?.id ?? null,
      username: user?.username ?? null,
      userName: user?.name ?? null,
      page: body.page ? String(body.page).slice(0, 500) : null, // Limit page length
      metadata: body.metadata ?? {},
      ipAddress,
      userAgent,
      sessionId: body.session_id ? String(body.session_id).slice(0, 100) : null, // Limit session ID length
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/tracking] Error:', error);
    return NextResponse.json({ success: true }); // Never fail client-side tracking
  }
}
