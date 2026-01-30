import { NextRequest, NextResponse } from 'next/server';
import { fetchSalesData } from '@/lib/bigquery';
import { calculateMarketShareByAreaExtended } from '@/lib/data-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || undefined;
    const city = searchParams.get('city') || undefined;
    const cuisine = searchParams.get('cuisine') || undefined;

    const salesData = await fetchSalesData({ month, city, cuisine });
    const marketShareByArea = calculateMarketShareByAreaExtended(salesData);

    return NextResponse.json({
      success: true,
      data: marketShareByArea,
    });
  } catch (error) {
    console.error('Areas API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch area data' },
      { status: 500 }
    );
  }
}
