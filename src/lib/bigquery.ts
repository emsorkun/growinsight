import { BigQuery } from '@google-cloud/bigquery';
import type { SalesData } from '@/types';

let bigquery: BigQuery | null = null;

function getBigQueryClient(): BigQuery {
  if (!bigquery) {
    bigquery = new BigQuery({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }
  return bigquery;
}

export async function fetchSalesData(filters?: {
  month?: string;
  city?: string;
  area?: string;
  cuisine?: string;
}): Promise<SalesData[]> {
  const client = getBigQueryClient();

  let whereClause = `WHERE br.country_id = 1 AND SPLIT(s.month_year, "-")[OFFSET(1)] = '2025'`;

  if (filters?.month && filters.month !== 'all') {
    whereClause += ` AND SPLIT(s.month_year, "-")[OFFSET(0)] = '${filters.month}'`;
  }
  if (filters?.city && filters.city !== 'all') {
    whereClause += ` AND gl.clean_city = '${filters.city}'`;
  }
  if (filters?.area && filters.area !== 'all') {
    whereClause += ` AND gl.clean_area = '${filters.area}'`;
  }
  if (filters?.cuisine && filters.cuisine !== 'all') {
    whereClause += ` AND cu.name = '${filters.cuisine}'`;
  }

  const query = `
    SELECT
      s.channel AS channel,
      gl.clean_city AS city,
      gl.clean_area AS area,
      s.month_year AS monthYear,
      SPLIT(s.month_year, "-")[OFFSET(0)] AS month,
      SPLIT(s.month_year, "-")[OFFSET(1)] AS year,
      gl.location_name AS location,
      cu.name AS cuisine,
      s.total_orders_count AS orders,
      s.net_revenue AS netSales,
      s.gross_revenue AS grossSales,
      COALESCE(a.spend, 0) AS adsSpend,
      s.discount AS discountSpend,
      COALESCE(a.return, 0) AS adsReturn
    FROM \`vpc-host-prod-fn204-ex958.aisha.l4_legacy_monthly_sales\` AS s
    LEFT JOIN \`vpc-host-prod-fn204-ex958.aisha.l3_legacy_monthly_ad_campaigns\` AS a
      ON s.brand_id = a.brand_id
      AND s.branch_id = a.branch_id
      AND s.channel = a.channel
      AND s.month_year = a.month_year
    LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_branches\` AS b
      ON CAST(s.branch_id AS INT64) = b.id
    LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_brands\` AS br
      ON CAST(s.brand_id AS INT64) = br.id
    LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_cuisines\` AS cu
      ON CAST(br.cuisine_id AS INT64) = cu.id
    LEFT JOIN \`vpc-host-prod-fn204-ex958.growinsight.l3_growinsight_locations\` AS gl
      ON b.location_id = gl.location_id
    ${whereClause}
    ORDER BY year, month, channel, city
  `;

  try {
    const [rows] = await client.query({ query });
    return rows as SalesData[];
  } catch (error) {
    console.error('BigQuery error:', error);
    throw error;
  }
}

export async function fetchFilterOptions(): Promise<{
  months: string[];
  cities: string[];
  areas: string[];
  cuisines: string[];
}> {
  const client = getBigQueryClient();

  const queries = {
    months: `
      SELECT DISTINCT SPLIT(s.month_year, "-")[OFFSET(0)] AS month
      FROM \`vpc-host-prod-fn204-ex958.aisha.l4_legacy_monthly_sales\` AS s
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_brands\` AS br
        ON CAST(s.brand_id AS INT64) = br.id
      WHERE br.country_id = 1 AND SPLIT(s.month_year, "-")[OFFSET(1)] = '2025'
      ORDER BY month
    `,
    cities: `
      SELECT DISTINCT gl.clean_city AS city
      FROM \`vpc-host-prod-fn204-ex958.aisha.l4_legacy_monthly_sales\` AS s
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_branches\` AS b
        ON CAST(s.branch_id AS INT64) = b.id
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_brands\` AS br
        ON CAST(s.brand_id AS INT64) = br.id
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growinsight.l3_growinsight_locations\` AS gl
        ON b.location_id = gl.location_id
      WHERE br.country_id = 1 AND SPLIT(s.month_year, "-")[OFFSET(1)] = '2025' AND gl.clean_city IS NOT NULL
      ORDER BY city
    `,
    areas: `
      SELECT DISTINCT gl.clean_area AS area
      FROM \`vpc-host-prod-fn204-ex958.aisha.l4_legacy_monthly_sales\` AS s
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_branches\` AS b
        ON CAST(s.branch_id AS INT64) = b.id
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_brands\` AS br
        ON CAST(s.brand_id AS INT64) = br.id
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growinsight.l3_growinsight_locations\` AS gl
        ON b.location_id = gl.location_id
      WHERE br.country_id = 1 AND SPLIT(s.month_year, "-")[OFFSET(1)] = '2025' AND gl.clean_area IS NOT NULL
      ORDER BY area
    `,
    cuisines: `
      SELECT DISTINCT cu.name AS cuisine
      FROM \`vpc-host-prod-fn204-ex958.aisha.l4_legacy_monthly_sales\` AS s
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_brands\` AS br
        ON CAST(s.brand_id AS INT64) = br.id
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_cuisines\` AS cu
        ON CAST(br.cuisine_id AS INT64) = cu.id
      WHERE br.country_id = 1 AND SPLIT(s.month_year, "-")[OFFSET(1)] = '2025' AND cu.name IS NOT NULL
      ORDER BY cuisine
    `,
  };

  try {
    const [monthsResult, citiesResult, areasResult, cuisinesResult] = await Promise.all([
      client.query({ query: queries.months }),
      client.query({ query: queries.cities }),
      client.query({ query: queries.areas }),
      client.query({ query: queries.cuisines }),
    ]);

    return {
      months: monthsResult[0].map((row: { month: string }) => row.month),
      cities: citiesResult[0].map((row: { city: string }) => row.city),
      areas: areasResult[0].map((row: { area: string }) => row.area),
      cuisines: cuisinesResult[0].map((row: { cuisine: string }) => row.cuisine),
    };
  } catch (error) {
    console.error('BigQuery error fetching filter options:', error);
    throw error;
  }
}

export async function fetchMissingBrands(): Promise<{
  id: string;
  name: string;
  cuisine: string;
  location: string;
  rating: number;
  locationCount: number;
}[]> {
  const client = getBigQueryClient();

  const query = `
    WITH talabat_brands AS (
      SELECT DISTINCT br.name, cu.name AS cuisine, gl.clean_area AS location
      FROM \`vpc-host-prod-fn204-ex958.aisha.l4_legacy_monthly_sales\` AS s
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_branches\` AS b
        ON CAST(s.branch_id AS INT64) = b.id
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_brands\` AS br
        ON CAST(s.brand_id AS INT64) = br.id
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_cuisines\` AS cu
        ON CAST(br.cuisine_id AS INT64) = cu.id
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growinsight.l3_growinsight_locations\` AS gl
        ON b.location_id = gl.location_id
      WHERE br.country_id = 1 AND s.channel = 'talabat'
    ),
    careem_brands AS (
      SELECT DISTINCT br.name
      FROM \`vpc-host-prod-fn204-ex958.aisha.l4_legacy_monthly_sales\` AS s
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_brands\` AS br
        ON CAST(s.brand_id AS INT64) = br.id
      WHERE br.country_id = 1 AND s.channel = 'careem'
    )
    SELECT 
      t.name,
      t.cuisine,
      t.location,
      COUNT(*) as locationCount
    FROM talabat_brands t
    LEFT JOIN careem_brands c ON t.name = c.name
    WHERE c.name IS NULL AND t.name IS NOT NULL AND t.cuisine IS NOT NULL
    GROUP BY t.name, t.cuisine, t.location
    ORDER BY locationCount DESC
    LIMIT 100
  `;

  try {
    const [rows] = await client.query({ query });
    return rows.map((row: { name: string; cuisine: string; location: string; locationCount: number }, index: number) => ({
      id: `brand-${index}`,
      name: row.name || 'Unknown',
      cuisine: row.cuisine || 'Unknown',
      location: row.location || 'Unknown',
      rating: Math.floor(Math.random() * 2) + 3 + Math.random(),
      locationCount: Number(row.locationCount) || 1,
    }));
  } catch (error) {
    console.error('BigQuery error fetching missing brands:', error);
    throw error;
  }
}
