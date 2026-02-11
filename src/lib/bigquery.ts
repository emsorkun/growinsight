import { BigQuery } from '@google-cloud/bigquery';
import type { SalesData, WeeklySalesData } from '@/types';

let bigquery: BigQuery | null = null;

/** Project ID - use BIGQUERY_PROJECT_ID or fall back to GOOGLE_CLOUD_PROJECT_ID */
function getProjectId(): string {
  return process.env.BIGQUERY_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID || '';
}

function getBigQueryClient(): BigQuery {
  if (!bigquery) {
    const projectId = getProjectId();

    if (!projectId) {
      console.error(
        'Missing BigQuery project ID. Set BIGQUERY_PROJECT_ID or GOOGLE_CLOUD_PROJECT_ID.'
      );
      throw new Error(
        'BigQuery configuration error: Missing project ID. Please set BIGQUERY_PROJECT_ID or GOOGLE_CLOUD_PROJECT_ID.'
      );
    }

    // Support both file path (local) and JSON string (Railway/cloud) credentials
    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    const credentialsFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    console.log('BigQuery initialization:', {
      projectId,
      credentialSource: credentialsJson ? 'env-json' : credentialsFile ? 'file' : 'default',
    });

    if (credentialsJson) {
      // Parse JSON string credentials (for Railway/cloud deployments)
      try {
        const credentials = JSON.parse(credentialsJson);

        // Validate required fields in credentials
        if (!credentials.client_email || !credentials.private_key) {
          throw new Error('Invalid credentials: missing client_email or private_key');
        }

        console.log('BigQuery: using GOOGLE_CREDENTIALS_JSON');

        bigquery = new BigQuery({
          projectId,
          credentials,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
        console.error('Failed to parse GOOGLE_CREDENTIALS_JSON:', errorMessage);
        throw new Error(
          `BigQuery configuration error: Invalid GOOGLE_CREDENTIALS_JSON format - ${errorMessage}`
        );
      }
    } else if (credentialsFile) {
      // Use file path (for local development with Docker)
      console.log('BigQuery: using GOOGLE_APPLICATION_CREDENTIALS file');
      bigquery = new BigQuery({
        projectId,
        keyFilename: credentialsFile,
      });
    } else {
      // Fall back to default credentials (GCP environment)
      console.log('Using default GCP credentials (no explicit credentials provided)');
      console.warn(
        'Warning: No explicit credentials provided. This may fail outside of GCP environment.'
      );
      bigquery = new BigQuery({ projectId });
    }
  }
  return bigquery;
}

/** month_year in DB is "January-2025"; we use "YYYY-MM" in filters and charts. */
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toYYYYMM(year: string, monthPart: string): string {
  const n = parseInt(monthPart, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= 12) {
    return `${year}-${String(n).padStart(2, '0')}`;
  }
  const idx = MONTH_NAMES.indexOf(monthPart);
  if (idx >= 0) return `${year}-${String(idx + 1).padStart(2, '0')}`;
  return `${year}-${monthPart}`;
}

/** Return [year, monthPartValues] for a YYYY-MM string so WHERE works for "01-2025", "1-2025", or "January-2025". */
function parseYYYYMMForFilter(yyyyMm: string): { year: string; monthParts: string[] } {
  const [y, m] = yyyyMm.split('-');
  const num = parseInt(m, 10);
  if (Number.isNaN(num) || num < 1 || num > 12) {
    return { year: y || '', monthParts: [m].filter(Boolean) };
  }
  const padded = String(num).padStart(2, '0');
  return {
    year: y || '',
    monthParts: [padded, String(num), MONTH_NAMES[num - 1]],
  };
}

/** Check if a YYYY-MM month is fully completed (all its days have passed). */
function isCompletedMonth(yyyyMm: string): boolean {
  const [y, m] = yyyyMm.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return false;
  // First day of the NEXT month; if today >= that date, the month is complete.
  // JS Date months are 0-indexed, so passing m (1-indexed) gives the next month.
  const firstOfNextMonth = new Date(y, m, 1);
  return new Date() >= firstOfNextMonth;
}

export async function fetchSalesData(filters?: {
  months?: string[];
  cities?: string[];
  areas?: string[];
  cuisines?: string[];
}): Promise<SalesData[]> {
  const client = getBigQueryClient();

  const hasMonthFilter = filters?.months && filters.months.length > 0;

  const conditions: string[] = ['br.country_id = 1'];
  const params: Record<string, string | string[]> = {};

  if (hasMonthFilter) {
    // Build combined month-part lookups for all selected months
    const allYears: string[] = [];
    const allMonthParts: string[] = [];
    for (const m of filters.months!) {
      const { year, monthParts } = parseYYYYMMForFilter(m);
      if (year && !allYears.includes(year)) allYears.push(year);
      for (const mp of monthParts) {
        if (!allMonthParts.includes(mp)) allMonthParts.push(mp);
      }
    }
    if (allYears.length > 0) {
      conditions.push("SPLIT(s.month_year, '-')[OFFSET(1)] IN UNNEST(@yearValues)");
      params.yearValues = allYears;
    }
    if (allMonthParts.length > 0) {
      conditions.push("SPLIT(s.month_year, '-')[OFFSET(0)] IN UNNEST(@monthParts)");
      params.monthParts = allMonthParts;
    }
  } else {
    // "All months" – data from 2025 onward; incomplete-month rows are filtered out in JS below
    conditions.push("CAST(SPLIT(s.month_year, '-')[OFFSET(1)] AS INT64) >= 2025");
  }
  if (filters?.cities && filters.cities.length > 0) {
    conditions.push('gl.clean_city IN UNNEST(@cities)');
    params.cities = filters.cities;
  }
  if (filters?.areas && filters.areas.length > 0) {
    conditions.push('gl.clean_area IN UNNEST(@areas)');
    params.areas = filters.areas;
  }
  if (filters?.cuisines && filters.cuisines.length > 0) {
    conditions.push('cu.name IN UNNEST(@cuisines)');
    params.cuisines = filters.cuisines;
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
    WHERE ${conditions.join(' AND ')}
    ORDER BY year, month, channel, city
  `;

  try {
    const [rows] = await client.query({ query, params });
    let list = (rows as { month: string; year: string; [k: string]: unknown }[]).map((row) => ({
      ...row,
      month: toYYYYMM(String(row.year), String(row.month)),
    }));
    // When showing all months, exclude the current (incomplete) month
    if (!hasMonthFilter) {
      list = list.filter((row) => isCompletedMonth(row.month));
    }
    return list as SalesData[];
  } catch (error) {
    console.error('BigQuery error:', error);
    throw error;
  }
}

/** Last 12 weeks only. Uses l3_legacy_weekly_sales + l3_legacy_weekly_ad_campaigns. */
export async function fetchWeeklySalesData(filters?: {
  cities?: string[];
  areas?: string[];
  cuisines?: string[];
}): Promise<WeeklySalesData[]> {
  const client = getBigQueryClient();

  const conditions: string[] = [
    'br.country_id = 1',
    "PARSE_DATE('%d-%m-%Y', s.week_start_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 WEEK)",
  ];
  const params: Record<string, string | string[]> = {};
  if (filters?.cities && filters.cities.length > 0) {
    conditions.push('l.clean_city IN UNNEST(@cities)');
    params.cities = filters.cities;
  }
  if (filters?.areas && filters.areas.length > 0) {
    conditions.push('l.clean_area IN UNNEST(@areas)');
    params.areas = filters.areas;
  }
  if (filters?.cuisines && filters.cuisines.length > 0) {
    conditions.push('cu.name IN UNNEST(@cuisines)');
    params.cuisines = filters.cuisines;
  }

  const query = `
    SELECT
      s.channel AS channel,
      l.clean_city AS city,
      l.clean_area AS area,
      s.week_start_date AS weekStartDate,
      EXTRACT(WEEK FROM PARSE_DATE('%d-%m-%Y', s.week_start_date)) AS week,
      EXTRACT(YEAR FROM PARSE_DATE('%d-%m-%Y', s.week_start_date)) AS year,
      l.clean_area AS location,
      cu.name AS cuisine,
      s.total_orders_count AS orders,
      s.net_revenue AS netSales,
      s.gross_revenue AS grossSales,
      COALESCE(a.spend, 0) AS adsSpend,
      s.discount AS discountSpend,
      COALESCE(a.return, 0) AS adsReturn
    FROM \`vpc-host-prod-fn204-ex958.aisha.l3_legacy_weekly_sales\` AS s
    LEFT JOIN \`vpc-host-prod-fn204-ex958.aisha.l3_legacy_weekly_ad_campaigns\` AS a
      ON s.brand_id = a.brand_id
      AND s.branch_id = a.branch_id
      AND s.channel = a.channel
      AND s.week_start_date = a.week_start_date
    LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_branches\` AS b
      ON CAST(s.branch_id AS INT64) = b.id
    LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_brands\` AS br
      ON CAST(s.brand_id AS INT64) = br.id
    LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_cuisines\` AS cu
      ON CAST(br.cuisine_id AS INT64) = cu.id
    LEFT JOIN \`vpc-host-prod-fn204-ex958.growinsight.l3_growinsight_locations\` AS l
      ON CAST(b.location_id AS INT64) = l.location_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY year, week, channel, city
  `;

  try {
    const [rows] = await client.query({
      query,
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return rows as WeeklySalesData[];
  } catch (error) {
    console.error('BigQuery error (weekly):', error);
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
      SELECT DISTINCT SPLIT(s.month_year, "-")[OFFSET(0)] AS month, SPLIT(s.month_year, "-")[OFFSET(1)] AS year
      FROM \`vpc-host-prod-fn204-ex958.aisha.l4_legacy_monthly_sales\` AS s
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_brands\` AS br
        ON CAST(s.brand_id AS INT64) = br.id
      WHERE br.country_id = 1
        AND CAST(SPLIT(s.month_year, "-")[OFFSET(1)] AS INT64) >= 2025
      ORDER BY year, month
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
      WHERE br.country_id = 1
        AND CAST(SPLIT(s.month_year, "-")[OFFSET(1)] AS INT64) >= 2025
        AND gl.clean_city IS NOT NULL
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
      WHERE br.country_id = 1
        AND CAST(SPLIT(s.month_year, "-")[OFFSET(1)] AS INT64) >= 2025
        AND gl.clean_area IS NOT NULL
      ORDER BY area
    `,
    cuisines: `
      SELECT DISTINCT cu.name AS cuisine
      FROM \`vpc-host-prod-fn204-ex958.aisha.l4_legacy_monthly_sales\` AS s
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_brands\` AS br
        ON CAST(s.brand_id AS INT64) = br.id
      LEFT JOIN \`vpc-host-prod-fn204-ex958.growdash_postgresql.public_cuisines\` AS cu
        ON CAST(br.cuisine_id AS INT64) = cu.id
      WHERE br.country_id = 1
        AND CAST(SPLIT(s.month_year, "-")[OFFSET(1)] AS INT64) >= 2025
        AND cu.name IS NOT NULL
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
      months: (monthsResult[0] as { month: string; year: string }[])
        .map((row) => toYYYYMM(row.year, row.month))
        .filter(isCompletedMonth)
        .sort(),
      cities: citiesResult[0].map((row: { city: string }) => row.city),
      areas: areasResult[0].map((row: { area: string }) => row.area),
      cuisines: cuisinesResult[0].map((row: { cuisine: string }) => row.cuisine),
    };
  } catch (error) {
    console.error('BigQuery error fetching filter options:', error);
    throw error;
  }
}

export async function fetchMissingBrands(): Promise<
  {
    id: string;
    name: string;
    cuisine: string;
    location: string;
    rating: number;
    locationCount: number;
  }[]
> {
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
    return rows.map(
      (
        row: { name: string; cuisine: string; location: string; locationCount: number },
        index: number
      ) => ({
        id: `brand-${index}`,
        name: row.name || 'Unknown',
        cuisine: row.cuisine || 'Unknown',
        location: row.location || 'Unknown',
        rating: 0, // Placeholder until rating data is available from a source
        locationCount: Number(row.locationCount) || 1,
      })
    );
  } catch (error) {
    console.error('BigQuery error fetching missing brands:', error);
    throw error;
  }
}
