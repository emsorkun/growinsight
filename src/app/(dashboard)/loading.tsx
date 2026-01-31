import { Loader2 } from 'lucide-react';
import { Sidebar, SidebarProvider } from '@/components/layout/sidebar';

export default function DashboardLoading() {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
