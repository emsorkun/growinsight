import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { User } from '@/types';
import { findUserByUsername } from '@/lib/users';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is required. Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
  }
  return secret;
}

const JWT_EXPIRES_IN = '7d';

// Demo credentials - allowed in development, or in production when ENABLE_DEMO_CREDENTIALS=true
// Set DEMO_USERNAME/DEMO_PASSWORD in .env for custom values
const DEMO_USERNAME = process.env.DEMO_USERNAME || 'test';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'password';
const DEMO_ALLOWED_IN_PRODUCTION = process.env.ENABLE_DEMO_CREDENTIALS === 'true';

export async function validateCredentials(
  username: string,
  password: string
): Promise<User | null> {
  // Check registered users in the database (bcrypt-hashed passwords)
  try {
    const storedUser = await findUserByUsername(username);
    if (storedUser) {
      const isValid = await bcrypt.compare(password, storedUser.password_hash);
      if (isValid) {
        return {
          id: storedUser.id,
          username: storedUser.username,
          name: storedUser.name,
        };
      }
      return null;
    }
  } catch (error) {
    // DB unavailable — fall through to demo credentials
    console.warn('[auth] Database unavailable, falling back to demo credentials:', error);
  }

  // Fallback: demo credentials for development
  const demoAllowed = process.env.NODE_ENV !== 'production' || DEMO_ALLOWED_IN_PRODUCTION;
  if (demoAllowed && username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    return {
      id: 'demo-1',
      username: DEMO_USERNAME,
      name: 'Test User',
    };
  }

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
