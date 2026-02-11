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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Loader2,
  MapPin,
  Search,
  BarChart3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag,
  UtensilsCrossed,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SortColumn = 'area' | 'signalStrength' | Channel;
type SortDirection = 'asc' | 'desc';
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
              level <= strength ? SIGNAL_COLORS.active[level - 1] : SIGNAL_COLORS.inactive,
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
  const backgroundColor = `${color}${Math.round(intensity * 40)
    .toString(16)
    .padStart(2, '0')}`;

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
  const { selectedMonths, selectedCities } = useFilterStore();

  useEffect(() => {
    if (open && area) {
      const params = new URLSearchParams();
      params.set('area', area);
      if (selectedMonths.length > 0) params.set('month', selectedMonths.join(','));
      if (selectedCities.length > 0) params.set('city', selectedCities.join(','));

      void Promise.resolve().then(() => setIsLoading(true));
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
  }, [open, area, selectedMonths, selectedCities]);

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
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] w-[1000px] max-h-[80vh] overflow-hidden flex flex-col">
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
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
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
  const { selectedCities, selectedCuisines } = useFilterStore();

  useEffect(() => {
    if (open && area) {
      const params = new URLSearchParams();
      params.set('area', area);
      if (selectedCities.length > 0) params.set('city', selectedCities.join(','));
      if (selectedCuisines.length > 0) params.set('cuisine', selectedCuisines.join(','));

      void Promise.resolve().then(() => setIsLoading(true));
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
  }, [open, area, selectedCities, selectedCuisines]);

  const chartData = data.map((item) => ({
    month: item.month,
    ...item.marketShare,
  }));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] w-[1000px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <DialogTitle>Monthly Channel Distribution - {area}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-2">
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
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(value) => `${value}%`}
                    width={50}
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

interface WeeklyTrendData {
  week: string;
  weekLabel: string;
  marketShare: Record<Channel, number>;
}

interface WeeklyTrendDialogProps {
  area: string;
  open: boolean;
  onClose: () => void;
}

function WeeklyTrendDialog({ area, open, onClose }: WeeklyTrendDialogProps) {
  const [data, setData] = useState<WeeklyTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedCities, selectedCuisines } = useFilterStore();

  useEffect(() => {
    if (open && area) {
      void Promise.resolve().then(() => setIsLoading(true));
      const timer = setTimeout(() => {
        setData(getMockWeeklyTrendData());
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, area, selectedCities, selectedCuisines]);

  const chartData = data.map((item) => ({
    week: item.weekLabel,
    ...item.marketShare,
  }));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] w-[1000px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <DialogTitle>Weekly Market Share Trend - {area}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-2">
          {isLoading ? (
            <div className="flex h-[350px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tickFormatter={(value) => `${value}%`}
                      width={50}
                      label={{
                        value: 'Market Share (%)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: 'var(--muted-foreground)' },
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(value) => value} wrapperStyle={{ paddingTop: '0.5rem' }} />
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
              {/* Table view */}
              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="py-2">Week</TableHead>
                      {CHANNELS.map((channel) => (
                        <TableHead
                          key={channel}
                          className="text-center py-2"
                          style={{ color: CHANNEL_COLORS[channel] }}
                        >
                          {channel}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row) => (
                      <TableRow key={row.week} className="text-sm">
                        <TableCell className="py-2 font-medium">{row.weekLabel}</TableCell>
                        {CHANNELS.map((channel) => (
                          <TableCell key={channel} className="text-center py-2">
                            {row.marketShare[channel].toFixed(1)}%
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getMockWeeklyTrendData(): WeeklyTrendData[] {
  // Generate last 5 complete weeks
  const today = new Date();
  const weeks: WeeklyTrendData[] = [];

  // Find the start of the current week (Sunday)
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());

  for (let i = 5; i >= 1; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
    const week = `W${6 - i}`;

    const total = 100;
    let remaining = total;
    const marketShare: Record<Channel, number> = {} as Record<Channel, number>;
    const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

    channels.forEach((channel, index) => {
      if (index === channels.length - 1) {
        marketShare[channel] = Math.max(0, remaining);
      } else {
        const baseShare = [58, 15, 13, 9, 5][index];
        const randomVariation = (Math.random() - 0.5) * 6;
        const share = Math.max(0, baseShare + randomVariation);
        marketShare[channel] = Math.min(remaining, share);
        remaining -= marketShare[channel];
      }
    });

    weeks.push({ week, weekLabel, marketShare });
  }

  return weeks;
}

interface AdsDiscountActivity {
  channel: Channel;
  adsPercentGMV: number | null; // null for channels without ads (Keeta)
  discountPercentGMV: number;
  totalSpendPercentGMV: number;
  marketShare: number;
  hasAds: boolean;
}

interface AdsDiscountDialogProps {
  area: string;
  open: boolean;
  onClose: () => void;
}

const AdsDiscountTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string; name: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="mb-2 font-medium">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function AdsDiscountDialog({ area, open, onClose }: AdsDiscountDialogProps) {
  const [data, setData] = useState<AdsDiscountActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedMonths, selectedCities } = useFilterStore();

  useEffect(() => {
    if (open && area) {
      void Promise.resolve().then(() => setIsLoading(true));
      const timer = setTimeout(() => {
        setData(getMockAdsDiscountData());
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, area, selectedMonths, selectedCities]);

  // Only include channels with ads for the ads chart
  const chartData = data.map((item) => ({
    channel: item.channel,
    'Ads % of GMV': item.hasAds ? item.adsPercentGMV : 0,
    'Discount % of GMV': item.discountPercentGMV,
  }));

  const channelsWithAds = data.filter((item) => item.hasAds);
  const avgAdsPercent =
    channelsWithAds.length > 0
      ? channelsWithAds.reduce((sum, item) => sum + (item.adsPercentGMV || 0), 0) /
        channelsWithAds.length
      : 0;
  const avgDiscountPercent =
    data.length > 0
      ? data.reduce((sum, item) => sum + item.discountPercentGMV, 0) / data.length
      : 0;
  const highestAdsChannel =
    channelsWithAds.length > 0
      ? channelsWithAds.reduce(
          (max, item) => ((item.adsPercentGMV || 0) > (max.adsPercentGMV || 0) ? item : max),
          channelsWithAds[0]
        )
      : null;
  const highestDiscountChannel =
    data.length > 0
      ? data.reduce(
          (max, item) => (item.discountPercentGMV > max.discountPercentGMV ? item : max),
          data[0]
        )
      : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] w-[1100px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <DialogTitle className="text-base">Ads & Discount Activity - {area}</DialogTitle>
            </div>
            {/* Inline Summary Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Avg Ads:</span>
                <span className="font-semibold text-blue-600">{avgAdsPercent.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Avg Discount:</span>
                <span className="font-semibold text-orange-600">
                  {avgDiscountPercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Top Ads:</span>
                <span
                  className="font-semibold"
                  style={{
                    color: highestAdsChannel?.channel
                      ? CHANNEL_COLORS[highestAdsChannel.channel]
                      : undefined,
                  }}
                >
                  {highestAdsChannel?.channel || '-'} (
                  {highestAdsChannel?.adsPercentGMV?.toFixed(1) || 0}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Top Discount:</span>
                <span
                  className="font-semibold"
                  style={{
                    color: highestDiscountChannel?.channel
                      ? CHANNEL_COLORS[highestDiscountChannel.channel]
                      : undefined,
                  }}
                >
                  {highestDiscountChannel?.channel || '-'} (
                  {highestDiscountChannel?.discountPercentGMV?.toFixed(1) ?? '0'}%)
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto py-2">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Left: Chart */}
              <div>
                <h3 className="mb-2 text-sm font-semibold">% of GMV by Channel</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="channel"
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                      />
                      <YAxis
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                        tickFormatter={(value) => `${value}%`}
                        width={45}
                      />
                      <Tooltip content={<AdsDiscountTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '0.5rem', fontSize: '12px' }} />
                      <Bar dataKey="Ads % of GMV" fill="#3B82F6" name="Ads %" />
                      <Bar dataKey="Discount % of GMV" fill="#F97316" name="Discount %" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right: Table */}
              <div>
                <h3 className="mb-2 text-sm font-semibold">Channel Details</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="py-2">Channel</TableHead>
                      <TableHead className="text-right py-2">Ads %</TableHead>
                      <TableHead className="text-right py-2">Discount %</TableHead>
                      <TableHead className="text-right py-2">Total %</TableHead>
                      <TableHead className="text-right py-2">Mkt Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row) => (
                      <TableRow key={row.channel} className="text-sm">
                        <TableCell
                          className="py-2 font-medium"
                          style={{ color: CHANNEL_COLORS[row.channel] }}
                        >
                          {row.channel}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          {row.hasAds ? (
                            `${row.adsPercentGMV?.toFixed(1)}%`
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          {row.discountPercentGMV.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right py-2 font-medium">
                          {row.totalSpendPercentGMV.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right py-2">
                          {row.marketShare.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-1">* Keeta has no ads program</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getMockAdsDiscountData(): AdsDiscountActivity[] {
  const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

  // Channels that have ads programs - Keeta does NOT have ads
  const channelsWithAds: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon'];

  return channels.map((channel) => {
    const hasAds = channelsWithAds.includes(channel);

    // Ads as % of GMV (only for channels with ads)
    const adsPercentMap: Partial<Record<Channel, number>> = {
      Talabat: 4.5,
      Deliveroo: 3.8,
      Careem: 3.2,
      Noon: 2.8,
    };
    const baseAdsPercent = hasAds ? (adsPercentMap[channel] ?? 3.0) : null;

    // Discount as % of GMV
    const baseDiscountPercent =
      {
        Talabat: 5.2,
        Deliveroo: 4.5,
        Careem: 6.8,
        Noon: 8.5,
        Keeta: 7.2, // Keeta relies more on discounts since no ads
      }[channel] || 5.0;

    const variation = () => (Math.random() - 0.5) * 0.4 + 1;
    const adsPercentGMV = hasAds && baseAdsPercent ? baseAdsPercent * variation() : null;
    const discountPercentGMV = baseDiscountPercent * variation();

    const marketShare =
      {
        Talabat: 55,
        Deliveroo: 15,
        Careem: 15,
        Noon: 10,
        Keeta: 5,
      }[channel] || 10;

    return {
      channel,
      adsPercentGMV,
      discountPercentGMV,
      totalSpendPercentGMV: (adsPercentGMV || 0) + discountPercentGMV,
      marketShare: marketShare + (Math.random() - 0.5) * 5,
      hasAds,
    };
  });
}

function SortableHeader({
  column,
  label,
  currentSort,
  currentDirection,
  onSort,
  className,
  style,
}: {
  column: SortColumn;
  label: React.ReactNode;
  currentSort: SortColumn | null;
  currentDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isActive = currentSort === column;

  return (
    <TableHead
      className={cn('cursor-pointer select-none hover:bg-muted/50 transition-colors', className)}
      style={style}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center justify-center gap-1">
        <span style={style}>{label}</span>
        {isActive ? (
          currentDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3 flex-shrink-0" />
          ) : (
            <ArrowDown className="h-3 w-3 flex-shrink-0" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 flex-shrink-0 opacity-50" />
        )}
      </div>
    </TableHead>
  );
}

export default function AreaLevelPage() {
  const [data, setData] = useState<MarketShareByAreaExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineDialogArea, setCuisineDialogArea] = useState<string | null>(null);
  const [trendDialogArea, setTrendDialogArea] = useState<string | null>(null);
  const [weeklyTrendDialogArea, setWeeklyTrendDialogArea] = useState<string | null>(null);
  const [adsDiscountDialogArea, setAdsDiscountDialogArea] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { selectedMonths, selectedCities, selectedCuisines, selectedSignalStrengths } =
    useFilterStore();

  const fetchAreaData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedMonths.length > 0) params.set('month', selectedMonths.join(','));
      if (selectedCities.length > 0) params.set('city', selectedCities.join(','));
      if (selectedCuisines.length > 0) params.set('cuisine', selectedCuisines.join(','));

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
  }, [selectedMonths, selectedCities, selectedCuisines]);

  useEffect(() => {
    fetchAreaData();
  }, [fetchAreaData]);

  const handleSort = useCallback(
    (column: SortColumn) => {
      if (sortColumn === column) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(column);
        setSortDirection('desc');
      }
    },
    [sortColumn]
  );

  const filteredData = useMemo(() => {
    let result = data;

    // Apply search filter
    if (searchQuery) {
      result = result.filter((item) => item.area.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Apply signal strength filter (multi-select)
    if (selectedSignalStrengths.length > 0) {
      result = result.filter((item) => selectedSignalStrengths.includes(item.signalStrength));
    }

    // Apply sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;

        if (sortColumn === 'area') {
          aValue = a.area.toLowerCase();
          bValue = b.area.toLowerCase();
        } else if (sortColumn === 'signalStrength') {
          aValue = a.signalStrength;
          bValue = b.signalStrength;
        } else {
          // Channel column
          aValue = a.marketShare[sortColumn] || 0;
          bValue = b.marketShare[sortColumn] || 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortDirection === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      });
    }

    return result;
  }, [data, searchQuery, selectedSignalStrengths, sortColumn, sortDirection]);

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
        <FilterBar showSignalStrength />

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
                      <SortableHeader
                        column="area"
                        label="Area"
                        currentSort={sortColumn}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                        className="w-[200px] text-left"
                      />
                      {CHANNELS.map((channel) => (
                        <SortableHeader
                          key={channel}
                          column={channel}
                          label={channel}
                          currentSort={sortColumn}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                          className="text-center"
                          style={{ color: CHANNEL_COLORS[channel] }}
                        />
                      ))}
                      <SortableHeader
                        column="signalStrength"
                        label="Signal Strength"
                        currentSort={sortColumn}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                        className="text-center"
                      />
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
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCuisineDialogArea(row.area)}
                                  className="h-8 px-2"
                                  title="Cuisine Details"
                                >
                                  <UtensilsCrossed className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAdsDiscountDialogArea(row.area)}
                                  className="h-8 px-2"
                                  title="Ads & Discounts"
                                >
                                  <Tag className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setTrendDialogArea(row.area)}
                                  className="h-8 px-2"
                                  title="Monthly Trend"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setWeeklyTrendDialogArea(row.area)}
                                  className="h-8 px-2"
                                  title="Weekly Trend (Last 5 Weeks)"
                                >
                                  <TrendingUp className="h-4 w-4" />
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

      {/* Ads & Discount Dialog */}
      <AdsDiscountDialog
        area={adsDiscountDialogArea || ''}
        open={!!adsDiscountDialogArea}
        onClose={() => setAdsDiscountDialogArea(null)}
      />

      {/* Weekly Trend Dialog */}
      <WeeklyTrendDialog
        area={weeklyTrendDialogArea || ''}
        open={!!weeklyTrendDialogArea}
        onClose={() => setWeeklyTrendDialogArea(null)}
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
