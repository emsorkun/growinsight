import { NextRequest, NextResponse } from 'next/server';
import { fetchSalesData } from '@/lib/bigquery';
import { calculateAreaMonthlyTrend } from '@/lib/data-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const area = searchParams.get('area');
    const city = searchParams.get('city') || undefined;
    const cuisine = searchParams.get('cuisine') || undefined;

    if (!area) {
      return NextResponse.json(
        { success: false, error: 'Area parameter is required' },
        { status: 400 }
      );
    }

    const salesData = await fetchSalesData({ city, cuisine });
    const monthlyTrend = calculateAreaMonthlyTrend(salesData, area);

    return NextResponse.json({
      success: true,
      data: monthlyTrend,
    });
  } catch (error) {
    console.error('Area Trends API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trends for area' },
      { status: 500 }
    );
  }
}
