import { NextRequest, NextResponse } from 'next/server';
import { fetchSalesData, fetchFilterOptions } from '@/lib/bigquery';
import { aggregateByChannel, calculateMonthlyMarketShare } from '@/lib/data-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || undefined;
    const city = searchParams.get('city') || undefined;
    const area = searchParams.get('area') || undefined;
    const cuisine = searchParams.get('cuisine') || undefined;

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

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
