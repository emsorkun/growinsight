import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { fetchSalesData, fetchFilterOptions } from '@/lib/bigquery';
import { aggregateByChannel, calculateMonthlyMarketShare } from '@/lib/data-utils';
import { apiError } from '@/lib/api-utils';

const DASHBOARD_REVALIDATE = 60; // 1 min – balance freshness and speed

async function getDashboardData(month?: string, city?: string, area?: string, cuisine?: string) {
  const [salesData, filterOptions] = await Promise.all([
    fetchSalesData({ month, city, area, cuisine }),
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
    const month = searchParams.get('month') || '';
    const city = searchParams.get('city') || '';
    const area = searchParams.get('area') || '';
    const cuisine = searchParams.get('cuisine') || '';

    const getCachedDashboard = unstable_cache(
      () =>
        getDashboardData(
          month || undefined,
          city || undefined,
          area || undefined,
          cuisine || undefined
        ),
      ['dashboard', month, city, area, cuisine],
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
      exposeMessage: !!(
        error instanceof Error &&
        error.message.includes('BigQuery configuration')
      ),
    });
  }
}
