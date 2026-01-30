'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, setLoading, login, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        const result = await response.json();

        if (result.success && result.data?.user) {
          // Get token from store if available
          const state = useAuthStore.getState();
          if (state.token) {
            login(state.token, result.data.user);
          }
        } else {
          logout();
          router.push('/login');
        }
      } catch {
        logout();
        router.push('/login');
      } finally {
        setLoading(false);
        setIsChecking(false);
      }
    };

    // Check if already authenticated from stored state
    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.token) {
      verifyAuth();
    } else {
      setIsChecking(false);
      setLoading(false);
      router.push('/login');
    }
  }, [router, setLoading, login, logout]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
