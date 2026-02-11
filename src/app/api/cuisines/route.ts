import { NextRequest, NextResponse } from 'next/server';
import { fetchSalesData } from '@/lib/bigquery';
import { calculateMarketShareByCuisine } from '@/lib/data-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || undefined;
    const city = searchParams.get('city') || undefined;
    const area = searchParams.get('area') || undefined;

    const salesData = await fetchSalesData({
      months: month ? [month] : undefined,
      cities: city ? [city] : undefined,
      areas: area ? [area] : undefined,
    });
    const marketShareByCuisine = calculateMarketShareByCuisine(salesData);

    return NextResponse.json({
      success: true,
      data: marketShareByCuisine,
    });
  } catch (error) {
    console.error('Cuisines API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cuisine data' },
      { status: 500 }
    );
  }
}
