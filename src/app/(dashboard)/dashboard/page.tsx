'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { FilterBar } from '@/components/layout/filter-bar';
import { PieChartCard } from '@/components/charts/pie-chart';
import { BarChartCard } from '@/components/charts/bar-chart';
import { StackedBarChartCard } from '@/components/charts/stacked-bar-chart';
import { useFilterStore } from '@/store/filter-store';
import { CHANNEL_COLORS, type AggregatedData, type MonthlyMarketShare, type Channel } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/data-utils';
import { Loader2 } from 'lucide-react';

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedMonth, selectedCity, selectedArea, selectedCuisine, setOptions } = useFilterStore();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedMonth !== 'all') params.set('month', selectedMonth);
      if (selectedCity !== 'all') params.set('city', selectedCity);
      if (selectedArea !== 'all') params.set('area', selectedArea);
      if (selectedCuisine !== 'all') params.set('cuisine', selectedCuisine);

      const response = await fetch(`/api/dashboard?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result.data);
      setOptions(result.data.filterOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Set mock data for demo purposes if BigQuery fails
      setData(getMockData());
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedCity, selectedArea, selectedCuisine, setOptions]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <button onClick={fetchDashboardData} className="mt-4 text-primary underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const channelData = data?.channelData || [];
  const monthlyData = data?.monthlyData || [];

  // Prepare chart data
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
      <Header title="Dashboard" subtitle="Food delivery analytics and insights" />
      
      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <FilterBar />

        {error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Note: Using demo data. {error}
          </div>
        )}

        {/* Row 1: Pie Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <PieChartCard title="Orders by Channel" data={ordersChartData} />
          <PieChartCard title="Net Sales by Channel" data={netSalesChartData} />
        </div>

        {/* Row 2: Stacked Bar Chart */}
        <StackedBarChartCard
          title="Monthly Market Share (Orders) by Channel"
          data={monthlyData}
        />

        {/* Row 3: Spend Analysis */}
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

        {/* Row 4: ROAS and AOV */}
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

// Mock data for demo purposes
function getMockData(): DashboardData {
  const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'];

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
