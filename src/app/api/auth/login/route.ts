import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, generateToken } from '@/lib/auth';
import { z } from 'zod';
import { apiError, zodErrorResponse } from '@/lib/api-utils';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = loginSchema.parse(body);

    const user = await validateCredentials(username, password);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken(user);

    const response = NextResponse.json({
      success: true,
      data: { user, token },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodErrorResponse(error);
    }
    return apiError(error, 'Internal server error');
  }
}
