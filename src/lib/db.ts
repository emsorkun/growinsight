import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. Add your Railway PostgreSQL connection string to .env'
      );
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

/**
 * Auto-create all tables if they don't exist.
 * Called lazily on first DB operation.
 */
let schemaReady = false;

export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;

  const db = getPool();

  // ── Users table ──────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            VARCHAR(100) PRIMARY KEY,
      username      VARCHAR(255) UNIQUE NOT NULL,
      name          VARCHAR(255) NOT NULL,
      password_hash TEXT         NOT NULL,
      is_active     BOOLEAN      DEFAULT TRUE,
      created_at    TIMESTAMPTZ  DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  // ── Tracking events table ────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS tracking_events (
      id            SERIAL PRIMARY KEY,
      event_type    VARCHAR(50)  NOT NULL,
      user_id       VARCHAR(100),
      username      VARCHAR(255),
      user_name     VARCHAR(255),
      page          VARCHAR(500),
      metadata      JSONB DEFAULT '{}',
      ip_address    VARCHAR(45),
      user_agent    TEXT,
      session_id    VARCHAR(100),
      created_at    TIMESTAMPTZ  DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_tracking_events_type
      ON tracking_events (event_type);
    CREATE INDEX IF NOT EXISTS idx_tracking_events_user
      ON tracking_events (username);
    CREATE INDEX IF NOT EXISTS idx_tracking_events_created
      ON tracking_events (created_at DESC);
  `);

  // ── Seed initial users if table is empty ─────────────────
  const { rows } = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM users');
  if (parseInt(rows[0].count, 10) === 0) {
    await seedInitialUsers(db);
  }

  schemaReady = true;
}

/**
 * Seed the hardcoded users that existed before the DB migration.
 * Only runs once when the users table is first created (empty).
 */
async function seedInitialUsers(db: Pool): Promise<void> {
  const initialUsers = [
    {
      id: 'user-1',
      username: 'rami.taha@careem.com',
      name: 'Rami Taha',
      passwordHash: '$2b$10$2hTSVACWv.3vdPkvDaVUVufwiFO6k0p5njH6.h5/9E6ImQ2VFb3ua',
    },
    {
      id: 'user-2',
      username: 'gaelle@mygrowdash.com',
      name: 'Gaelle',
      passwordHash: '$2b$10$BLn1OD4Fe1rJ87y5tED9Me.ediGdv26OC4sUxEkrqDILIr2rVejkC',
    },
    {
      id: 'user-3',
      username: 'sean@mygrowdash.com',
      name: 'Sean',
      passwordHash: '$2b$10$PULy6Rt/QC5iJN/QceZEnuV6TLvtwEAQ//IFOlMB8RrQgHUhg8LRy',
    },
    {
      id: 'user-4',
      username: 'enver@mygrowdash.com',
      name: 'Enver',
      passwordHash: '$2b$10$2qyMKhsEPC2A9EILtzqzruPTvHXZeIU53Ducz5t9HNMdqG88UDGcS',
    },
  ];

  for (const u of initialUsers) {
    await db.query(
      `INSERT INTO users (id, username, name, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [u.id, u.username, u.name, u.passwordHash]
    );
  }

  console.log('[db] Seeded initial users');
}
