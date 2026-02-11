import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_DOMAIN = '@mygrowdash.com';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[middleware] JWT_SECRET environment variable is not set');
    return ''; // Will cause verification to fail — all protected routes return 401
  }
  return secret;
}

/** Paths that require authentication */
const PROTECTED_PAGE_PATTERNS = [
  /^\/dashboard/,
  /^\/area-level/,
  /^\/channel-map/,
  /^\/cuisine-level/,
  /^\/missing-brands/,
  /^\/upload/,
  /^\/admin/,
];

/** API paths that require authentication (excludes auth, health, and tracking) */
const PROTECTED_API_PATTERN = /^\/api\/(?!auth\/|health$|tracking$)/;

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PATTERNS.some((pattern) => pattern.test(pathname));
}

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PATTERN.test(pathname);
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}

interface TokenPayload {
  id: string;
  username: string;
  name: string;
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  const secret = getJwtSecret();
  if (!secret) {
    return null;
  }
  try {
    const secretBytes = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretBytes);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip protection for public routes
  if (pathname === '/login' || pathname === '/' || pathname.startsWith('/api/auth/') || pathname === '/api/health') {
    return NextResponse.next();
  }

  // Allow tracking endpoint without full auth (it reads token internally)
  if (pathname === '/api/tracking') {
    return NextResponse.next();
  }

  // Skip static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.includes('.') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const user = token ? await verifyToken(token) : null;
  const isValid = !!user;

  // Admin routes: require both authentication AND @mygrowdash.com domain
  if (isAdminRoute(pathname)) {
    if (!isValid) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!user!.username.endsWith(ADMIN_DOMAIN)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      // Non-admin users get redirected to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

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
