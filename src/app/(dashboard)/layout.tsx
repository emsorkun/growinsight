'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, SidebarProvider } from '@/components/layout/sidebar';
import { FilterOptionsProvider } from '@/components/providers/filter-options-provider';
import { useAuthStore } from '@/store/auth-store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setLoading, login, logout } = useAuthStore();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (didRedirect.current) return;

    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        const result = await response.json();

        if (result.success && result.data?.user) {
          const token = result.data.token ?? useAuthStore.getState().token;
          if (token) {
            login(token, result.data.user);
          }
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

    verifyAuth();
  }, [router, setLoading, login, logout]);

  return (
    <SidebarProvider>
      <FilterOptionsProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </FilterOptionsProvider>
    </SidebarProvider>
  );
}
