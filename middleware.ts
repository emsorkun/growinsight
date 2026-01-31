import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    return ''; // Will cause verification to fail
  }
  return secret || 'growinsight-secret-key';
}

/** Paths that require authentication */
const PROTECTED_PAGE_PATTERNS = [
  /^\/dashboard/,
  /^\/area-level/,
  /^\/channel-map/,
  /^\/cuisine-level/,
  /^\/missing-brands/,
  /^\/upload/,
];

/** API paths that require authentication (excludes auth and health) */
const PROTECTED_API_PATTERN = /^\/api\/(?!auth\/|health$)/;

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PATTERNS.some((pattern) => pattern.test(pathname));
}

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PATTERN.test(pathname);
}

async function verifyToken(token: string): Promise<boolean> {
  const secret = getJwtSecret();
  if (!secret) {
    return false;
  }
  try {
    const secretBytes = new TextEncoder().encode(secret);
    await jwtVerify(token, secretBytes);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip protection for public routes
  if (pathname === '/login' || pathname === '/' || pathname.startsWith('/api/auth/') || pathname === '/api/health') {
    return NextResponse.next();
  }

  // Skip static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.includes('.') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const isValid = token ? await verifyToken(token) : false;

  if (isProtectedPage(pathname)) {
    if (!isValid) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isProtectedApi(pathname)) {
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
