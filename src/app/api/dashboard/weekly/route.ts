import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { fetchWeeklySalesData, fetchFilterOptions } from '@/lib/bigquery';
import { aggregateWeeklyByChannel, calculateWeeklyMarketShare } from '@/lib/data-utils';

const WEEKLY_REVALIDATE = 60;

async function getWeeklyDashboardData(cities?: string[], areas?: string[], cuisines?: string[]) {
  const [weeklyData, filterOptions] = await Promise.all([
    fetchWeeklySalesData({ cities, areas, cuisines }),
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
    const cityParam = searchParams.get('city') || '';
    const areaParam = searchParams.get('area') || '';
    const cuisineParam = searchParams.get('cuisine') || '';

    const cities = cityParam ? cityParam.split(',').filter(Boolean) : undefined;
    const areas = areaParam ? areaParam.split(',').filter(Boolean) : undefined;
    const cuisines = cuisineParam ? cuisineParam.split(',').filter(Boolean) : undefined;

    const getCachedWeekly = unstable_cache(
      () => getWeeklyDashboardData(cities, areas, cuisines),
      ['dashboard-weekly', cityParam, areaParam, cuisineParam],
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
