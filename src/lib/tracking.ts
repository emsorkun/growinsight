import { getPool, ensureSchema } from '@/lib/db';
import type {
  TrackingEventType,
  TrackingEvent,
  AdminEventsQuery,
  AdminEventsResponse,
} from '@/types';

interface TrackEventParams {
  eventType: TrackingEventType;
  userId?: string | null;
  username?: string | null;
  userName?: string | null;
  page?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
}

/**
 * Record a tracking event in the database.
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    await ensureSchema();
    const db = getPool();

    await db.query(
      `INSERT INTO tracking_events
        (event_type, user_id, username, user_name, page, metadata, ip_address, user_agent, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        params.eventType,
        params.userId ?? null,
        params.username ?? null,
        params.userName ?? null,
        params.page ?? null,
        JSON.stringify(params.metadata ?? {}),
        params.ipAddress ?? null,
        params.userAgent ?? null,
        params.sessionId ?? null,
      ]
    );
  } catch (error) {
    // Tracking should never break the app — log and swallow
    console.error('[tracking] Failed to record event:', error);
  }
}

/**
 * Query tracking events for the admin panel.
 */
export async function queryEvents(query: AdminEventsQuery): Promise<AdminEventsResponse> {
  await ensureSchema();
  const db = getPool();

  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 50, 200);
  const offset = (page - 1) * limit;

  // Build WHERE clauses
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (query.event_type) {
    conditions.push(`event_type = $${paramIdx++}`);
    params.push(query.event_type);
  }
  if (query.username) {
    conditions.push(`username ILIKE $${paramIdx++}`);
    params.push(`%${query.username}%`);
  }
  if (query.from) {
    conditions.push(`created_at >= $${paramIdx++}`);
    params.push(query.from);
  }
  if (query.to) {
    conditions.push(`created_at <= $${paramIdx++}`);
    params.push(query.to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get paginated events
  const eventsResult = await db.query<TrackingEvent>(
    `SELECT * FROM tracking_events ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  // Get total count
  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM tracking_events ${whereClause}`,
    params
  );

  // Get summary stats (always over the full filtered set, not just the page)
  const summaryResult = await db.query<{ total_events: string; unique_users: string }>(
    `SELECT
       COUNT(*) as total_events,
       COUNT(DISTINCT username) as unique_users
     FROM tracking_events ${whereClause}`,
    params
  );

  const eventsByTypeResult = await db.query<{ event_type: string; count: string }>(
    `SELECT event_type, COUNT(*) as count
     FROM tracking_events ${whereClause}
     GROUP BY event_type ORDER BY count DESC`,
    params
  );

  const eventsByDayResult = await db.query<{ date: string; count: string }>(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM tracking_events ${whereClause}
     GROUP BY DATE(created_at) ORDER BY date DESC
     LIMIT 30`,
    params
  );

  const topPagesResult = await db.query<{ page: string; count: string }>(
    `SELECT page, COUNT(*) as count
     FROM tracking_events
     ${whereClause ? whereClause + ' AND' : 'WHERE'} page IS NOT NULL
     GROUP BY page ORDER BY count DESC
     LIMIT 10`,
    params
  );

  const topUsersResult = await db.query<{ username: string; user_name: string; count: string }>(
    `SELECT username, MAX(user_name) as user_name, COUNT(*) as count
     FROM tracking_events
     ${whereClause ? whereClause + ' AND' : 'WHERE'} username IS NOT NULL
     GROUP BY username ORDER BY count DESC
     LIMIT 10`,
    params
  );

  const summary = summaryResult.rows[0];

  return {
    events: eventsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    limit,
    summary: {
      totalEvents: parseInt(summary.total_events, 10),
      uniqueUsers: parseInt(summary.unique_users, 10),
      eventsByType: Object.fromEntries(
        eventsByTypeResult.rows.map((r) => [r.event_type, parseInt(r.count, 10)])
      ),
      eventsByDay: eventsByDayResult.rows
        .map((r) => ({ date: r.date, count: parseInt(r.count, 10) }))
        .reverse(),
      topPages: topPagesResult.rows.map((r) => ({
        page: r.page,
        count: parseInt(r.count, 10),
      })),
      topUsers: topUsersResult.rows.map((r) => ({
        username: r.username,
        name: r.user_name || r.username,
        count: parseInt(r.count, 10),
      })),
    },
  };
}
