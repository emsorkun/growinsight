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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch missing brands',
        details: errorMessage.includes('BigQuery configuration') 
          ? errorMessage 
          : (process.env.NODE_ENV === 'development' ? errorMessage : 'Check server logs for details')
      },
      { status: 500 }
    );
  }
}
