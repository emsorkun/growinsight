import { randomBytes } from 'crypto';
import { getPool, ensureSchema } from '@/lib/db';
import type { User } from '@/types';

export interface StoredUser {
  id: string;
  username: string;
  name: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Fetch a single user by username (for login). */
export async function findUserByUsername(username: string): Promise<StoredUser | null> {
  await ensureSchema();
  const db = getPool();
  const { rows } = await db.query<StoredUser>(
    'SELECT * FROM users WHERE username = $1 AND is_active = TRUE',
    [username]
  );
  return rows[0] ?? null;
}

/** Fetch a single user by id. */
export async function findUserById(id: string): Promise<StoredUser | null> {
  await ensureSchema();
  const db = getPool();
  const { rows } = await db.query<StoredUser>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

/** List all users (for admin panel). */
export async function listUsers(): Promise<StoredUser[]> {
  await ensureSchema();
  const db = getPool();
  const { rows } = await db.query<StoredUser>('SELECT * FROM users ORDER BY created_at ASC');
  return rows;
}

/** Create a new user. Returns the created user. */
export async function createUser(
  username: string,
  name: string,
  passwordHash: string
): Promise<User> {
  await ensureSchema();
  const db = getPool();
  const id = `user-${randomBytes(12).toString('hex')}`;

  await db.query(
    `INSERT INTO users (id, username, name, password_hash)
     VALUES ($1, $2, $3, $4)`,
    [id, username, name, passwordHash]
  );

  return { id, username, name };
}

/** Update a user's name and/or active status. */
export async function updateUser(
  id: string,
  updates: { name?: string; is_active?: boolean }
): Promise<StoredUser | null> {
  await ensureSchema();
  const db = getPool();

  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (updates.name !== undefined) {
    sets.push(`name = $${idx++}`);
    params.push(updates.name);
  }
  if (updates.is_active !== undefined) {
    sets.push(`is_active = $${idx++}`);
    params.push(updates.is_active);
  }

  if (sets.length === 0) return findUserById(id);

  sets.push(`updated_at = NOW()`);
  params.push(id);

  const { rowCount } = await db.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`,
    params
  );

  if (rowCount === 0) return null;
  return findUserById(id);
}

/** Update a user's password. */
export async function updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
  await ensureSchema();
  const db = getPool();
  const { rowCount } = await db.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, id]
  );
  return (rowCount ?? 0) > 0;
}

/** Permanently delete a user. */
export async function deleteUser(id: string): Promise<boolean> {
  await ensureSchema();
  const db = getPool();
  const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}
