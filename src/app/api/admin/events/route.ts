import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryEvents } from '@/lib/tracking';
import type { TrackingEventType } from '@/types';

const ADMIN_DOMAIN = '@mygrowdash.com';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin domain
    if (!user.username.endsWith(ADMIN_DOMAIN)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('event_type') as TrackingEventType | null;
    const username = searchParams.get('username');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    const result = await queryEvents({
      event_type: eventType ?? undefined,
      username: username ?? undefined,
      from: from ?? undefined,
      to: to ?? undefined,
      page,
      limit,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[api/admin/events] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
