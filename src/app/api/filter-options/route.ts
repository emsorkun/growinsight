import { NextResponse } from 'next/server';
import { fetchFilterOptions } from '@/lib/bigquery';

export async function GET() {
  try {
    const filterOptions = await fetchFilterOptions();
    return NextResponse.json({
      success: true,
      data: filterOptions,
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch filter options',
      },
      { status: 500 }
    );
  }
}
