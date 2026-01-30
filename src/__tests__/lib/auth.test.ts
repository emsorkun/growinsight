import { describe, it, expect } from 'vitest';
import { validateCredentials, generateToken, verifyToken } from '@/lib/auth';

describe('Auth Utils', () => {
  describe('validateCredentials', () => {
    it('should return user for valid test credentials', async () => {
      const user = await validateCredentials('test', 'password');

      expect(user).toBeDefined();
      expect(user?.username).toBe('test');
      expect(user?.name).toBe('Test User');
    });

    it('should return null for invalid username', async () => {
      const user = await validateCredentials('invalid', 'password');
      expect(user).toBeNull();
    });

    it('should return null for invalid password', async () => {
      const user = await validateCredentials('test', 'wrongpassword');
      expect(user).toBeNull();
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const user = { id: '1', username: 'test', name: 'Test User' };
      const token = generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const user = { id: '1', username: 'test', name: 'Test User' };
      const token = generateToken(user);
      const verified = verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified?.username).toBe('test');
    });

    it('should return null for invalid token', () => {
      const verified = verifyToken('invalid-token');
      expect(verified).toBeNull();
    });

    it('should return null for empty token', () => {
      const verified = verifyToken('');
      expect(verified).toBeNull();
    });
  });
});
