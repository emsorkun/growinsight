import { NextRequest, NextResponse } from 'next/server';
import { fetchSalesData } from '@/lib/bigquery';
import { calculateCuisineDetailByArea } from '@/lib/data-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const area = searchParams.get('area');
    const month = searchParams.get('month') || undefined;
    const city = searchParams.get('city') || undefined;

    if (!area) {
      return NextResponse.json(
        { success: false, error: 'Area parameter is required' },
        { status: 400 }
      );
    }

    const salesData = await fetchSalesData({
      months: month ? [month] : undefined,
      cities: city ? [city] : undefined,
    });
    const cuisineDetails = calculateCuisineDetailByArea(salesData, area);

    return NextResponse.json({
      success: true,
      data: cuisineDetails,
    });
  } catch (error) {
    console.error('Area Cuisines API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cuisine details for area' },
      { status: 500 }
    );
  }
}
