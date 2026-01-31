'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, SidebarProvider } from '@/components/layout/sidebar';
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

    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.token) {
      verifyAuth();
    } else {
      setIsChecking(false);
      setLoading(false);
      router.push('/login');
    }
  }, [router, setLoading, login, logout]);

  if (!isAuthenticated && !isChecking) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
        {isChecking ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
          children
        )}
        </main>
      </div>
    </SidebarProvider>
  );
}
