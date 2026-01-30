import { NextResponse } from 'next/server';
import { fetchMissingBrands } from '@/lib/bigquery';

export async function GET() {
  try {
    const missingBrands = await fetchMissingBrands();

    return NextResponse.json({
      success: true,
      data: missingBrands,
    });
  } catch (error) {
    console.error('Missing brands API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch missing brands' },
      { status: 500 }
    );
  }
}
