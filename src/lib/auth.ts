import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { User } from '@/types';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production. Add it to your environment variables.');
  }
  return secret || 'growinsight-secret-key';
}

const JWT_EXPIRES_IN = '7d';

// Demo credentials - only allowed in development (set DEMO_USERNAME/DEMO_PASSWORD in .env for custom values)
const DEMO_USERNAME = process.env.DEMO_USERNAME || 'test';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'password';

export async function validateCredentials(username: string, password: string): Promise<User | null> {
  // Demo credentials for development/demo only
  if (process.env.NODE_ENV !== 'production' && username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    return {
      id: '1',
      username: DEMO_USERNAME,
      name: 'Test User',
    };
  }

  // In production, users would come from a database - placeholder for future implementation
  return null;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as User;
    return decoded;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
