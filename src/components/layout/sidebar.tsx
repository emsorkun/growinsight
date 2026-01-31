'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  UtensilsCrossed,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Map,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, useEffect, createContext, useContext } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Weekly Figures', href: '/dashboard/weekly', icon: CalendarDays },
  { name: 'Area Level', href: '/area-level', icon: MapPin },
  { name: 'Channel Map', href: '/channel-map', icon: Map },
  { name: 'Cuisine Level', href: '/cuisine-level', icon: UtensilsCrossed },
];

// Context for sidebar state
const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

function Logo({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <Link href="/dashboard" className={cn("flex items-center py-6", isCollapsed ? "px-2 justify-center" : "px-4")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/growinsight-square.png"
        alt="GrowInsight"
        className={cn("h-8 w-8", isCollapsed ? "block" : "hidden")}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/growinsight-logo.png"
        alt="GrowInsight"
        className={cn("h-9 w-auto", isCollapsed ? "hidden" : "block")}
      />
    </Link>
  );
}

function NavItems({ onItemClick, isCollapsed }: { onItemClick?: () => void; isCollapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            title={isCollapsed ? item.name : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isCollapsed && 'justify-center px-2',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function UserInfo({ isCollapsed }: { isCollapsed: boolean }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    logout();
    router.push('/login');
  };

  if (isCollapsed) {
    return (
      <div className="border-t border-sidebar-border p-2">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-sidebar-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.name || 'User'}</span>
            <span className="text-xs text-muted-foreground">@{user?.username || 'user'}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  const toggleCollapsed = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem('sidebar-collapsed', String(newValue));
  };

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, setIsCollapsed, toggleCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

/** Standard shadcn placement: trigger in header (main), not inside sidebar */
export function SidebarTrigger() {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleCollapsed}
      className="hidden lg:flex h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </Button>
  );
}

export function Sidebar() {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        'hidden lg:flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <Logo isCollapsed={isCollapsed} />
      <NavItems isCollapsed={isCollapsed} />
      <UserInfo isCollapsed={isCollapsed} />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <Logo isCollapsed={false} />
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <NavItems onItemClick={() => setOpen(false)} isCollapsed={false} />
          <UserInfo isCollapsed={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
