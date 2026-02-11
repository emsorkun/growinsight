import { NextRequest, NextResponse } from 'next/server';
import { fetchSalesData } from '@/lib/bigquery';
import { calculateMarketShareByAreaExtended } from '@/lib/data-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || undefined;
    const city = searchParams.get('city') || undefined;
    const cuisine = searchParams.get('cuisine') || undefined;

    const salesData = await fetchSalesData({
      months: month ? [month] : undefined,
      cities: city ? [city] : undefined,
      cuisines: cuisine ? [cuisine] : undefined,
    });
    const marketShareByArea = calculateMarketShareByAreaExtended(salesData);

    return NextResponse.json({
      success: true,
      data: marketShareByArea,
    });
  } catch (error) {
    console.error('Areas API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch area data',
        details: errorMessage.includes('BigQuery configuration')
          ? errorMessage
          : process.env.NODE_ENV === 'development'
            ? errorMessage
            : 'Check server logs for details',
      },
      { status: 500 }
    );
  }
}
