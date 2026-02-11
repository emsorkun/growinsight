'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

const ADMIN_DOMAIN = '@mygrowdash.com';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setLoading, login, logout } = useAuthStore();
  const didRedirect = useRef(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (didRedirect.current) return;

    const verifyAdmin = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        const result = await response.json();

        if (result.success && result.data?.user) {
          const user = result.data.user;
          login(user);

          // Double-check domain on client side
          if (!user.username?.endsWith(ADMIN_DOMAIN)) {
            didRedirect.current = true;
            router.push('/dashboard');
            return;
          }

          setAuthorized(true);
        } else {
          didRedirect.current = true;
          logout();
          router.push('/login');
        }
      } catch {
        didRedirect.current = true;
        logout();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [router, setLoading, login, logout]);

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
