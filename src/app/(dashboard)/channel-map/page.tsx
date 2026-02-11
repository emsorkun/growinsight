'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/header';
import { FilterBar } from '@/components/layout/filter-bar';
import { useFilterStore } from '@/store/filter-store';
import { CHANNEL_COLORS, type Channel } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamically import the map component to avoid SSR issues with Leaflet
const ChannelHeatMap = dynamic(() => import('@/components/charts/channel-heat-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center bg-muted/20 rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

interface ChannelMapData {
  area: string;
  city: string;
  lat: number;
  lng: number;
  totalOrders: number;
  totalSales: number;
  dominantChannel: Channel;
  channelBreakdown: Record<Channel, { orders: number; sales: number; share: number }>;
}

const MIN_ORDERS_THRESHOLD = 1000;
const CHANNELS: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

export default function ChannelMapPage() {
  const [data, setData] = useState<ChannelMapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredArea, setHoveredArea] = useState<ChannelMapData | null>(null);

  const { options, selectedMonths, selectedCities, selectedCuisines, setOptions } =
    useFilterStore();

  // Load filter options when missing (e.g. when landing on channel map first)
  useEffect(() => {
    if (options.months.length > 0) return;
    fetch('/api/filter-options')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          setOptions(result.data);
        } else {
          setOptions(getMockFilterOptions());
        }
      })
      .catch(() => setOptions(getMockFilterOptions()));
  }, [options.months.length, setOptions]);

  const fetchMapData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedMonths.length > 0) params.set('month', selectedMonths.join(','));
      if (selectedCities.length > 0) params.set('city', selectedCities.join(','));
      if (selectedCuisines.length > 0) params.set('cuisine', selectedCuisines.join(','));

      const response = await fetch(`/api/channel-map?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      // Only show areas with >= 1k orders
      const filtered = (result.data as ChannelMapData[]).filter(
        (d) => d.totalOrders >= MIN_ORDERS_THRESHOLD
      );
      setData(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Set mock data for demo (already >= 1k)
      setData(getMockMapData().filter((d) => d.totalOrders >= MIN_ORDERS_THRESHOLD));
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonths, selectedCities, selectedCuisines]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Only show areas with >= 1k orders
  const filteredData = useMemo(
    () => data.filter((d) => d.totalOrders >= MIN_ORDERS_THRESHOLD),
    [data]
  );

  return (
    <div className="flex flex-col">
      <Header title="Channel Heatmap" subtitle="Geographic distribution of delivery channels" />

      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <FilterBar showSignalStrength />

        {error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Note: Using demo data. {error}
          </div>
        )}

        {/* Map */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Channel Dominance Map</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-[600px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ChannelHeatMap
                  data={filteredData}
                  selectedChannel="all"
                  onAreaHover={setHoveredArea}
                />
              )}
            </CardContent>
          </Card>

          {/* Area Details Panel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">
                {hoveredArea ? hoveredArea.area : 'Area Details'}
              </CardTitle>
              {hoveredArea && <p className="text-sm text-muted-foreground">{hoveredArea.city}</p>}
            </CardHeader>
            <CardContent>
              {hoveredArea ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Dominant</span>
                      <span
                        className="font-medium"
                        style={{ color: CHANNEL_COLORS[hoveredArea.dominantChannel] }}
                      >
                        {hoveredArea.dominantChannel}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Channel Breakdown</p>
                    <div className="space-y-2">
                      {CHANNELS.map((channel) => {
                        const channelData = hoveredArea.channelBreakdown[channel];
                        return (
                          <div key={channel} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span style={{ color: CHANNEL_COLORS[channel] }}>{channel}</span>
                              <span>{channelData?.share?.toFixed(1) || 0}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${channelData?.share || 0}%`,
                                  backgroundColor: CHANNEL_COLORS[channel],
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-[400px] items-center justify-center text-muted-foreground text-sm">
                  Hover over an area on the map to see details
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Areas Table (no absolute orders/sales) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Areas by Channel Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Area</th>
                    <th className="text-left py-2 px-2">City</th>
                    {CHANNELS.map((ch) => (
                      <th
                        key={ch}
                        className="text-center py-2 px-2"
                        style={{ color: CHANNEL_COLORS[ch] }}
                      >
                        {ch}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 10).map((row) => (
                    <tr
                      key={row.area}
                      className={cn(
                        'border-b hover:bg-muted/50 cursor-pointer transition-colors',
                        hoveredArea?.area === row.area && 'bg-muted'
                      )}
                      onMouseEnter={() => setHoveredArea(row)}
                      onMouseLeave={() => setHoveredArea(null)}
                    >
                      <td className="py-2 px-2 font-medium">{row.area}</td>
                      <td className="py-2 px-2 text-muted-foreground">{row.city}</td>
                      {CHANNELS.map((ch) => (
                        <td key={ch} className="py-2 px-2 text-center">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs',
                              row.dominantChannel === ch && 'font-semibold'
                            )}
                            style={{
                              backgroundColor: `${CHANNEL_COLORS[ch]}20`,
                              color: CHANNEL_COLORS[ch],
                            }}
                          >
                            {row.channelBreakdown[ch]?.share?.toFixed(0) || 0}%
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getMockFilterOptions(): {
  months: string[];
  cities: string[];
  areas: string[];
  cuisines: string[];
} {
  return {
    months: [
      '2025-01',
      '2025-02',
      '2025-03',
      '2025-04',
      '2025-05',
      '2025-06',
      '2025-07',
      '2025-08',
      '2025-09',
      '2025-10',
    ],
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
    areas: [
      'Downtown Dubai',
      'Dubai Marina',
      'JBR',
      'Business Bay',
      'DIFC',
      'Al Barsha',
      'Jumeirah',
      'Deira',
      'Palm Jumeirah',
      'Silicon Oasis',
    ],
    cuisines: ['Arabian', 'Indian', 'Pakistani', 'Chinese', 'American', 'Italian', 'Japanese'],
  };
}

function getMockMapData(): ChannelMapData[] {
  const areas = [
    { area: 'Downtown Dubai', city: 'Dubai', lat: 25.1972, lng: 55.2744 },
    { area: 'Dubai Marina', city: 'Dubai', lat: 25.0773, lng: 55.134 },
    { area: 'JBR', city: 'Dubai', lat: 25.0772, lng: 55.133 },
    { area: 'Business Bay', city: 'Dubai', lat: 25.1863, lng: 55.2614 },
    { area: 'DIFC', city: 'Dubai', lat: 25.2085, lng: 55.279 },
    { area: 'Al Barsha', city: 'Dubai', lat: 25.1111, lng: 55.1924 },
    { area: 'Jumeirah', city: 'Dubai', lat: 25.2117, lng: 55.253 },
    { area: 'Deira', city: 'Dubai', lat: 25.2716, lng: 55.3135 },
    { area: 'Bur Dubai', city: 'Dubai', lat: 25.2547, lng: 55.2969 },
    { area: 'Palm Jumeirah', city: 'Dubai', lat: 25.1124, lng: 55.139 },
    { area: 'Silicon Oasis', city: 'Dubai', lat: 25.1178, lng: 55.3834 },
    { area: 'Abu Dhabi Mall', city: 'Abu Dhabi', lat: 24.4953, lng: 54.3838 },
    { area: 'Al Reem Island', city: 'Abu Dhabi', lat: 24.4993, lng: 54.4112 },
    { area: 'Yas Island', city: 'Abu Dhabi', lat: 24.4903, lng: 54.6009 },
    { area: 'Sharjah Central', city: 'Sharjah', lat: 25.3462, lng: 55.3877 },
  ];

  const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

  return areas.map(({ area, city, lat, lng }) => {
    const totalOrders = Math.floor(Math.random() * 100000) + 10000;
    const totalSales = totalOrders * (Math.random() * 50 + 30);

    // Generate channel breakdown
    let remaining = 100;
    const channelBreakdown: Record<Channel, { orders: number; sales: number; share: number }> =
      {} as Record<Channel, { orders: number; sales: number; share: number }>;

    channels.forEach((channel, index) => {
      let share: number;
      if (index === channels.length - 1) {
        share = Math.max(0, remaining);
      } else {
        const baseShare = [55, 15, 15, 10, 5][index];
        const randomVariation = (Math.random() - 0.5) * 20;
        share = Math.max(0, Math.min(remaining, baseShare + randomVariation));
        remaining -= share;
      }

      channelBreakdown[channel] = {
        orders: Math.round((share / 100) * totalOrders),
        sales: Math.round((share / 100) * totalSales),
        share,
      };
    });

    // Find dominant channel
    let dominantChannel: Channel = 'Talabat';
    let maxShare = 0;
    channels.forEach((ch) => {
      if (channelBreakdown[ch].share > maxShare) {
        maxShare = channelBreakdown[ch].share;
        dominantChannel = ch;
      }
    });

    return {
      area,
      city,
      lat,
      lng,
      totalOrders,
      totalSales,
      dominantChannel,
      channelBreakdown,
    };
  });
}
