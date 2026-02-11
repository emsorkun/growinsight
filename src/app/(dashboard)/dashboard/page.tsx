'use client';

import { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { FilterBar } from '@/components/layout/filter-bar';
import { useFilterStore } from '@/store/filter-store';
import { type AggregatedData, type Channel, type MonthlyMarketShare } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/data-utils';
import { getDashboardChartData } from '@/lib/chart-utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const PieChartCard = dynamic(
  () => import('@/components/charts/pie-chart').then((m) => ({ default: m.PieChartCard })),
  {
    loading: () => <ChartSkeleton />,
  }
);
const BarChartCard = dynamic(
  () => import('@/components/charts/bar-chart').then((m) => ({ default: m.BarChartCard })),
  {
    loading: () => <ChartSkeleton />,
  }
);
const StackedBarChartCard = dynamic(
  () =>
    import('@/components/charts/stacked-bar-chart').then((m) => ({
      default: m.StackedBarChartCard,
    })),
  { loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-[280px] animate-pulse rounded bg-muted/50" />
      </CardContent>
    </Card>
  );
}

interface DashboardData {
  summary: {
    totalOrders: number;
    totalNetSales: number;
    totalGrossSales: number;
    totalAdsSpend: number;
    totalDiscountSpend: number;
  };
  channelData: AggregatedData[];
  monthlyData: MonthlyMarketShare[];
  filterOptions: {
    months: string[];
    cities: string[];
    areas: string[];
    cuisines: string[];
  };
}

async function fetchDashboardData(filters: {
  months: string[];
  cities: string[];
  areas: string[];
  cuisines: string[];
}): Promise<DashboardData> {
  const params = new URLSearchParams();
  if (filters.months.length > 0) params.set('month', filters.months.join(','));
  if (filters.cities.length > 0) params.set('city', filters.cities.join(','));
  if (filters.areas.length > 0) params.set('area', filters.areas.join(','));
  if (filters.cuisines.length > 0) params.set('cuisine', filters.cuisines.join(','));

  const response = await fetch(`/api/dashboard?${params.toString()}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch data');
  }
  return result.data;
}

export default function DashboardPage() {
  const { selectedMonths, selectedCities, selectedAreas, selectedCuisines, setOptions } =
    useFilterStore();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard', selectedMonths, selectedCities, selectedAreas, selectedCuisines],
    queryFn: () =>
      fetchDashboardData({
        months: selectedMonths,
        cities: selectedCities,
        areas: selectedAreas,
        cuisines: selectedCuisines,
      }),
    retry: 1,
  });

  const demoData = useMemo(() => (isError ? getMockData() : null), [isError]);
  const displayData = data ?? demoData;
  const isDemoMode = isError && !!displayData;

  useEffect(() => {
    if (displayData?.filterOptions) {
      setOptions(displayData.filterOptions);
    }
  }, [displayData?.filterOptions, setOptions]);

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Dashboard" subtitle="Food delivery analytics and insights" />
        <div className="flex-1 space-y-6 p-4 lg:p-6">
          <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-card p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                <div className="h-9 w-[160px] animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <ChartSkeleton />
          <div className="grid gap-6 md:grid-cols-3">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (isError && !displayData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <button onClick={() => refetch()} className="mt-4 text-primary underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const channelData = displayData?.channelData ?? [];
  const monthlyData = displayData?.monthlyData ?? [];
  const chartData = getDashboardChartData(channelData);

  return (
    <div className="flex flex-col">
      <Header title="Dashboard" subtitle="Food delivery analytics and insights" />

      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <FilterBar />

        {isDemoMode && (
          <div
            className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100"
            role="alert"
          >
            <strong>Demo mode</strong> – Real data is unavailable. You are viewing sample data.
            Error: {error instanceof Error ? error.message : 'Unknown error'}{' '}
            <button onClick={() => refetch()} className="ml-2 underline">
              Try again
            </button>
          </div>
        )}

        {/* Row 1: Pie Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <PieChartCard title="Orders by Channel" data={chartData.orders} />
          <PieChartCard title="Net Sales by Channel" data={chartData.netSales} />
        </div>

        {/* Row 2: Stacked Bar Chart */}
        <StackedBarChartCard title="Monthly Market Share (Orders) by Channel" data={monthlyData} />

        {/* Row 3: Spend Analysis */}
        <div className="grid gap-6 md:grid-cols-3">
          <BarChartCard
            title="Ads Spend vs Gross Sales"
            data={chartData.adsSpendVsGross}
            yAxisLabel="%"
            formatValue={(v) => formatPercentage(v)}
          />
          <BarChartCard
            title="Discount Spend vs Gross Sales"
            data={chartData.discountSpendVsGross}
            yAxisLabel="%"
            formatValue={(v) => formatPercentage(v)}
          />
          <BarChartCard
            title="Total Marketing vs Gross Sales"
            data={chartData.totalMarketingVsGross}
            yAxisLabel="%"
            formatValue={(v) => formatPercentage(v)}
          />
        </div>

        {/* Row 4: ROAS and AOV */}
        <div className="grid gap-6 md:grid-cols-3">
          <BarChartCard
            title="ROAS by Channel"
            data={chartData.roas}
            formatValue={(v) => v.toFixed(2)}
          />
          <BarChartCard
            title="Avg Basket Value by Channel"
            data={chartData.aov}
            formatValue={(v) => formatCurrency(v)}
          />
          <BarChartCard
            title="Avg Order Value by Channel"
            data={chartData.aovAfterDiscount}
            formatValue={(v) => formatCurrency(v)}
          />
        </div>
      </div>
    </div>
  );
}

// Mock data for demo purposes
function getMockData(): DashboardData {
  const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];
  const months = [
    '2025-01',
    '2025-02',
    '2025-03',
    '2025-04',
    '2025-05',
    '2025-06',
    '2025-07',
    '2025-08',
    '2025-09',
    '2025-10',
  ];

  const channelData: AggregatedData[] = channels.map((channel, index) => {
    const baseOrders = [50000, 30000, 25000, 15000, 10000][index];
    const orders = baseOrders + Math.floor(Math.random() * 10000);
    const grossSales = orders * (50 + Math.random() * 30);
    const netSales = grossSales * 0.85;
    const adsSpend = grossSales * (0.05 + Math.random() * 0.05);
    const discountSpend = grossSales * (0.08 + Math.random() * 0.05);
    const adsReturn = adsSpend * (3 + Math.random() * 4);

    return {
      channel,
      orders,
      netSales,
      grossSales,
      adsSpend,
      discountSpend,
      adsReturn,
      roas: adsSpend > 0 ? adsReturn / adsSpend : 0,
      aov: orders > 0 ? grossSales / orders : 0,
    };
  });

  const monthlyData: MonthlyMarketShare[] = months.map((month) => {
    const total = 100;
    let remaining = total;
    const marketShare: Record<Channel, number> = {} as Record<Channel, number>;

    channels.forEach((channel, index) => {
      if (index === channels.length - 1) {
        marketShare[channel] = remaining;
      } else {
        const base = [40, 25, 20, 10, 5][index];
        const share = base + (Math.random() - 0.5) * 10;
        marketShare[channel] = Math.max(0, Math.min(remaining, share));
        remaining -= marketShare[channel];
      }
    });

    return { month, marketShare };
  });

  return {
    summary: {
      totalOrders: channelData.reduce((sum, d) => sum + d.orders, 0),
      totalNetSales: channelData.reduce((sum, d) => sum + d.netSales, 0),
      totalGrossSales: channelData.reduce((sum, d) => sum + d.grossSales, 0),
      totalAdsSpend: channelData.reduce((sum, d) => sum + d.adsSpend, 0),
      totalDiscountSpend: channelData.reduce((sum, d) => sum + d.discountSpend, 0),
    },
    channelData,
    monthlyData,
    filterOptions: {
      months,
      cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
      areas: ['Al Barsha', 'JBR', 'Marina', 'Downtown', 'Business Bay', 'DIFC'],
      cuisines: ['American', 'Asian', 'Indian', 'Italian', 'Middle Eastern', 'Mexican'],
    },
  };
}
