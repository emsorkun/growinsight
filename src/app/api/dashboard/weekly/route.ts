import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { fetchWeeklySalesData, fetchFilterOptions } from '@/lib/bigquery';
import { aggregateWeeklyByChannel, calculateWeeklyMarketShare } from '@/lib/data-utils';

const WEEKLY_REVALIDATE = 60;

async function getWeeklyDashboardData(city?: string, area?: string, cuisine?: string) {
  const [weeklyData, filterOptions] = await Promise.all([
    fetchWeeklySalesData({ city, area, cuisine }),
    fetchFilterOptions(),
  ]);

  const channelData = aggregateWeeklyByChannel(weeklyData);
  const weeklyMarketShare = calculateWeeklyMarketShare(weeklyData);

  const totalOrders = channelData.reduce((sum, d) => sum + d.orders, 0);
  const totalNetSales = channelData.reduce((sum, d) => sum + d.netSales, 0);
  const totalGrossSales = channelData.reduce((sum, d) => sum + d.grossSales, 0);
  const totalAdsSpend = channelData.reduce((sum, d) => sum + d.adsSpend, 0);
  const totalDiscountSpend = channelData.reduce((sum, d) => sum + d.discountSpend, 0);

  return {
    summary: {
      totalOrders,
      totalNetSales,
      totalGrossSales,
      totalAdsSpend,
      totalDiscountSpend,
    },
    channelData,
    weeklyData: weeklyMarketShare,
    filterOptions,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city') || '';
    const area = searchParams.get('area') || '';
    const cuisine = searchParams.get('cuisine') || '';

    const getCachedWeekly = unstable_cache(
      () => getWeeklyDashboardData(city || undefined, area || undefined, cuisine || undefined),
      ['dashboard-weekly', city, area, cuisine],
      { revalidate: WEEKLY_REVALIDATE }
    );

    const data = await getCachedWeekly();

    const response = NextResponse.json({ success: true, data });
    response.headers.set(
      'Cache-Control',
      `private, s-maxage=${WEEKLY_REVALIDATE}, stale-while-revalidate=${WEEKLY_REVALIDATE * 2}`
    );
    return response;
  } catch (error) {
    console.error('Dashboard weekly API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weekly dashboard data',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
