'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  ArrowLeft,
  Activity,
  Users,
  Eye,
  LogIn,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Check,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdminEventsResponse, TrackingEvent } from '@/types';

// ─── Types ────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  username: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type ActiveTab = 'overview' | 'logs' | 'users';

// ─── Constants ────────────────────────────────────────────────
const EVENT_TYPE_COLORS: Record<string, string> = {
  login: '#10B981',
  logout: '#EF4444',
  page_view: '#3B82F6',
  filter_change: '#F59E0B',
  button_click: '#8B5CF6',
};

// ─── Small components ─────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: typeof Activity;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-lg p-3" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  const color = EVENT_TYPE_COLORS[type] ?? '#6B7280';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {type.replace('_', ' ')}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Disabled
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ─── Users Tab component ──────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create user form
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Reset password
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      } else {
        setError(json.error);
      }
    } catch {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async () => {
    if (!newUsername || !newName || !newPassword) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, name: newName, password: newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setShowCreate(false);
        setNewUsername('');
        setNewName('');
        setNewPassword('');
        fetchUsers();
      } else {
        setError(json.error);
      }
    } catch {
      setError('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateName = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingId(null);
        fetchUsers();
      } else {
        setError(json.error);
      }
    } catch {
      setError('Failed to update user');
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
      } else {
        setError(json.error);
      }
    } catch {
      setError('Failed to update user');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!resetPassword || resetPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setResetId(null);
        setResetPassword('');
      } else {
        setError(json.error);
      }
    } catch {
      setError('Failed to reset password');
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Delete user "${user.name}" (${user.username})? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
      } else {
        setError(json.error);
      }
    } catch {
      setError('Failed to delete user');
    }
  };

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users ({users.length})</h2>
          <p className="text-xs text-muted-foreground">Manage application users and credentials</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? (
            <>
              <X className="mr-2 h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </>
          )}
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-username">Username (email)</Label>
                <Input
                  id="new-username"
                  placeholder="user@example.com"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-name">Display Name</Label>
                <Input
                  id="new-name"
                  placeholder="John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Min 4 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <Button className="mt-4" onClick={handleCreate} disabled={creating}>
              {creating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create User
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
                    Username
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        {editingId === user.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 w-40"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateName(user.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-600"
                              onClick={() => handleUpdateName(user.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-medium">{user.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {user.username}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge active={user.is_active} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit name */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit name"
                            onClick={() => {
                              setEditingId(user.id);
                              setEditName(user.name);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {/* Reset password */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Reset password"
                            onClick={() => setResetId(resetId === user.id ? null : user.id)}
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          {/* Toggle active */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${user.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                            title={user.is_active ? 'Disable user' : 'Enable user'}
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.is_active ? (
                              <UserX className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            title="Delete user"
                            onClick={() => handleDelete(user)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Inline password reset */}
                        {resetId === user.id && (
                          <div className="mt-2 flex items-center gap-2">
                            <Input
                              type="password"
                              placeholder="New password"
                              value={resetPassword}
                              onChange={(e) => setResetPassword(e.target.value)}
                              className="h-8 w-40 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleResetPassword(user.id);
                                if (e.key === 'Escape') {
                                  setResetId(null);
                                  setResetPassword('');
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleResetPassword(user.id)}
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                setResetId(null);
                                setResetPassword('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Event filters
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (eventTypeFilter && eventTypeFilter !== 'all') params.set('event_type', eventTypeFilter);
      if (usernameFilter) params.set('username', usernameFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/admin/events?${params}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, [eventTypeFilter, usernameFilter, page]);

  useEffect(() => {
    if (activeTab !== 'users') {
      fetchEvents();
    }
  }, [fetchEvents, activeTab]);

  const summary = data?.summary;
  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">
              Users, activity logs, and usage analytics
            </p>
          </div>
          {activeTab !== 'users' && (
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 lg:p-6">
        {/* Summary Cards (only for tracking tabs) */}
        {activeTab !== 'users' && summary && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Events"
              value={summary.totalEvents.toLocaleString()}
              icon={Activity}
              color="#3B82F6"
            />
            <StatCard
              title="Unique Users"
              value={summary.uniqueUsers}
              icon={Users}
              color="#10B981"
            />
            <StatCard
              title="Page Views"
              value={(summary.eventsByType['page_view'] ?? 0).toLocaleString()}
              icon={Eye}
              color="#8B5CF6"
            />
            <StatCard
              title="Logins"
              value={(summary.eventsByType['login'] ?? 0).toLocaleString()}
              icon={LogIn}
              color="#F59E0B"
            />
          </div>
        )}

        {/* Tab Switcher */}
        <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted p-1">
          {(['overview', 'logs', 'users'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'overview' ? 'Visual Reports' : tab === 'logs' ? 'Raw Logs' : 'Users'}
            </button>
          ))}
        </div>

        {/* ── Visual Reports Tab ────────────────────────────── */}
        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            {/* Events Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Events Over Time (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.eventsByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={summary.eventsByDay}>
                      <defs>
                        <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tickFormatter={formatShortDate} className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        labelFormatter={(label) => formatShortDate(String(label))}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#3B82F6"
                        fill="url(#colorEvents)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No event data yet
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Events by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Events by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(summary.eventsByType).length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={Object.entries(summary.eventsByType).map(([name, value]) => ({
                            name: name.replace('_', ' '),
                            value,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {Object.keys(summary.eventsByType).map((type) => (
                            <Cell key={type} fill={EVENT_TYPE_COLORS[type] ?? '#6B7280'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.topUsers.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={summary.topUsers} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Viewed Pages</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.topPages.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={summary.topPages}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="page" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Raw Logs Tab ──────────────────────────────────── */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="flex flex-wrap items-end gap-4 p-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Event Type</label>
                  <Select
                    value={eventTypeFilter}
                    onValueChange={(v) => {
                      setEventTypeFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                      <SelectItem value="page_view">Page View</SelectItem>
                      <SelectItem value="filter_change">Filter Change</SelectItem>
                      <SelectItem value="button_click">Button Click</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Username</label>
                  <Input
                    placeholder="Search by username..."
                    value={usernameFilter}
                    onChange={(e) => {
                      setUsernameFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-[200px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Events Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
                          Time
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
                          Event
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
                          User
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
                          Page
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-muted-foreground">
                            <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />
                            Loading...
                          </td>
                        </tr>
                      ) : data?.events.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-muted-foreground">
                            No events found
                          </td>
                        </tr>
                      ) : (
                        data?.events.map((event: TrackingEvent) => (
                          <tr
                            key={event.id}
                            className="border-b border-border last:border-0 hover:bg-muted/30"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                              {formatDate(event.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <EventTypeBadge type={event.event_type} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{event.user_name || '—'}</span>
                                <span className="text-xs text-muted-foreground">
                                  {event.username || 'anonymous'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono">{event.page || '—'}</td>
                            <td className="max-w-[300px] truncate px-4 py-3 text-xs text-muted-foreground">
                              {Object.keys(event.metadata ?? {}).length > 0
                                ? JSON.stringify(event.metadata)
                                : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      Page {page} of {totalPages} ({data?.total ?? 0} events)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Users Tab ────────────────────────────────────── */}
        {activeTab === 'users' && <UsersTab />}
      </main>
    </div>
  );
}
