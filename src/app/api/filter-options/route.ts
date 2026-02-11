import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { fetchFilterOptions } from '@/lib/bigquery';

const CACHE_TAG = 'filter-options';
const REVALIDATE_SECONDS = 300; // 5 min – options change rarely

const getCachedFilterOptions = unstable_cache(async () => fetchFilterOptions(), [CACHE_TAG], {
  revalidate: REVALIDATE_SECONDS,
  tags: [CACHE_TAG],
});

export async function GET() {
  try {
    const filterOptions = await getCachedFilterOptions();
    const response = NextResponse.json({
      success: true,
      data: filterOptions,
    });
    response.headers.set(
      'Cache-Control',
      `private, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS * 2}`
    );
    return response;
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
