import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, hashPassword } from '@/lib/auth';
import { findUserById, updateUser, updateUserPassword, deleteUser } from '@/lib/users';
import { z } from 'zod';
import { zodErrorResponse } from '@/lib/api-utils';

const ADMIN_DOMAIN = '@mygrowdash.com';

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128).optional(),
});

function getAdminUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user || !user.username.endsWith(ADMIN_DOMAIN)) return null;
  return user;
}

/** PATCH /api/admin/users/[id] — update name, active status, or password */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await findUserById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { name, is_active, password } = parsed.data;

    // Update name / active status
    if (name !== undefined || is_active !== undefined) {
      await updateUser(id, { name, is_active });
    }

    // Update password if provided
    if (password) {
      const hash = await hashPassword(password);
      await updateUserPassword(id, hash);
    }

    const updated = await findUserById(id);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'User not found after update' },
        { status: 404 }
      );
    }

    // Strip password hash before sending to client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeUser } = updated;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error) {
    console.error('[api/admin/users] PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE /api/admin/users/[id] — permanently delete a user */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Prevent deleting yourself
    if (admin.id === id) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const deleted = await deleteUser(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/admin/users] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
