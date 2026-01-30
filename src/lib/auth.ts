import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'growinsight-secret-key';
const JWT_EXPIRES_IN = '7d';

// Test user credentials
const TEST_USERS = [
  {
    id: '1',
    username: 'test',
    password: '$2a$10$8K1p/a0dL1LXMIzFH5JN1eJYJkJl3h3aD1FKf3JaJk3k3j3k3j3k3', // 'password'
    name: 'Test User',
  },
];

export async function validateCredentials(username: string, password: string): Promise<User | null> {
  // For demo purposes, accept test/password
  if (username === 'test' && password === 'password') {
    return {
      id: '1',
      username: 'test',
      name: 'Test User',
    };
  }

  const user = TEST_USERS.find((u) => u.username === username);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
  };
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return decoded;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
