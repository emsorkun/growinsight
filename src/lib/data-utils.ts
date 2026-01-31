import type { SalesData, AggregatedData, MonthlyMarketShare, WeeklySalesData, WeeklyMarketShare, MarketShareByArea, MarketShareByCuisine, MarketShareByAreaExtended, CuisineDetailByArea, AreaMonthlyTrend, Channel } from '@/types';

const CHANNELS: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

export function aggregateByChannel(data: SalesData[]): AggregatedData[] {
  const channelMap = new Map<Channel, AggregatedData>();

  CHANNELS.forEach((channel) => {
    channelMap.set(channel, {
      channel,
      orders: 0,
      netSales: 0,
      grossSales: 0,
      adsSpend: 0,
      discountSpend: 0,
      adsReturn: 0,
      roas: 0,
      aov: 0,
    });
  });

  data.forEach((row) => {
    const channel = normalizeChannel(row.channel);
    if (!channel) return;

    const existing = channelMap.get(channel)!;
    existing.orders += row.orders || 0;
    existing.netSales += row.netSales || 0;
    existing.grossSales += row.grossSales || 0;
    existing.adsSpend += row.adsSpend || 0;
    existing.discountSpend += row.discountSpend || 0;
    existing.adsReturn += row.adsReturn || 0;
  });

  return CHANNELS.map((channel) => {
    const data = channelMap.get(channel)!;
    data.roas = data.adsSpend > 0 ? data.adsReturn / data.adsSpend : 0;
    data.aov = data.orders > 0 ? data.grossSales / data.orders : 0;
    return data;
  }).filter((d) => d.orders > 0);
}

export function aggregateWeeklyByChannel(data: WeeklySalesData[]): AggregatedData[] {
  const channelMap = new Map<Channel, AggregatedData>();

  CHANNELS.forEach((channel) => {
    channelMap.set(channel, {
      channel,
      orders: 0,
      netSales: 0,
      grossSales: 0,
      adsSpend: 0,
      discountSpend: 0,
      adsReturn: 0,
      roas: 0,
      aov: 0,
    });
  });

  data.forEach((row) => {
    const channel = normalizeChannel(row.channel);
    if (!channel) return;

    const existing = channelMap.get(channel)!;
    existing.orders += row.orders || 0;
    existing.netSales += row.netSales || 0;
    existing.grossSales += row.grossSales || 0;
    existing.adsSpend += row.adsSpend || 0;
    existing.discountSpend += row.discountSpend || 0;
    existing.adsReturn += row.adsReturn || 0;
  });

  return CHANNELS.map((channel) => {
    const agg = channelMap.get(channel)!;
    agg.roas = agg.adsSpend > 0 ? agg.adsReturn / agg.adsSpend : 0;
    agg.aov = agg.orders > 0 ? agg.grossSales / agg.orders : 0;
    return agg;
  }).filter((d) => d.orders > 0);
}

export function calculateWeeklyMarketShare(data: WeeklySalesData[]): WeeklyMarketShare[] {
  const weeklyMap = new Map<string, { weekStartDate: string; channelOrders: Map<Channel, number> }>();

  data.forEach((row) => {
    const key = `${row.year}-W${String(row.week).padStart(2, '0')}`;
    const channel = normalizeChannel(row.channel);
    if (!channel) return;

    if (!weeklyMap.has(key)) {
      weeklyMap.set(key, { weekStartDate: row.weekStartDate, channelOrders: new Map() });
    }
    const weekData = weeklyMap.get(key)!;
    weekData.channelOrders.set(channel, (weekData.channelOrders.get(channel) || 0) + (row.orders || 0));
  });

  return Array.from(weeklyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekLabel, { weekStartDate, channelOrders }]) => {
      const total = Array.from(channelOrders.values()).reduce((sum, val) => sum + val, 0);
      const marketShare: Record<Channel, number> = {} as Record<Channel, number>;
      CHANNELS.forEach((channel) => {
        const value = channelOrders.get(channel) || 0;
        marketShare[channel] = total > 0 ? (value / total) * 100 : 0;
      });
      return { weekLabel, weekStartDate, marketShare };
    });
}

export function calculateMonthlyMarketShare(data: SalesData[]): MonthlyMarketShare[] {
  const monthlyMap = new Map<string, Map<Channel, number>>();

  data.forEach((row) => {
    const month = row.month;
    const channel = normalizeChannel(row.channel);
    if (!month || !channel) return;

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, new Map());
    }

    const channelMap = monthlyMap.get(month)!;
    channelMap.set(channel, (channelMap.get(channel) || 0) + (row.orders || 0));
  });

  return Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, channelMap]) => {
      const total = Array.from(channelMap.values()).reduce((sum, val) => sum + val, 0);
      const marketShare: Record<Channel, number> = {} as Record<Channel, number>;

      CHANNELS.forEach((channel) => {
        const value = channelMap.get(channel) || 0;
        marketShare[channel] = total > 0 ? (value / total) * 100 : 0;
      });

      return { month, marketShare };
    });
}

export function calculateMarketShareByArea(data: SalesData[]): MarketShareByArea[] {
  const areaMap = new Map<string, Map<Channel, number>>();

  data.forEach((row) => {
    const area = row.area;
    const channel = normalizeChannel(row.channel);
    if (!area || !channel) return;

    if (!areaMap.has(area)) {
      areaMap.set(area, new Map());
    }

    const channelMap = areaMap.get(area)!;
    channelMap.set(channel, (channelMap.get(channel) || 0) + (row.orders || 0));
  });

  return Array.from(areaMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([area, channelMap]) => {
      const total = Array.from(channelMap.values()).reduce((sum, val) => sum + val, 0);
      const marketShare: Record<Channel, number> = {} as Record<Channel, number>;

      CHANNELS.forEach((channel) => {
        const value = channelMap.get(channel) || 0;
        marketShare[channel] = total > 0 ? (value / total) * 100 : 0;
      });

      return { area, marketShare };
    });
}

export function calculateMarketShareByCuisine(data: SalesData[]): MarketShareByCuisine[] {
  const cuisineMap = new Map<string, Map<Channel, number>>();

  data.forEach((row) => {
    const cuisine = row.cuisine;
    const channel = normalizeChannel(row.channel);
    if (!cuisine || !channel) return;

    if (!cuisineMap.has(cuisine)) {
      cuisineMap.set(cuisine, new Map());
    }

    const channelMap = cuisineMap.get(cuisine)!;
    channelMap.set(channel, (channelMap.get(channel) || 0) + (row.orders || 0));
  });

  return Array.from(cuisineMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cuisine, channelMap]) => {
      const total = Array.from(channelMap.values()).reduce((sum, val) => sum + val, 0);
      const marketShare: Record<Channel, number> = {} as Record<Channel, number>;

      CHANNELS.forEach((channel) => {
        const value = channelMap.get(channel) || 0;
        marketShare[channel] = total > 0 ? (value / total) * 100 : 0;
      });

      return { cuisine, marketShare };
    });
}

function normalizeChannel(channel: string): Channel | null {
  const normalized = channel?.toLowerCase();
  
  const channelMapping: Record<string, Channel> = {
    'talabat': 'Talabat',
    'deliveroo': 'Deliveroo',
    'careem': 'Careem',
    'noon': 'Noon',
    'keeta': 'Keeta',
  };

  return channelMapping[normalized] || null;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Calculate signal strength based on total orders and cuisine count
 * Level 5: 100k orders OR 6 cuisines
 * Level 4: 50k orders OR 5 cuisines
 * Level 3: 40k orders OR 4 cuisines
 * Level 2: 20k orders OR 3 cuisines
 * Level 1: below 20k OR below 3 cuisines
 */
export function getSignalStrength(totalOrders: number, cuisineCount: number): number {
  if (totalOrders >= 100000 || cuisineCount >= 6) return 5;
  if (totalOrders >= 50000 || cuisineCount >= 5) return 4;
  if (totalOrders >= 40000 || cuisineCount >= 4) return 3;
  if (totalOrders >= 20000 || cuisineCount >= 3) return 2;
  return 1;
}

export function calculateMarketShareByAreaExtended(data: SalesData[]): MarketShareByAreaExtended[] {
  const areaMap = new Map<string, {
    city: string;
    channelOrders: Map<Channel, number>;
    cuisines: Set<string>;
    totalOrders: number;
  }>();

  data.forEach((row) => {
    const area = row.area;
    const channel = normalizeChannel(row.channel);
    if (!area || !channel) return;

    if (!areaMap.has(area)) {
      areaMap.set(area, {
        city: row.city || '',
        channelOrders: new Map(),
        cuisines: new Set(),
        totalOrders: 0,
      });
    }

    const areaData = areaMap.get(area)!;
    areaData.channelOrders.set(channel, (areaData.channelOrders.get(channel) || 0) + (row.orders || 0));
    areaData.totalOrders += row.orders || 0;
    if (row.cuisine) {
      areaData.cuisines.add(row.cuisine);
    }
  });

  return Array.from(areaMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([area, areaData]) => {
      const total = areaData.totalOrders;
      const marketShare: Record<Channel, number> = {} as Record<Channel, number>;

      CHANNELS.forEach((channel) => {
        const value = areaData.channelOrders.get(channel) || 0;
        marketShare[channel] = total > 0 ? (value / total) * 100 : 0;
      });

      const cuisineCount = areaData.cuisines.size;
      const signalStrength = getSignalStrength(total, cuisineCount);

      return {
        area,
        city: areaData.city,
        marketShare,
        totalOrders: total,
        cuisineCount,
        signalStrength,
      };
    });
}

export function calculateCuisineDetailByArea(data: SalesData[], targetArea: string): CuisineDetailByArea[] {
  const cuisineMap = new Map<string, {
    channelOrders: Map<Channel, number>;
    totalOrders: number;
  }>();

  data.forEach((row) => {
    if (row.area !== targetArea) return;
    
    const cuisine = row.cuisine;
    const channel = normalizeChannel(row.channel);
    if (!cuisine || !channel) return;

    if (!cuisineMap.has(cuisine)) {
      cuisineMap.set(cuisine, {
        channelOrders: new Map(),
        totalOrders: 0,
      });
    }

    const cuisineData = cuisineMap.get(cuisine)!;
    cuisineData.channelOrders.set(channel, (cuisineData.channelOrders.get(channel) || 0) + (row.orders || 0));
    cuisineData.totalOrders += row.orders || 0;
  });

  return Array.from(cuisineMap.entries())
    .sort((a, b) => b[1].totalOrders - a[1].totalOrders) // Sort by total orders descending
    .map(([cuisine, cuisineData]) => {
      const total = cuisineData.totalOrders;
      const marketShare: Record<Channel, number> = {} as Record<Channel, number>;

      CHANNELS.forEach((channel) => {
        const value = cuisineData.channelOrders.get(channel) || 0;
        marketShare[channel] = total > 0 ? (value / total) * 100 : 0;
      });

      return {
        cuisine,
        marketShare,
        totalOrders: total,
      };
    });
}

export function calculateAreaMonthlyTrend(data: SalesData[], targetArea: string): AreaMonthlyTrend[] {
  const monthlyMap = new Map<string, Map<Channel, number>>();

  data.forEach((row) => {
    if (row.area !== targetArea) return;
    
    const month = row.month;
    const channel = normalizeChannel(row.channel);
    if (!month || !channel) return;

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, new Map());
    }

    const channelMap = monthlyMap.get(month)!;
    channelMap.set(channel, (channelMap.get(channel) || 0) + (row.orders || 0));
  });

  return Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, channelMap]) => {
      const total = Array.from(channelMap.values()).reduce((sum, val) => sum + val, 0);
      const marketShare: Record<Channel, number> = {} as Record<Channel, number>;

      CHANNELS.forEach((channel) => {
        const value = channelMap.get(channel) || 0;
        marketShare[channel] = total > 0 ? (value / total) * 100 : 0;
      });

      return { month, marketShare };
    });
}

export { CHANNELS };
