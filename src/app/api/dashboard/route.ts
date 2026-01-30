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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full details server-side
    console.error('Dashboard API full error details:', {
      message: errorMessage,
      stack: errorStack,
      env: {
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hasCredentialsJson: !!process.env.GOOGLE_CREDENTIALS_JSON,
        hasCredentialsFile: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      }
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard data',
        // Include sanitized error message to help debug production issues
        details: errorMessage.includes('BigQuery configuration') 
          ? errorMessage 
          : (process.env.NODE_ENV === 'development' ? errorMessage : 'Check server logs for details')
      },
      { status: 500 }
    );
  }
}
