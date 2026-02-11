import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, hashPassword } from '@/lib/auth';
import { listUsers, createUser, findUserByUsername } from '@/lib/users';
import { z } from 'zod';
import { zodErrorResponse } from '@/lib/api-utils';

const ADMIN_DOMAIN = '@mygrowdash.com';

const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required').max(255),
  name: z.string().min(1, 'Name is required').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

function getAdminUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user || !user.username.endsWith(ADMIN_DOMAIN)) return null;
  return user;
}

/** GET /api/admin/users — list all users */
export async function GET(request: NextRequest) {
  const admin = getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await listUsers();
    // Strip password hashes before sending to client
    const safeUsers = users.map(({ password_hash: _, ...rest }) => rest);
    return NextResponse.json({ success: true, data: safeUsers });
  } catch (error) {
    console.error('[api/admin/users] GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/admin/users — create a new user */
export async function POST(request: NextRequest) {
  const admin = getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { username, name, password } = parsed.data;

    // Check for duplicate username
    const existing = await findUserByUsername(username);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A user with this username already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(username, name, passwordHash);

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/users] POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
