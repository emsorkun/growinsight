'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart3, LineChart, MapPin, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const features = [
  {
    icon: BarChart3,
    title: 'Multi-Channel Analytics',
    description: 'Track performance across Talabat, Deliveroo, Careem, Noon, and Keeta',
  },
  {
    icon: LineChart,
    title: 'Real-time Insights',
    description: 'Get instant visibility into your food delivery operations',
  },
  {
    icon: TrendingUp,
    title: 'ROAS Tracking',
    description: 'Measure and optimize your return on ad spend',
  },
  {
    icon: MapPin,
    title: 'Location Analysis',
    description: 'Understand market share by area and cuisine',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Login failed');
        return;
      }

      login(result.data.token, result.data.user);
      router.push('/dashboard');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="flex min-h-screen">
        {/* Left Panel - Login Form */}
        <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
          <Card className="w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="mb-4 flex items-center justify-center">
                <span className="text-3xl font-bold text-[#1E40AF]">grow</span>
                <span className="text-3xl font-bold text-[#06B6D4]">insight</span>
              </div>
              <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    {...register('username')}
                    className={errors.username ? 'border-destructive' : ''}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...register('password')}
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>

                <div className="mt-6 rounded-lg bg-muted p-4">
                  <p className="text-center text-sm text-muted-foreground">
                    <span className="font-medium">Test credentials:</span>
                    <br />
                    Username: <code className="rounded bg-background px-1.5 py-0.5 font-mono text-sm">test</code>
                    <br />
                    Password: <code className="rounded bg-background px-1.5 py-0.5 font-mono text-sm">password</code>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Features */}
        <div className="hidden w-1/2 items-center justify-center bg-gradient-to-br from-blue-600/20 to-cyan-600/20 p-12 lg:flex">
          <div className="max-w-lg">
            <h2 className="mb-8 text-3xl font-bold text-white">
              Food Delivery Analytics
              <span className="block text-cyan-400">Made Simple</span>
            </h2>
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
