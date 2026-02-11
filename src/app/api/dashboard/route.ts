import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { fetchSalesData, fetchFilterOptions } from '@/lib/bigquery';
import { aggregateByChannel, calculateMonthlyMarketShare } from '@/lib/data-utils';
import { apiError } from '@/lib/api-utils';

const DASHBOARD_REVALIDATE = 60; // 1 min – balance freshness and speed

async function getDashboardData(
  months?: string[],
  cities?: string[],
  areas?: string[],
  cuisines?: string[]
) {
  const [salesData, filterOptions] = await Promise.all([
    fetchSalesData({ months, cities, areas, cuisines }),
    fetchFilterOptions(),
  ]);

  const channelData = aggregateByChannel(salesData);
  const monthlyData = calculateMonthlyMarketShare(salesData);

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
    monthlyData,
    filterOptions,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get('month') || '';
    const cityParam = searchParams.get('city') || '';
    const areaParam = searchParams.get('area') || '';
    const cuisineParam = searchParams.get('cuisine') || '';

    const months = monthParam ? monthParam.split(',').filter(Boolean) : undefined;
    const cities = cityParam ? cityParam.split(',').filter(Boolean) : undefined;
    const areas = areaParam ? areaParam.split(',').filter(Boolean) : undefined;
    const cuisines = cuisineParam ? cuisineParam.split(',').filter(Boolean) : undefined;

    const getCachedDashboard = unstable_cache(
      () => getDashboardData(months, cities, areas, cuisines),
      ['dashboard', monthParam, cityParam, areaParam, cuisineParam],
      { revalidate: DASHBOARD_REVALIDATE }
    );

    const data = await getCachedDashboard();

    const response = NextResponse.json({
      success: true,
      data,
    });
    response.headers.set(
      'Cache-Control',
      `private, s-maxage=${DASHBOARD_REVALIDATE}, stale-while-revalidate=${DASHBOARD_REVALIDATE * 2}`
    );
    return response;
  } catch (error) {
    return apiError(error, 'Failed to fetch dashboard data', {
      exposeMessage: !!(error instanceof Error && error.message.includes('BigQuery configuration')),
    });
  }
}
