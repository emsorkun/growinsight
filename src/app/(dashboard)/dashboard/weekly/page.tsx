'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/header';
import { FilterBar } from '@/components/layout/filter-bar';
import { useFilterStore } from '@/store/filter-store';
import { CHANNEL_COLORS, type AggregatedData, type WeeklyMarketShare, type Channel } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/data-utils';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const PieChartCard = dynamic(() => import('@/components/charts/pie-chart').then((m) => ({ default: m.PieChartCard })), {
  loading: () => <ChartSkeleton />,
});
const BarChartCard = dynamic(() => import('@/components/charts/bar-chart').then((m) => ({ default: m.BarChartCard })), {
  loading: () => <ChartSkeleton />,
});
const StackedBarChartCard = dynamic(
  () => import('@/components/charts/stacked-bar-chart').then((m) => ({ default: m.StackedBarChartCard })),
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

interface WeeklyDashboardData {
  summary: {
    totalOrders: number;
    totalNetSales: number;
    totalGrossSales: number;
    totalAdsSpend: number;
    totalDiscountSpend: number;
  };
  channelData: AggregatedData[];
  weeklyData: WeeklyMarketShare[];
  filterOptions: {
    months: string[];
    cities: string[];
    areas: string[];
    cuisines: string[];
  };
}

export default function WeeklyFiguresPage() {
  const [data, setData] = useState<WeeklyDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedCity, selectedArea, selectedCuisine, setOptions } = useFilterStore();

  const fetchWeeklyData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedCity !== 'all') params.set('city', selectedCity);
      if (selectedArea !== 'all') params.set('area', selectedArea);
      if (selectedCuisine !== 'all') params.set('cuisine', selectedCuisine);

      const response = await fetch(`/api/dashboard/weekly?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result.data);
      setOptions(result.data.filterOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(getMockWeeklyData());
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity, selectedArea, selectedCuisine, setOptions]);

  useEffect(() => {
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Weekly Figures" subtitle="Last 12 weeks" />
        <div className="flex-1 space-y-6 p-4 lg:p-6">
          <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-card p-4">
            {[1, 2, 3].map((i) => (
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

  if (error && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <button onClick={fetchWeeklyData} className="mt-4 text-primary underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const channelData = data?.channelData || [];
  const weeklyData = data?.weeklyData || [];

  // Stacked bar expects { month, marketShare }; use short week label (e.g. W45) for x-axis
  const stackedBarData = weeklyData.map((w) => ({
    month: w.weekLabel.replace(/^\d+-/, '') || w.weekLabel,
    marketShare: w.marketShare,
  }));

  const ordersChartData = channelData.map((d) => ({
    name: d.channel,
    value: d.orders,
    color: CHANNEL_COLORS[d.channel as Channel],
  }));

  const netSalesChartData = channelData.map((d) => ({
    name: d.channel,
    value: d.netSales,
    color: CHANNEL_COLORS[d.channel as Channel],
  }));

  const adsSpendVsGrossData = channelData.map((d) => ({
    name: d.channel,
    value: d.grossSales > 0 ? (d.adsSpend / d.grossSales) * 100 : 0,
    color: CHANNEL_COLORS[d.channel as Channel],
  }));

  const discountSpendVsGrossData = channelData.map((d) => ({
    name: d.channel,
    value: d.grossSales > 0 ? (d.discountSpend / d.grossSales) * 100 : 0,
    color: CHANNEL_COLORS[d.channel as Channel],
  }));

  const totalMarketingVsGrossData = channelData.map((d) => ({
    name: d.channel,
    value: d.grossSales > 0 ? ((d.adsSpend + d.discountSpend) / d.grossSales) * 100 : 0,
    color: CHANNEL_COLORS[d.channel as Channel],
  }));

  const roasData = channelData.map((d) => ({
    name: d.channel,
    value: d.roas,
    color: CHANNEL_COLORS[d.channel as Channel],
  }));

  const aovData = channelData.map((d) => ({
    name: d.channel,
    value: d.aov,
    color: CHANNEL_COLORS[d.channel as Channel],
  }));

  return (
    <div className="flex flex-col">
      <Header title="Weekly Figures" subtitle="Last 12 weeks" />

      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <FilterBar hideMonth />

        {error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Note: Using demo data. {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <PieChartCard title="Orders by Channel" data={ordersChartData} />
          <PieChartCard title="Net Sales by Channel" data={netSalesChartData} />
        </div>

        <StackedBarChartCard
          title="Weekly Market Share (Orders) by Channel"
          data={stackedBarData}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <BarChartCard
            title="Ads Spend vs Gross Sales"
            data={adsSpendVsGrossData}
            yAxisLabel="%"
            formatValue={(v) => formatPercentage(v)}
          />
          <BarChartCard
            title="Discount Spend vs Gross Sales"
            data={discountSpendVsGrossData}
            yAxisLabel="%"
            formatValue={(v) => formatPercentage(v)}
          />
          <BarChartCard
            title="Total Marketing vs Gross Sales"
            data={totalMarketingVsGrossData}
            yAxisLabel="%"
            formatValue={(v) => formatPercentage(v)}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <BarChartCard
            title="ROAS by Channel"
            data={roasData}
            formatValue={(v) => v.toFixed(2)}
          />
          <BarChartCard
            title="Average Order Value by Channel"
            data={aovData}
            formatValue={(v) => formatCurrency(v)}
          />
        </div>
      </div>
    </div>
  );
}

function getMockWeeklyData(): WeeklyDashboardData {
  const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];
  const weekLabels = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (11 - i) * 7);
    const week = Math.ceil(d.getDate() / 7);
    const year = d.getFullYear();
    return `${year}-W${String(week).padStart(2, '0')}`;
  });

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

  const weeklyData: WeeklyMarketShare[] = weekLabels.map((weekLabel) => {
    let remaining = 100;
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

    return { weekLabel, weekStartDate: weekLabel, marketShare };
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
    weeklyData,
    filterOptions: {
      months: [],
      cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
      areas: ['Al Barsha', 'JBR', 'Marina', 'Downtown', 'Business Bay', 'DIFC'],
      cuisines: ['American', 'Asian', 'Indian', 'Italian', 'Middle Eastern', 'Mexican'],
    },
  };
}
