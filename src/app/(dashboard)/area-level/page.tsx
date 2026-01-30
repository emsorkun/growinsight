'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { FilterBar } from '@/components/layout/filter-bar';
import { useFilterStore } from '@/store/filter-store';
import {
  CHANNEL_COLORS,
  type MarketShareByAreaExtended,
  type CuisineDetailByArea,
  type AreaMonthlyTrend,
  type Channel,
} from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, MapPin, Search, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CHANNELS: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

// Signal strength colors - green for high, red for low
const SIGNAL_COLORS = {
  active: ['#22C55E', '#84CC16', '#EAB308', '#F97316', '#EF4444'],
  inactive: '#E5E7EB',
};

function SignalStrengthIndicator({ strength }: { strength: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((level) => (
        <div
          key={level}
          className="w-1.5 rounded-sm"
          style={{
            height: `${8 + level * 3}px`,
            backgroundColor:
              level <= strength
                ? SIGNAL_COLORS.active[level - 1]
                : SIGNAL_COLORS.inactive,
          }}
        />
      ))}
    </div>
  );
}

function MarketShareCell({
  value,
  isHighest,
  color,
}: {
  value: number;
  isHighest: boolean;
  color: string;
}) {
  const intensity = Math.min(value / 100, 1);
  const backgroundColor = `${color}${Math.round(intensity * 40).toString(16).padStart(2, '0')}`;

  return (
    <div
      className={cn(
        'mx-auto rounded-full px-3 py-1 text-center text-sm',
        isHighest && 'font-semibold'
      )}
      style={{
        backgroundColor,
        color: isHighest ? color : undefined,
      }}
    >
      {value?.toFixed(1)}%
    </div>
  );
}

interface CuisineDetailDialogProps {
  area: string;
  open: boolean;
  onClose: () => void;
}

function CuisineDetailDialog({ area, open, onClose }: CuisineDetailDialogProps) {
  const [data, setData] = useState<CuisineDetailByArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedMonth, selectedCity } = useFilterStore();

  useEffect(() => {
    if (open && area) {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('area', area);
      if (selectedMonth !== 'all') params.set('month', selectedMonth);
      if (selectedCity !== 'all') params.set('city', selectedCity);

      fetch(`/api/areas/cuisines?${params.toString()}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setData(result.data);
          } else {
            // Use mock data for demo
            setData(getMockCuisineData());
          }
        })
        .catch(() => {
          setData(getMockCuisineData());
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, area, selectedMonth, selectedCity]);

  const getHighestChannel = (marketShare: Record<Channel, number>): Channel | null => {
    let highest: Channel | null = null;
    let highestValue = 0;
    CHANNELS.forEach((channel) => {
      if (marketShare[channel] > highestValue) {
        highestValue = marketShare[channel];
        highest = channel;
      }
    });
    return highest;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Cuisine Details for {area}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Cuisine</TableHead>
                  {CHANNELS.map((channel) => (
                    <TableHead key={channel} className="text-center">
                      <span style={{ color: CHANNEL_COLORS[channel] }}>{channel}</span>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Total Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No cuisine data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => {
                    const highestChannel = getHighestChannel(row.marketShare);
                    return (
                      <TableRow key={row.cuisine}>
                        <TableCell className="font-medium">{row.cuisine}</TableCell>
                        {CHANNELS.map((channel) => (
                          <TableCell key={channel} className="text-center p-2">
                            <MarketShareCell
                              value={row.marketShare[channel]}
                              isHighest={highestChannel === channel}
                              color={CHANNEL_COLORS[channel]}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center text-muted-foreground">
                          {row.totalOrders.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TrendDialogProps {
  area: string;
  open: boolean;
  onClose: () => void;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="mb-2 font-medium">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.dataKey}:</span>
            <span className="font-medium">{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function TrendDialog({ area, open, onClose }: TrendDialogProps) {
  const [data, setData] = useState<AreaMonthlyTrend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedCity, selectedCuisine } = useFilterStore();

  useEffect(() => {
    if (open && area) {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('area', area);
      if (selectedCity !== 'all') params.set('city', selectedCity);
      if (selectedCuisine !== 'all') params.set('cuisine', selectedCuisine);

      fetch(`/api/areas/trends?${params.toString()}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setData(result.data);
          } else {
            setData(getMockTrendData());
          }
        })
        .catch(() => {
          setData(getMockTrendData());
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, area, selectedCity, selectedCuisine]);

  const chartData = data.map((item) => ({
    month: item.month.substring(0, 3),
    ...item.marketShare,
  }));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <DialogTitle>Area Channel Distribution Analysis - {area}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4">
          <h3 className="mb-4 text-lg font-semibold">
            Monthly Channel Distribution for {area}
          </h3>
          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    label={{
                      value: 'Market Share (%)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: 'var(--muted-foreground)' },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value) => value} wrapperStyle={{ paddingTop: '1rem' }} />
                  {CHANNELS.map((channel) => (
                    <Bar
                      key={channel}
                      dataKey={channel}
                      stackId="a"
                      fill={CHANNEL_COLORS[channel]}
                    />
                  ))}
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AreaLevelPage() {
  const [data, setData] = useState<MarketShareByAreaExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineDialogArea, setCuisineDialogArea] = useState<string | null>(null);
  const [trendDialogArea, setTrendDialogArea] = useState<string | null>(null);

  const { selectedMonth, selectedCity, selectedCuisine } = useFilterStore();

  const fetchAreaData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedMonth !== 'all') params.set('month', selectedMonth);
      if (selectedCity !== 'all') params.set('city', selectedCity);
      if (selectedCuisine !== 'all') params.set('cuisine', selectedCuisine);

      const response = await fetch(`/api/areas?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Set mock data for demo
      setData(getMockAreaData());
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedCity, selectedCuisine]);

  useEffect(() => {
    fetchAreaData();
  }, [fetchAreaData]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter((item) =>
      item.area.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const getHighestChannel = (marketShare: Record<Channel, number>): Channel | null => {
    let highest: Channel | null = null;
    let highestValue = 0;

    CHANNELS.forEach((channel) => {
      if (marketShare[channel] > highestValue) {
        highestValue = marketShare[channel];
        highest = channel;
      }
    });

    return highest;
  };

  return (
    <div className="flex flex-col">
      <Header title="Area Level Analysis" subtitle="Market share by geographical areas" />

      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <FilterBar />

        {error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Note: Using demo data. {error}
          </div>
        )}

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg font-semibold">Market Share by Area</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search areas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Area</TableHead>
                      {CHANNELS.map((channel) => (
                        <TableHead key={channel} className="text-center">
                          <span style={{ color: CHANNEL_COLORS[channel] }}>
                            {channel} Market Share
                          </span>
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Signal Strength</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No areas found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((row) => {
                        const highestChannel = getHighestChannel(row.marketShare);
                        return (
                          <TableRow key={row.area} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  {row.area}
                                </div>
                                <span className="ml-6 text-xs text-muted-foreground">
                                  {row.city}
                                </span>
                              </div>
                            </TableCell>
                            {CHANNELS.map((channel) => (
                              <TableCell key={channel} className="text-center p-2">
                                <MarketShareCell
                                  value={row.marketShare[channel]}
                                  isHighest={highestChannel === channel}
                                  color={CHANNEL_COLORS[channel]}
                                />
                              </TableCell>
                            ))}
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <SignalStrengthIndicator strength={row.signalStrength} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCuisineDialogArea(row.area)}
                                  className="text-xs"
                                >
                                  Cuisine Detail
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setTrendDialogArea(row.area)}
                                  className="px-2"
                                >
                                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cuisine Detail Dialog */}
      <CuisineDetailDialog
        area={cuisineDialogArea || ''}
        open={!!cuisineDialogArea}
        onClose={() => setCuisineDialogArea(null)}
      />

      {/* Trend Dialog */}
      <TrendDialog
        area={trendDialogArea || ''}
        open={!!trendDialogArea}
        onClose={() => setTrendDialogArea(null)}
      />
    </div>
  );
}

function getMockAreaData(): MarketShareByAreaExtended[] {
  const areas = [
    { area: 'Abu Dhabi', city: 'Abu Dhabi' },
    { area: 'Abu Dhabi - Khalifa City', city: 'Abu Dhabi' },
    { area: 'Abu Dhabi - Mushrif', city: 'Abu Dhabi' },
    { area: 'Abu Dhabi Mall', city: 'Abu Dhabi' },
    { area: 'Abu Hail', city: 'Dubai' },
    { area: 'Abu Shagara', city: 'Sharjah' },
    { area: 'Academic City', city: 'Dubai' },
    { area: 'Al Barsha', city: 'Dubai' },
    { area: 'JBR', city: 'Dubai' },
    { area: 'Marina', city: 'Dubai' },
    { area: 'Downtown Dubai', city: 'Dubai' },
    { area: 'Business Bay', city: 'Dubai' },
    { area: 'DIFC', city: 'Dubai' },
    { area: 'Deira', city: 'Dubai' },
    { area: 'Bur Dubai', city: 'Dubai' },
    { area: 'Jumeirah', city: 'Dubai' },
    { area: 'Al Quoz', city: 'Dubai' },
    { area: 'Silicon Oasis', city: 'Dubai' },
    { area: 'Sports City', city: 'Dubai' },
    { area: 'Motor City', city: 'Dubai' },
    { area: 'Arabian Ranches', city: 'Dubai' },
    { area: 'Discovery Gardens', city: 'Dubai' },
    { area: 'Palm Jumeirah', city: 'Dubai' },
    { area: 'Sharjah Central', city: 'Sharjah' },
  ];

  return areas.map(({ area, city }) => {
    const total = 100;
    let remaining = total;
    const marketShare: Record<Channel, number> = {} as Record<Channel, number>;
    const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

    channels.forEach((channel, index) => {
      if (index === channels.length - 1) {
        marketShare[channel] = Math.max(0, remaining);
      } else {
        const baseShare = [55, 15, 15, 10, 5][index];
        const randomVariation = (Math.random() - 0.5) * 20;
        const share = Math.max(0, baseShare + randomVariation);
        marketShare[channel] = Math.min(remaining, share);
        remaining -= marketShare[channel];
      }
    });

    const totalOrders = Math.floor(Math.random() * 150000);
    const cuisineCount = Math.floor(Math.random() * 8) + 1;
    const signalStrength = getSignalStrength(totalOrders, cuisineCount);

    return { area, city, marketShare, totalOrders, cuisineCount, signalStrength };
  });
}

function getSignalStrength(totalOrders: number, cuisineCount: number): number {
  if (totalOrders >= 100000 || cuisineCount >= 6) return 5;
  if (totalOrders >= 50000 || cuisineCount >= 5) return 4;
  if (totalOrders >= 40000 || cuisineCount >= 4) return 3;
  if (totalOrders >= 20000 || cuisineCount >= 3) return 2;
  return 1;
}

function getMockCuisineData(): CuisineDetailByArea[] {
  const cuisines = [
    'American/Fast Food',
    'Desserts & Sweets',
    'Healthy & Special Diets',
    'Indian',
    'Italian',
    'Mexican',
    'Middle Eastern',
    'Shawarma',
    'Turkish',
  ];

  return cuisines.map((cuisine) => {
    const total = 100;
    let remaining = total;
    const marketShare: Record<Channel, number> = {} as Record<Channel, number>;
    const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

    channels.forEach((channel, index) => {
      if (index === channels.length - 1) {
        marketShare[channel] = Math.max(0, remaining);
      } else {
        const baseShare = [65, 10, 10, 10, 5][index];
        const randomVariation = (Math.random() - 0.5) * 20;
        const share = Math.max(0, baseShare + randomVariation);
        marketShare[channel] = Math.min(remaining, share);
        remaining -= marketShare[channel];
      }
    });

    return {
      cuisine,
      marketShare,
      totalOrders: Math.floor(Math.random() * 50000) + 500,
    };
  });
}

function getMockTrendData(): AreaMonthlyTrend[] {
  const months = [
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
  ];

  return months.map((month) => {
    const total = 100;
    let remaining = total;
    const marketShare: Record<Channel, number> = {} as Record<Channel, number>;
    const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

    channels.forEach((channel, index) => {
      if (index === channels.length - 1) {
        marketShare[channel] = Math.max(0, remaining);
      } else {
        const baseShare = [65, 15, 10, 8, 2][index];
        const randomVariation = (Math.random() - 0.5) * 8;
        const share = Math.max(0, baseShare + randomVariation);
        marketShare[channel] = Math.min(remaining, share);
        remaining -= marketShare[channel];
      }
    });

    return { month, marketShare };
  });
}
