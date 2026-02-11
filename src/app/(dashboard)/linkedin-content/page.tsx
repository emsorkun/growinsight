/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState, Fragment, useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  LabelList,
} from 'recharts';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  type AggregatedData,
  type Channel,
  type MonthlyMarketShare,
  type MarketShareByAreaExtended,
  type MarketShareByCuisine,
  type MissingBrand,
  CHANNEL_COLORS,
} from '@/types';
import { formatPercentage } from '@/lib/data-utils';
import {
  Copy,
  Check,
  BarChart3,
  PieChart,
  TrendingUp,
  Layers,
  Target,
  Megaphone,
  Zap,
  Crown,
  ArrowUpDown,
  MapPin,
  UtensilsCrossed,
  Search,
  Trophy,
  Flame,
  Signal,
  ShieldAlert,
  Sparkles,
  Cake,
} from 'lucide-react';

// ═══════════════════════════════════════════
// Types & Constants
// ═══════════════════════════════════════════

interface LinkedInPost {
  id: number;
  title: string;
  hook: string;
  body: string;
  cta: string;
  chartSuggestion: string;
  chartType: string;
  chartData: any;
  chartFormatValue?: (v: number) => string;
  icon: React.ReactNode;
  tags: string[];
}

interface DashboardData {
  summary: {
    totalOrders: number;
    totalNetSales: number;
    totalGrossSales: number;
    totalAdsSpend: number;
    totalDiscountSpend: number;
  };
  channelData: AggregatedData[];
  monthlyData: MonthlyMarketShare[];
  filterOptions: {
    months: string[];
    cities: string[];
    areas: string[];
    cuisines: string[];
  };
}

const CHANNELS: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

const GRADIENT_COLORS: Record<string, [string, string]> = {
  Talabat: ['#F97316', '#FDBA74'],
  Deliveroo: ['#06B6D4', '#67E8F9'],
  Careem: ['#10B981', '#6EE7B7'],
  Noon: ['#EAB308', '#FDE047'],
  Keeta: ['#6B7280', '#D1D5DB'],
};

// ═══════════════════════════════════════════
// Data Fetcher
// ═══════════════════════════════════════════

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch('/api/dashboard');
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to fetch data');
  return result.data;
}

async function fetchAreaData(): Promise<MarketShareByAreaExtended[]> {
  const res = await fetch('/api/areas');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch area data');
  return json.data;
}

async function fetchCuisineData(): Promise<MarketShareByCuisine[]> {
  const res = await fetch('/api/cuisines');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch cuisine data');
  return json.data;
}

async function fetchMissingBrandsData(): Promise<MissingBrand[]> {
  const res = await fetch('/api/missing-brands');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch missing brands');
  return json.data;
}

// ═══════════════════════════════════════════
// SVG Gradient Definitions (rendered once)
// ═══════════════════════════════════════════

function GradientDefs() {
  return (
    <svg className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
      <defs>
        {Object.entries(GRADIENT_COLORS).map(([name, [c1, c2]]) => (
          <Fragment key={name}>
            <linearGradient id={`gv-${name}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c2} />
              <stop offset="100%" stopColor={c1} />
            </linearGradient>
            <linearGradient id={`gh-${name}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
            <linearGradient id={`ga-${name}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c1} stopOpacity={0.65} />
              <stop offset="100%" stopColor={c1} stopOpacity={0.05} />
            </linearGradient>
          </Fragment>
        ))}
        <linearGradient id="gv-ads" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="gv-discounts" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ═══════════════════════════════════════════
// Shared Chart Primitives
// ═══════════════════════════════════════════

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 shadow-2xl backdrop-blur-sm">
      {label != null && label !== '' && (
        <p className="mb-1 text-[11px] font-medium text-slate-400">{label}</p>
      )}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color || entry.fill || entry.payload?.color || '#fff' }}
          />
          <span className="text-slate-400">{entry.name ?? entry.dataKey}</span>
          <span className="ml-auto font-semibold text-white">
            {formatter ? formatter(Number(entry.value)) : Number(entry.value).toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartShell({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <div className="space-y-1.5">
      <div className="group/chart relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 ring-1 ring-white/[0.07]">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-500/[0.06] blur-3xl" />
        {/* Shimmer on hover */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transition-transform duration-[1500ms] ease-in-out group-hover/chart:translate-x-full" />
        {/* Chart */}
        <div className="relative px-2 pb-2 pt-3">{children}</div>
      </div>
      <p className="pl-1 text-[11px] italic text-muted-foreground/60">{caption}</p>
    </div>
  );
}

// ═══════════════════════════════════════════
// Mini Chart Components
// ═══════════════════════════════════════════

function MiniDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const uid = useId().replace(/:/g, '');
  return (
    <div className="relative h-[210px]">
      <ResponsiveContainer>
        <RechartsPieChart>
          <defs>
            {data.map((d, i) => {
              const [c1, c2] = GRADIENT_COLORS[d.name] || [d.color, d.color];
              return (
                <linearGradient key={i} id={`dn-${uid}-${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={c1} />
                  <stop offset="100%" stopColor={c2} />
                </linearGradient>
              );
            })}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={76}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            strokeWidth={0}
            animationDuration={900}
            animationEasing="ease-out"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#dn-${uid}-${i})`} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ paddingTop: 4 }}
            formatter={(value: string) => (
              <span style={{ color: '#94A3B8', fontSize: 10, fontWeight: 500 }}>{value}</span>
            )}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniBar({
  data,
  horizontal,
  formatValue,
}: {
  data: { name: string; value: number; color: string }[];
  horizontal?: boolean;
  formatValue?: (v: number) => string;
}) {
  const fmt = formatValue || ((v: number) => v.toFixed(1));
  const gp = horizontal ? 'gh' : 'gv';

  return (
    <div className="h-[210px]">
      <ResponsiveContainer>
        <RechartsBarChart
          data={data}
          layout={horizontal ? 'vertical' : undefined}
          margin={
            horizontal
              ? { top: 8, right: 56, left: 5, bottom: 8 }
              : { top: 24, right: 10, left: 10, bottom: 5 }
          }
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            horizontal={horizontal ? false : undefined}
            vertical={horizontal ? undefined : false}
          />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                tick={{ fill: '#CBD5E1', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
            </>
          )}
          <Tooltip content={<ChartTooltip formatter={fmt} />} />
          <Bar
            dataKey="value"
            radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            barSize={horizontal ? 24 : 36}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={GRADIENT_COLORS[d.name] ? `url(#${gp}-${d.name})` : d.color}
              />
            ))}
            <LabelList
              dataKey="value"
              position={horizontal ? 'right' : 'top'}
              formatter={(v: any) => fmt(Number(v))}
              style={{ fill: '#E2E8F0', fontSize: 10, fontWeight: 600 }}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniStackedArea({ data }: { data: Record<string, any>[] }) {
  return (
    <div className="h-[210px]">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#64748B', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
          <Legend
            verticalAlign="top"
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ paddingBottom: 4 }}
            formatter={(value: string) => (
              <span style={{ color: '#94A3B8', fontSize: 9 }}>{value}</span>
            )}
          />
          {CHANNELS.map((ch) => (
            <Area
              key={ch}
              type="monotone"
              dataKey={ch}
              stackId="1"
              stroke={CHANNEL_COLORS[ch]}
              fill={`url(#ga-${ch})`}
              strokeWidth={1.5}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniGroupedBar({ data }: { data: { name: string; ads: number; discounts: number }[] }) {
  return (
    <div className="h-[210px]">
      <ResponsiveContainer>
        <RechartsBarChart data={data} margin={{ top: 24, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#CBD5E1', fontSize: 10, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
          <Legend
            verticalAlign="top"
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ paddingBottom: 4 }}
            formatter={(value: string) => (
              <span style={{ color: '#94A3B8', fontSize: 10 }}>{value}</span>
            )}
          />
          <Bar
            dataKey="ads"
            name="Ads %"
            fill="url(#gv-ads)"
            radius={[4, 4, 0, 0]}
            barSize={16}
            animationDuration={800}
          />
          <Bar
            dataKey="discounts"
            name="Discounts %"
            fill="url(#gv-discounts)"
            radius={[4, 4, 0, 0]}
            barSize={16}
            animationDuration={800}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniHorizontalStacked({
  data,
  segments,
  colors,
  nameKey,
}: {
  data: Record<string, any>[];
  segments: string[];
  colors: Record<string, string>;
  nameKey: string;
}) {
  return (
    <div className="h-[210px]">
      <ResponsiveContainer>
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ top: 24, right: 10, left: 5, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey={nameKey}
            tick={{ fill: '#CBD5E1', fontSize: 10, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
          <Legend
            verticalAlign="top"
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ paddingBottom: 4 }}
            formatter={(value: string) => (
              <span style={{ color: '#94A3B8', fontSize: 10 }}>{value}</span>
            )}
          />
          {segments.map((seg) => (
            <Bar
              key={seg}
              dataKey={seg}
              stackId="s"
              fill={colors[seg]}
              barSize={24}
              animationDuration={800}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniRingGauge({
  value,
  label,
  color,
  competitors,
}: {
  value: number;
  label: string;
  color: string;
  competitors: { name: string; value: number; color: string }[];
}) {
  const circumference = 2 * Math.PI * 52;
  const filled = (value / 100) * circumference;

  return (
    <div className="flex items-center justify-center gap-5 px-3 py-2" style={{ height: 210 }}>
      {/* Ring */}
      <div className="relative shrink-0">
        <svg width="130" height="130" viewBox="0 0 120 120" className="-rotate-90">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="9"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-bold tracking-tight text-white">
            ~{Math.round(value)}%
          </span>
          <span className="mt-0.5 text-[10px] font-medium text-slate-400">{label}</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="min-w-0 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          All Platforms
        </p>
        {competitors.map((c) => (
          <div key={c.name} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            <span className="min-w-0 truncate text-[11px] text-slate-400">{c.name}</span>
            <span className="ml-auto text-[11px] font-semibold text-slate-300">
              {c.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostChart({ post }: { post: LinkedInPost }) {
  switch (post.chartType) {
    case 'donut':
      return <MiniDonut data={post.chartData} />;
    case 'bar':
      return <MiniBar data={post.chartData} formatValue={post.chartFormatValue} />;
    case 'horizontal-bar':
      return (
        <MiniBar data={post.chartData} horizontal formatValue={post.chartFormatValue} />
      );
    case 'stacked-area':
      return <MiniStackedArea data={post.chartData} />;
    case 'grouped-bar':
      return <MiniGroupedBar data={post.chartData} />;
    case 'horizontal-stacked':
      return (
        <MiniHorizontalStacked
          data={post.chartData.data}
          segments={post.chartData.segments}
          colors={post.chartData.colors}
          nameKey={post.chartData.nameKey}
        />
      );
    case 'ring-gauge':
      return <MiniRingGauge {...post.chartData} />;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════
// Content Generation
// ═══════════════════════════════════════════

function generateLinkedInPosts(
  channelData: AggregatedData[],
  monthlyData: MonthlyMarketShare[]
): LinkedInPost[] {
  const sorted = [...channelData].sort((a, b) => b.orders - a.orders);
  const totalOrders = sorted.reduce((s, d) => s + d.orders, 0);
  if (!sorted.length || totalOrders === 0) return [];

  const leader = sorted[0];
  const leaderShare = (leader.orders / totalOrders) * 100;

  const roasSorted = [...channelData].filter((d) => d.roas > 0).sort((a, b) => b.roas - a.roas);
  const bestRoas = roasSorted[0];
  const worstRoas = roasSorted[roasSorted.length - 1];
  const roasSpread =
    bestRoas && worstRoas ? bestRoas.roas / Math.max(worstRoas.roas, 0.01) : 1;

  const aovSorted = [...channelData].filter((d) => d.aov > 0).sort((a, b) => b.aov - a.aov);
  const highAov = aovSorted[0];
  const lowAov = aovSorted[aovSorted.length - 1];

  const marketingRatios = channelData
    .filter((d) => d.grossSales > 0)
    .map((d) => ({
      channel: d.channel,
      adsRatio: (d.adsSpend / d.grossSales) * 100,
      discountRatio: (d.discountSpend / d.grossSales) * 100,
      totalRatio: ((d.adsSpend + d.discountSpend) / d.grossSales) * 100,
    }));
  const highestMarketing = [...marketingRatios].sort((a, b) => b.totalRatio - a.totalRatio)[0];
  const lowestMarketing = [...marketingRatios].sort((a, b) => a.totalRatio - b.totalRatio)[0];

  // Trends
  const recentMonths = monthlyData.slice(-3);
  const olderMonths = monthlyData.slice(-6, -3);
  const trends: { channel: Channel; delta: number }[] = [];
  if (recentMonths.length > 0 && olderMonths.length > 0) {
    CHANNELS.forEach((ch) => {
      const recent =
        recentMonths.reduce((s, m) => s + (m.marketShare[ch] || 0), 0) / recentMonths.length;
      const older =
        olderMonths.reduce((s, m) => s + (m.marketShare[ch] || 0), 0) / olderMonths.length;
      trends.push({ channel: ch, delta: recent - older });
    });
  }
  const fastGrower = [...trends].sort((a, b) => b.delta - a.delta)[0];
  const bigDecliner = [...trends].sort((a, b) => a.delta - b.delta)[0];

  const efficiencyData = channelData
    .filter((d) => d.grossSales > 0)
    .map((d) => ({
      channel: d.channel,
      efficiency: (d.netSales / d.grossSales) * 100,
    }))
    .sort((a, b) => b.efficiency - a.efficiency);

  const adsVsDiscount = channelData.map((d) => ({
    channel: d.channel,
    adsSpend: d.adsSpend,
    discountSpend: d.discountSpend,
    adsHeavy: d.adsSpend > d.discountSpend,
  }));

  // Illustrative area data
  const baseShares: Record<string, number> = {};
  sorted.forEach((d) => {
    baseShares[d.channel] = (d.orders / totalOrders) * 100;
  });

  function makeAreaRow(label: string, leaderDelta: number) {
    const raw: Record<string, number> = {};
    CHANNELS.forEach((ch) => {
      raw[ch] =
        ch === leader.channel
          ? Math.max((baseShares[ch] || 0) + leaderDelta, 10)
          : Math.max((baseShares[ch] || 0) - leaderDelta / (CHANNELS.length - 1), 2);
    });
    const total = Object.values(raw).reduce((s, v) => s + v, 0);
    CHANNELS.forEach((ch) => {
      raw[ch] = parseFloat(((raw[ch] / total) * 100).toFixed(1));
    });
    return { area: label, ...raw };
  }

  const top2Share = sorted.slice(0, 2).reduce((s, d) => s + (d.orders / totalOrders) * 100, 0);

  // ── 10 Posts ──

  return [
    // 1  Market Share
    {
      id: 1,
      title: 'The UAE Food Delivery Power Ranking',
      hook: `The UAE food delivery market isn't a duopoly — it's a ${sorted.filter((d) => d.orders > 0).length}-player race.\n\nBut one platform still commands ~${Math.round(leaderShare)}% of all orders.`,
      body: `We analyzed order volumes across every major food delivery platform in the UAE.\n\nHere's what the data shows:\n\n${sorted
        .slice(0, 3)
        .map(
          (d, i) =>
            `${i + 1}. ${d.channel} — ~${formatPercentage((d.orders / totalOrders) * 100)} market share`
        )
        .join('\n')}\n\nThe remaining platforms split the rest. But market share alone doesn't tell the full story — revenue per order and profitability paint a very different picture.`,
      cta: 'Which platform do you think delivers the best value for restaurants? Drop your take below.',
      chartSuggestion: 'Attach as image — order distribution by platform (percentages only)',
      chartType: 'donut',
      chartData: sorted
        .filter((d) => d.orders > 0)
        .map((d) => ({
          name: d.channel,
          value: parseFloat(((d.orders / totalOrders) * 100).toFixed(1)),
          color: CHANNEL_COLORS[d.channel as Channel],
        })),
      icon: <PieChart className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#UAE', '#MarketShare', '#FoodTech'],
    },

    // 2  ROAS
    {
      id: 2,
      title: 'Which Platform Gives the Best Ad Returns?',
      hook: `Not all food delivery ad spend is created equal.\n\nThe ROAS gap between the best and worst-performing platform in the UAE is ${roasSpread.toFixed(1)}x.`,
      body: `We tracked Return on Ad Spend across every major delivery channel in the UAE.\n\nThe results are eye-opening:\n\n${
        bestRoas
          ? `• ${bestRoas.channel} leads with a ROAS of ${bestRoas.roas.toFixed(1)}x — for every AED 1 spent, restaurants get AED ${bestRoas.roas.toFixed(1)} back`
          : ''
      }\n${
        worstRoas && worstRoas.channel !== bestRoas?.channel
          ? `• ${worstRoas.channel} sits at ${worstRoas.roas.toFixed(1)}x — positive, but a fraction of the leader`
          : ''
      }\n\nThis means restaurants could be losing significant revenue by not allocating ad budgets to the right platforms.`,
      cta: 'Are you optimizing your ad spend across platforms, or spreading it evenly? Let me know your strategy.',
      chartSuggestion: 'Attach as image — ROAS comparison across platforms',
      chartType: 'horizontal-bar',
      chartData: roasSorted.map((d) => ({
        name: d.channel,
        value: parseFloat(d.roas.toFixed(2)),
        color: CHANNEL_COLORS[d.channel as Channel],
      })),
      chartFormatValue: (v: number) => `${v.toFixed(1)}x`,
      icon: <Target className="h-5 w-5" />,
      tags: ['#ROAS', '#DigitalMarketing', '#FoodDelivery', '#UAE'],
    },

    // 3  AOV
    {
      id: 3,
      title: 'The Average Order Value Gap Nobody Talks About',
      hook: `Customers on ${highAov?.channel || 'one platform'} spend ${highAov && lowAov ? `${((highAov.aov / lowAov.aov - 1) * 100).toFixed(0)}%` : 'significantly'} more per order than on ${lowAov?.channel || 'another'}.\n\nSame city. Same cuisines. Completely different basket sizes.`,
      body: `We compared Average Order Values across UAE food delivery platforms.\n\n${aovSorted
        .map((d) => `• ${d.channel}: AED ${d.aov.toFixed(0)} average per order`)
        .join('\n')}\n\nThis reflects customer demographics, menu curation, and platform UX that encourages upselling.\n\nFor restaurant operators, your revenue-per-order strategy should be platform-specific, not one-size-fits-all.`,
      cta: 'What do you think drives the AOV difference — the customer base or the platform design?',
      chartSuggestion: 'Attach as image — AOV by platform (AED values, safe to share)',
      chartType: 'bar',
      chartData: aovSorted.map((d) => ({
        name: d.channel,
        value: parseFloat(d.aov.toFixed(0)),
        color: CHANNEL_COLORS[d.channel as Channel],
      })),
      chartFormatValue: (v: number) => `AED ${v.toFixed(0)}`,
      icon: <BarChart3 className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#AOV', '#RestaurantBusiness', '#UAE'],
    },

    // 4  Monthly Trends
    {
      id: 4,
      title: 'The Market Share Shift You Missed This Year',
      hook: fastGrower
        ? `${fastGrower.channel} gained ~${Math.abs(fastGrower.delta).toFixed(1)} percentage points of market share in the last quarter.\n\n${bigDecliner ? `${bigDecliner.channel} lost ~${Math.abs(bigDecliner.delta).toFixed(1)} points in the same period.` : ''}\n\nThe UAE delivery landscape is reshuffling.`
        : 'The UAE food delivery market share is shifting faster than most realize.',
      body: `We tracked monthly market share across all major delivery platforms in the UAE throughout 2025.\n\nKey findings:\n\n• The market is becoming ${
        trends.some((t) => Math.abs(t.delta) > 2) ? 'more competitive' : 'more stable'
      } — ${trends.filter((t) => Math.abs(t.delta) > 1).length} platforms saw meaningful shifts\n• New entrants are ${
        trends.some(
          (t) => t.delta > 1 && (t.channel === 'Keeta' || t.channel === 'Noon')
        )
          ? 'gaining ground fast'
          : 'still finding their footing'
      }\n• The top player's dominance is ${leaderShare > 40 ? 'holding strong but slowly eroding' : 'being challenged'}\n\nThis data tells a story of a maturing market where customer loyalty is up for grabs.`,
      cta: 'Which platform do you think will gain the most ground by end of 2025?',
      chartSuggestion: 'Attach as image — monthly market share trend (percentages only)',
      chartType: 'stacked-area',
      chartData: monthlyData.map((m) => ({ month: m.month, ...m.marketShare })),
      icon: <TrendingUp className="h-5 w-5" />,
      tags: ['#FoodTech', '#MarketTrends', '#UAE', '#FoodDelivery'],
    },

    // 5  Marketing Efficiency
    {
      id: 5,
      title: 'How Much of Your Revenue Goes to Platform Marketing?',
      hook: `Some platforms consume up to ${highestMarketing ? `${highestMarketing.totalRatio.toFixed(0)}%` : '15%'} of gross sales in combined ads + discounts.\n\nOthers? As low as ${lowestMarketing ? `${lowestMarketing.totalRatio.toFixed(0)}%` : '5%'}.\n\nThe difference is massive.`,
      body: `We broke down total marketing spend (ads + discounts) as a percentage of gross sales across every platform.\n\n${marketingRatios
        .sort((a, b) => b.totalRatio - a.totalRatio)
        .map(
          (d) =>
            `• ${d.channel}: ~${d.totalRatio.toFixed(1)}% of gross goes to marketing (${d.adsRatio.toFixed(1)}% ads, ${d.discountRatio.toFixed(1)}% discounts)`
        )
        .join('\n')}\n\nRestaurants on high-cost platforms aren't necessarily losing money — but they need higher volumes to compensate.`,
      cta: "What's your acceptable marketing-to-revenue ratio for delivery platforms?",
      chartSuggestion: 'Attach as image — ads % vs discount % side by side per platform',
      chartType: 'grouped-bar',
      chartData: marketingRatios.map((d) => ({
        name: d.channel,
        ads: parseFloat(d.adsRatio.toFixed(1)),
        discounts: parseFloat(d.discountRatio.toFixed(1)),
      })),
      icon: <Megaphone className="h-5 w-5" />,
      tags: ['#RestaurantMarketing', '#FoodDelivery', '#MarketingROI', '#UAE'],
    },

    // 6  Ads vs Discounts Split
    {
      id: 6,
      title: "Ads vs. Discounts — Where's the Money Going?",
      hook: `In UAE food delivery, some platforms bet heavily on ads.\nOthers rely on discounts to drive orders.\n\nThe data shows a clear split in strategy.`,
      body: `We analyzed the ratio of ad spend to discount spend across platforms:\n\n${adsVsDiscount
        .map(
          (d) =>
            `• ${d.channel}: ${d.adsHeavy ? 'Ads-heavy' : 'Discount-heavy'} — ${
              d.adsSpend > d.discountSpend
                ? `ad spend is ${d.discountSpend > 0 ? `${(d.adsSpend / d.discountSpend).toFixed(1)}x` : 'significantly higher than'} discount spend`
                : `discount spend is ${d.adsSpend > 0 ? `${(d.discountSpend / d.adsSpend).toFixed(1)}x` : 'significantly higher than'} ad spend`
            }`
        )
        .join('\n')}\n\nAds build visibility. Discounts build trial. The smartest operators know when to use each lever.`,
      cta: 'For your restaurant, which has driven better results — paid ads or discounts?',
      chartSuggestion: 'Attach as image — proportion of marketing budget: ads vs discounts',
      chartType: 'horizontal-stacked',
      chartData: {
        data: channelData
          .filter((d) => d.adsSpend + d.discountSpend > 0)
          .map((d) => {
            const t = d.adsSpend + d.discountSpend;
            return {
              name: d.channel,
              Ads: parseFloat(((d.adsSpend / t) * 100).toFixed(1)),
              Discounts: parseFloat(((d.discountSpend / t) * 100).toFixed(1)),
            };
          }),
        segments: ['Ads', 'Discounts'],
        colors: { Ads: '#3B82F6', Discounts: '#F59E0B' },
        nameKey: 'name',
      },
      icon: <Layers className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#GrowthStrategy', '#UAE', '#RestaurantOps'],
    },

    // 7  Dominance Stat
    {
      id: 7,
      title: `${leader.channel} Still Runs the UAE — But for How Long?`,
      hook: `~${Math.round(leaderShare)}% of food delivery orders in the UAE go through a single platform.\n\nThat's ${leader.channel}.\n\nBut here's why that number should worry them.`,
      body: `Market dominance in food delivery is notoriously fragile.\n\nThe data for UAE shows:\n\n• ${leader.channel} holds the largest share, but it ${
        trends.find((t) => t.channel === leader.channel)?.delta !== undefined &&
        trends.find((t) => t.channel === leader.channel)!.delta < 0
          ? 'peaked months ago and is slowly declining'
          : 'is maintaining its position — for now'
      }\n• ${sorted.length > 1 ? `${sorted[1].channel} is the closest challenger at ~${formatPercentage((sorted[1].orders / totalOrders) * 100)}` : ''}\n• Newer players are investing aggressively in marketing and restaurant acquisition\n\nThe question isn't whether the market will fragment — it's how fast.`,
      cta: 'Do you think the leading platform can maintain dominance, or will we see a more balanced market?',
      chartSuggestion: 'Attach as image — leader share ring gauge with competitor breakdown',
      chartType: 'ring-gauge',
      chartData: {
        value: leaderShare,
        label: leader.channel,
        color: CHANNEL_COLORS[leader.channel as Channel],
        competitors: sorted.map((d) => ({
          name: d.channel,
          value: parseFloat(((d.orders / totalOrders) * 100).toFixed(1)),
          color: CHANNEL_COLORS[d.channel as Channel],
        })),
      },
      icon: <Crown className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#MarketDominance', '#UAE', '#Competition'],
    },

    // 8  Revenue Efficiency
    {
      id: 8,
      title: 'Net vs. Gross — The Revenue Efficiency Scorecard',
      hook: `Not every AED of gross sales makes it to your bottom line.\n\nAcross UAE delivery platforms, restaurants keep between ${
        efficiencyData.length > 0
          ? `${efficiencyData[efficiencyData.length - 1].efficiency.toFixed(0)}% and ${efficiencyData[0].efficiency.toFixed(0)}%`
          : '75% and 90%'
      } of gross revenue as net.`,
      body: `We calculated the net-to-gross revenue ratio per platform.\n\n${efficiencyData
        .map((d) => `• ${d.channel}: ${d.efficiency.toFixed(1)}% revenue retention`)
        .join('\n')}\n\nThe gap between best and worst is ${
        efficiencyData.length >= 2
          ? `${(efficiencyData[0].efficiency - efficiencyData[efficiencyData.length - 1].efficiency).toFixed(1)} percentage points`
          : 'significant'
      }.\n\nOn thousands of monthly orders, that difference translates to substantial revenue.\n\nKnow your numbers. Negotiate accordingly.`,
      cta: 'Are you tracking net-to-gross by platform? What has your experience been?',
      chartSuggestion: 'Attach as image — revenue retention % per platform',
      chartType: 'horizontal-bar',
      chartData: efficiencyData.map((d) => ({
        name: d.channel,
        value: parseFloat(d.efficiency.toFixed(1)),
        color: CHANNEL_COLORS[d.channel as Channel],
      })),
      chartFormatValue: (v: number) => `${v.toFixed(1)}%`,
      icon: <ArrowUpDown className="h-5 w-5" />,
      tags: ['#RestaurantFinance', '#FoodDelivery', '#Revenue', '#UAE'],
    },

    // 9  New Entrant Spotlight
    {
      id: 9,
      title: 'The Quiet Rise of Newer Delivery Platforms in UAE',
      hook: `While everyone watches the top 2, the real story is what's happening with ${
        sorted.length > 2
          ? sorted
              .slice(2)
              .map((d) => d.channel)
              .join(', ')
          : 'newer platforms'
      }.\n\nTheir combined share is already ~${formatPercentage(100 - top2Share)}.`,
      body: `The UAE food delivery market is often discussed as a two-horse race. The data disagrees.\n\n${
        sorted.length > 2
          ? sorted
              .slice(2)
              .map(
                (d) =>
                  `• ${d.channel}: capturing ~${formatPercentage((d.orders / totalOrders) * 100)} of orders${d.roas > 0 ? ` with a ${d.roas.toFixed(1)}x ROAS` : ''}`
              )
              .join('\n')
          : '• Smaller platforms are collectively building meaningful share'
      }\n\nFor restaurant operators, these platforms often offer:\n- Lower commission rates\n- Better ad ROAS (less competition for visibility)\n- Customers with higher basket sizes on some platforms\n\nDiversifying across channels isn't just risk management — it's a growth strategy.`,
      cta: "Have you expanded beyond the top 2 platforms? What was your experience? Let's discuss.",
      chartSuggestion: 'Attach as image — pie showing top 2 vs emerging platforms',
      chartType: 'donut',
      chartData: [
        {
          name: sorted.length >= 2 ? `${sorted[0].channel} + ${sorted[1].channel}` : 'Top 2',
          value: parseFloat(top2Share.toFixed(1)),
          color: '#475569',
        },
        ...sorted.slice(2).map((d) => ({
          name: d.channel,
          value: parseFloat(((d.orders / totalOrders) * 100).toFixed(1)),
          color: CHANNEL_COLORS[d.channel as Channel],
        })),
      ],
      icon: <Zap className="h-5 w-5" />,
      tags: ['#FoodTech', '#UAE', '#StartupGrowth', '#FoodDelivery'],
    },

    // 10  Area Insights
    {
      id: 10,
      title: 'Not All Areas Are Created Equal for Delivery',
      hook: `In the UAE, food delivery competition varies wildly by neighborhood.\n\nSome areas have ${sorted.filter((d) => d.orders > 0).length} active platforms battling it out.\nOthers are practically monopolies.`,
      body: `We mapped delivery market share at the area level and found dramatic differences.\n\n• Premium areas (Marina, Downtown, JBR) show the most competitive distribution\n• Outer areas often have 1-2 dominant players with minimal competition\n• Areas with more cuisine diversity tend to have more platform diversity\n• ${leader.channel}'s share varies from ~60%+ in some areas to under 30% in others\n\nYour channel strategy should be hyper-local. What works in Downtown Dubai may not work in Ajman.\n\nOne-size-fits-all delivery strategies leave money on the table.`,
      cta: 'Does your restaurant adjust its delivery strategy by location? What patterns have you noticed?',
      chartSuggestion: 'Attach as image — illustrative area comparison (based on market patterns)',
      chartType: 'horizontal-stacked',
      chartData: {
        data: [makeAreaRow('Premium', -10), makeAreaRow('Mid-tier', 0), makeAreaRow('Suburban', 15)],
        segments: CHANNELS as string[],
        colors: Object.fromEntries(CHANNELS.map((ch) => [ch, CHANNEL_COLORS[ch]])) as Record<
          string,
          string
        >,
        nameKey: 'area',
      },
      icon: <MapPin className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#UAE', '#LocalBusiness', '#DataDriven'],
    },
  ];
}

// ═══════════════════════════════════════════
// Deep Dive Content Generation (Posts 11-20)
// ═══════════════════════════════════════════

/** Herfindahl-Hirschman Index — lower = more competitive */
function hhi(ms: Record<Channel, number>) {
  return CHANNELS.reduce((s, ch) => s + Math.pow(ms[ch] || 0, 2), 0);
}

function findCuisine(data: MarketShareByCuisine[], ...terms: string[]) {
  return data.find((c) =>
    terms.some((t) => c.cuisine.toLowerCase().includes(t.toLowerCase()))
  );
}

function leaderOf(ms: Record<Channel, number>): { ch: Channel; share: number } {
  let best: Channel = CHANNELS[0];
  CHANNELS.forEach((ch) => {
    if ((ms[ch] || 0) > (ms[best] || 0)) best = ch;
  });
  return { ch: best, share: ms[best] || 0 };
}

function generateDeepDivePosts(
  channelData: AggregatedData[],
  areaData: MarketShareByAreaExtended[],
  cuisineData: MarketShareByCuisine[],
  missingBrands: MissingBrand[]
): LinkedInPost[] {
  const sorted = [...channelData].sort((a, b) => b.orders - a.orders);
  const totalOrders = sorted.reduce((s, d) => s + d.orders, 0);
  if (!sorted.length || totalOrders === 0) return [];
  const overallLeader = sorted[0].channel as Channel;

  // ── Analysis helpers ──

  const areasWithHHI = areaData
    .filter((a) => a.totalOrders > 0)
    .map((a) => ({ ...a, hhi: hhi(a.marketShare) }));
  const mostCompetitive = [...areasWithHHI].sort((a, b) => a.hhi - b.hhi)[0];
  const mostMonopolistic = [...areasWithHHI].sort((a, b) => b.hhi - a.hhi)[0];

  const areasWhereUnderdogWins = areasWithHHI.filter((a) => {
    const leader = leaderOf(a.marketShare);
    return leader.ch !== overallLeader && a.totalOrders > 5000;
  });

  const cuisinesWithHHI = cuisineData.map((c) => ({ ...c, hhi: hhi(c.marketShare) }));
  const mostBalancedCuisine = [...cuisinesWithHHI].sort((a, b) => a.hhi - b.hhi)[0];

  const cuisinesWhereLeaderWeakest = [...cuisineData]
    .filter((c) => (c.marketShare[overallLeader] || 0) > 0)
    .sort((a, b) => (a.marketShare[overallLeader] || 0) - (b.marketShare[overallLeader] || 0));

  const lowSignalAreas = areasWithHHI
    .filter((a) => a.signalStrength <= 2)
    .sort((a, b) => a.signalStrength - b.signalStrength);

  const hotZone = [...areasWithHHI]
    .filter((a) => a.signalStrength >= 4)
    .sort((a, b) => b.totalOrders - a.totalOrders)[0];

  // Missing brands by cuisine
  const missingByCuisine: Record<string, number> = {};
  missingBrands.forEach((b) => {
    missingByCuisine[b.cuisine] = (missingByCuisine[b.cuisine] || 0) + 1;
  });
  const missingCuisineSorted = Object.entries(missingByCuisine)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Find specific cuisines
  const shawarma = findCuisine(cuisineData, 'shawarma', 'middle eastern');
  const desserts = findCuisine(cuisineData, 'dessert', 'sweets', 'bakery');
  const fastFood = findCuisine(cuisineData, 'fast food', 'american', 'burger');
  const indian = findCuisine(cuisineData, 'indian');

  // ── Helpers to build chart data from market share ──

  function msToBarData(ms: Record<Channel, number>) {
    return CHANNELS.filter((ch) => (ms[ch] || 0) > 0)
      .map((ch) => ({
        name: ch,
        value: parseFloat((ms[ch] || 0).toFixed(1)),
        color: CHANNEL_COLORS[ch],
      }))
      .sort((a, b) => b.value - a.value);
  }

  function msToDonutData(ms: Record<Channel, number>) {
    return CHANNELS.filter((ch) => (ms[ch] || 0) > 0.5).map((ch) => ({
      name: ch,
      value: parseFloat((ms[ch] || 0).toFixed(1)),
      color: CHANNEL_COLORS[ch],
    }));
  }

  // ── 10 Deep Dive Posts ──

  const posts: LinkedInPost[] = [];

  // 11 — The Shawarma Wars
  if (shawarma) {
    const leader = leaderOf(shawarma.marketShare);
    const runner = CHANNELS.filter((ch) => ch !== leader.ch).sort(
      (a, b) => (shawarma.marketShare[b] || 0) - (shawarma.marketShare[a] || 0)
    )[0];
    posts.push({
      id: 11,
      title: `The ${shawarma.cuisine} Wars — Who Owns This Category?`,
      hook: `${leader.ch} captures ~${leader.share.toFixed(0)}% of all ${shawarma.cuisine.toLowerCase()} delivery orders in the UAE.\n\n${runner ? `${runner} is the closest competitor at ~${(shawarma.marketShare[runner] || 0).toFixed(0)}%.` : ''}\n\nBut is that the same ranking as overall? Not even close.`,
      body: `We broke down market share by cuisine category and ${shawarma.cuisine.toLowerCase()} tells an interesting story:\n\n${CHANNELS.filter((ch) => (shawarma.marketShare[ch] || 0) > 1)
        .sort((a, b) => (shawarma.marketShare[b] || 0) - (shawarma.marketShare[a] || 0))
        .map((ch) => `• ${ch}: ~${(shawarma.marketShare[ch] || 0).toFixed(1)}%`)
        .join('\n')}\n\nThe platform that dominates overall doesn't always dominate specific cuisines. For ${shawarma.cuisine.toLowerCase()} restaurants, this means your best channel might not be the biggest channel.\n\nThe data is clear: cuisine-specific strategy beats generic strategy every time.`,
      cta: `If you run a ${shawarma.cuisine.toLowerCase()} restaurant, are you on the platform that actually leads your category?`,
      chartSuggestion: `Attach as image — ${shawarma.cuisine} market share by platform`,
      chartType: 'horizontal-bar',
      chartData: msToBarData(shawarma.marketShare),
      chartFormatValue: (v: number) => `${v.toFixed(1)}%`,
      icon: <UtensilsCrossed className="h-5 w-5" />,
      tags: ['#FoodDelivery', `#${shawarma.cuisine.replace(/\s/g, '')}`, '#UAE', '#RestaurantStrategy'],
    });
  }

  // 12 — Two Neighborhoods, Two Universes
  if (mostCompetitive && mostMonopolistic && mostCompetitive.area !== mostMonopolistic.area) {
    const compLeader = leaderOf(mostCompetitive.marketShare);
    const monoLeader = leaderOf(mostMonopolistic.marketShare);
    posts.push({
      id: 12,
      title: `${mostCompetitive.area} vs ${mostMonopolistic.area} — Two Delivery Universes`,
      hook: `In ${mostCompetitive.area}, the top platform holds just ~${compLeader.share.toFixed(0)}% of orders.\n\nIn ${mostMonopolistic.area}? One platform owns ~${monoLeader.share.toFixed(0)}%.\n\nSame country. Completely different competitive dynamics.`,
      body: `We analyzed market share at the area level and found dramatic contrasts:\n\n${mostCompetitive.area} (${mostCompetitive.city}):\n${CHANNELS.filter((ch) => (mostCompetitive.marketShare[ch] || 0) > 2)
        .sort((a, b) => (mostCompetitive.marketShare[b] || 0) - (mostCompetitive.marketShare[a] || 0))
        .map((ch) => `  • ${ch}: ~${(mostCompetitive.marketShare[ch] || 0).toFixed(0)}%`)
        .join('\n')}\n\n${mostMonopolistic.area} (${mostMonopolistic.city}):\n${CHANNELS.filter((ch) => (mostMonopolistic.marketShare[ch] || 0) > 2)
        .sort((a, b) => (mostMonopolistic.marketShare[b] || 0) - (mostMonopolistic.marketShare[a] || 0))
        .map((ch) => `  • ${ch}: ~${(mostMonopolistic.marketShare[ch] || 0).toFixed(0)}%`)
        .join('\n')}\n\nFor restaurants operating in competitive zones — you have options. For restaurants in monopolistic areas — diversifying could be your growth lever.`,
      cta: `Which area do you operate in? Is your delivery landscape competitive or monopolistic?`,
      chartSuggestion: 'Attach as image — side-by-side area comparison',
      chartType: 'horizontal-stacked',
      chartData: {
        data: [
          { area: mostCompetitive.area, ...Object.fromEntries(CHANNELS.map((ch) => [ch, parseFloat((mostCompetitive.marketShare[ch] || 0).toFixed(1))])) },
          { area: mostMonopolistic.area, ...Object.fromEntries(CHANNELS.map((ch) => [ch, parseFloat((mostMonopolistic.marketShare[ch] || 0).toFixed(1))])) },
        ],
        segments: CHANNELS as string[],
        colors: Object.fromEntries(CHANNELS.map((ch) => [ch, CHANNEL_COLORS[ch]])) as Record<string, string>,
        nameKey: 'area',
      },
      icon: <MapPin className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#UAE', '#AreaAnalysis', '#RestaurantOps'],
    });
  }

  // 13 — The Cuisine Nobody Can Own
  if (mostBalancedCuisine) {
    const leader = leaderOf(mostBalancedCuisine.marketShare);
    posts.push({
      id: 13,
      title: `${mostBalancedCuisine.cuisine} — The Cuisine No Platform Can Dominate`,
      hook: `In a market where one platform controls ~${((sorted[0].orders / totalOrders) * 100).toFixed(0)}% of orders overall…\n\n…${mostBalancedCuisine.cuisine.toLowerCase()} is the great equalizer.\n\nThe top platform only holds ~${leader.share.toFixed(0)}% in this category.`,
      body: `When we ranked cuisines by competitive intensity, ${mostBalancedCuisine.cuisine.toLowerCase()} stood out as the most evenly distributed:\n\n${msToBarData(mostBalancedCuisine.marketShare)
        .map((d) => `• ${d.name}: ~${d.value}%`)
        .join('\n')}\n\nWhy does this matter?\n\n• Restaurants in this cuisine have genuine platform choice\n• No single platform has pricing power over the category\n• Marketing spend goes further when you're not competing against a dominant player\n\nIf you serve ${mostBalancedCuisine.cuisine.toLowerCase()}, you have leverage most restaurants don't.`,
      cta: `Restaurant owners in the ${mostBalancedCuisine.cuisine.toLowerCase()} category — which platform gives you the best results?`,
      chartSuggestion: `Attach as image — ${mostBalancedCuisine.cuisine} market share distribution`,
      chartType: 'donut',
      chartData: msToDonutData(mostBalancedCuisine.marketShare),
      icon: <Sparkles className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#CuisineInsights', '#UAE', '#RestaurantBusiness'],
    });
  }

  // 14 — The Platform Gap (Missing Brands)
  if (missingBrands.length > 0) {
    posts.push({
      id: 14,
      title: `${missingBrands.length}+ Brands on Talabat Are Missing From Careem`,
      hook: `We ran a cross-platform audit.\n\n${missingBrands.length}+ restaurant brands that exist on Talabat have zero presence on Careem.\n\nThat's a massive acquisition opportunity — and a blind spot for those brands.`,
      body: `The gap isn't random. It clusters around specific cuisines:\n\n${missingCuisineSorted
        .map(([cuisine, count]) => `• ${cuisine}: ${count} brands missing`)
        .join('\n')}\n\nFor Careem: This is low-hanging fruit for restaurant acquisition teams.\n\nFor restaurant owners on Talabat-only: You're missing an entire customer base. Careem users search for your cuisine and can't find you.\n\nFor multi-platform operators: Less competition on Careem means better visibility and potentially lower ad costs in these categories.`,
      cta: `Is your restaurant on every platform where your customers are? Check if you're one of the ${missingBrands.length}+ missing.`,
      chartSuggestion: 'Attach as image — missing brands by cuisine category',
      chartType: 'horizontal-bar',
      chartData: missingCuisineSorted.map(([cuisine, count]) => ({
        name: cuisine,
        value: count,
        color: '#10B981',
      })),
      chartFormatValue: (v: number) => `${v.toFixed(0)} brands`,
      icon: <Search className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#UAE', '#PlatformStrategy', '#Careem', '#Talabat'],
    });
  }

  // 15 — Where the Underdog Wins
  if (areasWhereUnderdogWins.length > 0) {
    const topUpsets = areasWhereUnderdogWins
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 5);
    posts.push({
      id: 15,
      title: `${areasWhereUnderdogWins.length} Areas Where ${overallLeader} Doesn't Lead`,
      hook: `${overallLeader} dominates UAE food delivery overall.\n\nBut in ${areasWhereUnderdogWins.length} specific areas, a different platform takes the crown.\n\nHere's where the underdogs win.`,
      body: `Market leadership isn't universal. At the area level, the data tells a different story:\n\n${topUpsets
        .map((a) => {
          const l = leaderOf(a.marketShare);
          return `• ${a.area} (${a.city}): ${l.ch} leads with ~${l.share.toFixed(0)}% — ${overallLeader} at ~${(a.marketShare[overallLeader] || 0).toFixed(0)}%`;
        })
        .join('\n')}\n\nWhy does this happen?\n• Local brand partnerships and restaurant density\n• Different customer demographics per neighborhood\n• Targeted marketing campaigns in specific zones\n\nThe lesson: national market share means nothing if your restaurant is in a "flipped" area. Check your LOCAL data.`,
      cta: `Restaurant operators — do you know which platform actually leads in YOUR specific area? The answer might surprise you.`,
      chartSuggestion: 'Attach as image — areas where the underdog wins',
      chartType: 'horizontal-stacked',
      chartData: {
        data: topUpsets.slice(0, 4).map((a) => ({
          area: a.area,
          ...Object.fromEntries(CHANNELS.map((ch) => [ch, parseFloat((a.marketShare[ch] || 0).toFixed(1))])),
        })),
        segments: CHANNELS as string[],
        colors: Object.fromEntries(CHANNELS.map((ch) => [ch, CHANNEL_COLORS[ch]])) as Record<string, string>,
        nameKey: 'area',
      },
      icon: <Trophy className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#UAE', '#CompetitiveAnalysis', '#AreaInsights'],
    });
  }

  // 16 — The Desserts Economy
  if (desserts) {
    const leader = leaderOf(desserts.marketShare);
    const overallLeaderDessertShare = desserts.marketShare[overallLeader] || 0;
    const overallLeaderTotalShare = (sorted[0].orders / totalOrders) * 100;
    const delta = overallLeaderDessertShare - overallLeaderTotalShare;
    posts.push({
      id: 16,
      title: `${desserts.cuisine} Have a Different Delivery DNA`,
      hook: `${leader.ch} owns ~${leader.share.toFixed(0)}% of ${desserts.cuisine.toLowerCase()} delivery orders.\n\n${
        Math.abs(delta) > 3
          ? `That's ${delta > 0 ? `${delta.toFixed(0)}pp HIGHER` : `${Math.abs(delta).toFixed(0)}pp LOWER`} than their overall market share.`
          : 'Surprisingly close to their overall share.'
      }\n\n${desserts.cuisine} customers choose platforms differently.`,
      body: `Dessert delivery is a unique beast. Here's how the platforms stack up:\n\n${msToBarData(desserts.marketShare)
        .map((d) => `• ${d.name}: ~${d.value}%`)
        .join('\n')}\n\nWhy ${desserts.cuisine.toLowerCase()} behave differently:\n\n• Higher impulse-order rate — platform UX matters more\n• Evening and late-night peaks create different demand patterns\n• Presentation and packaging expectations vary by platform\n• Customer willingness to pay delivery fees differs\n\nIf you run a ${desserts.cuisine.toLowerCase()} business, your delivery strategy should be completely different from a burger joint's.`,
      cta: `Dessert shop owners — which platform drives your most orders? Is it what you'd expect?`,
      chartSuggestion: `Attach as image — ${desserts.cuisine} orders by platform`,
      chartType: 'donut',
      chartData: msToDonutData(desserts.marketShare),
      icon: <Cake className="h-5 w-5" />,
      tags: ['#Desserts', '#FoodDelivery', '#UAE', '#RestaurantInsights'],
    });
  }

  // 17 — Delivery Dead Zones
  if (lowSignalAreas.length > 0) {
    posts.push({
      id: 17,
      title: `${lowSignalAreas.length} UAE Areas Are Delivery Dead Zones`,
      hook: `Not every neighborhood gets the same delivery experience.\n\n${lowSignalAreas.length} areas in the UAE have a "signal strength" of 1 or 2 out of 5 — meaning limited cuisine variety and low platform competition.\n\nThese are delivery dead zones.`,
      body: `We scored every area by delivery maturity (order volume + cuisine diversity).\n\nThe weakest zones:\n\n${lowSignalAreas
        .slice(0, 5)
        .map((a) => {
          const l = leaderOf(a.marketShare);
          return `• ${a.area} (${a.city}): Signal ${a.signalStrength}/5 — ${l.ch} controls ~${l.share.toFixed(0)}%, only ${a.cuisineCount} cuisine${a.cuisineCount > 1 ? 's' : ''}`;
        })
        .join('\n')}\n\nFor restaurants: If you're in a dead zone, your competition is limited — but so is customer behavior. Being early on emerging platforms here could lock in market share before competition arrives.\n\nFor platforms: These areas are whitespace. First-mover advantage is real.`,
      cta: `Do you operate in a delivery dead zone? Is it a curse or an opportunity? Drop your experience below.`,
      chartSuggestion: 'Attach as image — low-signal areas with dominant platform',
      chartType: 'horizontal-stacked',
      chartData: {
        data: lowSignalAreas.slice(0, 5).map((a) => ({
          area: `${a.area} (${a.signalStrength}/5)`,
          ...Object.fromEntries(CHANNELS.map((ch) => [ch, parseFloat((a.marketShare[ch] || 0).toFixed(1))])),
        })),
        segments: CHANNELS as string[],
        colors: Object.fromEntries(CHANNELS.map((ch) => [ch, CHANNEL_COLORS[ch]])) as Record<string, string>,
        nameKey: 'area',
      },
      icon: <Signal className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#UAE', '#DeliveryGap', '#MarketOpportunity'],
    });
  }

  // 18 — Where the Leader Is Weakest
  if (cuisinesWhereLeaderWeakest.length >= 3) {
    const weakest5 = cuisinesWhereLeaderWeakest.slice(0, 5);
    posts.push({
      id: 18,
      title: `${overallLeader}'s Achilles Heel — 5 Cuisines Where They're Weakest`,
      hook: `${overallLeader} leads overall. But in ${weakest5.length} cuisine categories, their share drops to as low as ~${(weakest5[0].marketShare[overallLeader] || 0).toFixed(0)}%.\n\nEvery market leader has blind spots. Here are ${overallLeader}'s.`,
      body: `We ranked every cuisine by ${overallLeader}'s market share — lowest first:\n\n${weakest5
        .map((c) => {
          const winner = leaderOf(c.marketShare);
          return `• ${c.cuisine}: ${overallLeader} at ~${(c.marketShare[overallLeader] || 0).toFixed(1)}% — ${winner.ch !== overallLeader ? `${winner.ch} leads at ~${winner.share.toFixed(1)}%` : 'still leads, but barely'}`;
        })
        .join('\n')}\n\nWhat this means for restaurants:\n\n• In these cuisines, ${overallLeader}'s dominance doesn't apply\n• Ad competition is likely lower on ${overallLeader} for these categories\n• Alternative platforms may deliver better visibility and ROAS\n• Customer acquisition costs differ dramatically by cuisine`,
      cta: `If you serve one of these cuisines, are you over-investing in ${overallLeader}? The data suggests you should diversify.`,
      chartSuggestion: `Attach as image — ${overallLeader}'s weakest cuisines`,
      chartType: 'horizontal-bar',
      chartData: weakest5.map((c) => ({
        name: c.cuisine,
        value: parseFloat((c.marketShare[overallLeader] || 0).toFixed(1)),
        color: CHANNEL_COLORS[overallLeader],
      })),
      chartFormatValue: (v: number) => `${v.toFixed(1)}%`,
      icon: <ShieldAlert className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#UAE', '#CompetitiveIntelligence', `#${overallLeader}`],
    });
  }

  // 19 — The Hottest Delivery Zone
  if (hotZone) {
    posts.push({
      id: 19,
      title: `${hotZone.area} — The Hottest Delivery Zone in UAE`,
      hook: `${hotZone.area} has it all:\n\n• ${hotZone.cuisineCount} active cuisine categories\n• ${hotZone.signalStrength}/5 signal strength\n• All ${CHANNELS.filter((ch) => (hotZone.marketShare[ch] || 0) > 2).length} major platforms competing\n\nThis is where food delivery competition is at its fiercest.`,
      body: `We scored every delivery area in the UAE. ${hotZone.area} in ${hotZone.city} stands out as the most mature delivery market:\n\nPlatform distribution:\n${CHANNELS.filter((ch) => (hotZone.marketShare[ch] || 0) > 1)
        .sort((a, b) => (hotZone.marketShare[b] || 0) - (hotZone.marketShare[a] || 0))
        .map((ch) => `• ${ch}: ~${(hotZone.marketShare[ch] || 0).toFixed(1)}%`)
        .join('\n')}\n\nFor restaurants in ${hotZone.area}:\n\n• Maximum customer reach across all platforms\n• Highest competition — you need to stand out\n• Multi-platform strategy isn't optional, it's survival\n• Marketing efficiency matters more here than anywhere else\n\nIf you can win in ${hotZone.area}, you can win anywhere in the UAE.`,
      cta: `${hotZone.area} restaurant owners — what's your multi-platform strategy? How do you stand out in the most competitive zone?`,
      chartSuggestion: `Attach as image — ${hotZone.area} platform distribution`,
      chartType: 'ring-gauge',
      chartData: {
        value: leaderOf(hotZone.marketShare).share,
        label: leaderOf(hotZone.marketShare).ch,
        color: CHANNEL_COLORS[leaderOf(hotZone.marketShare).ch],
        competitors: CHANNELS.filter((ch) => (hotZone.marketShare[ch] || 0) > 0.5).map((ch) => ({
          name: ch,
          value: parseFloat((hotZone.marketShare[ch] || 0).toFixed(1)),
          color: CHANNEL_COLORS[ch],
        })),
      },
      icon: <Flame className="h-5 w-5" />,
      tags: ['#FoodDelivery', '#UAE', `#${hotZone.area.replace(/\s/g, '')}`, '#MarketInsights'],
    });
  }

  // 20 — The Fast Food / Indian Paradox
  const paradoxCuisine = fastFood || indian;
  if (paradoxCuisine) {
    const leader = leaderOf(paradoxCuisine.marketShare);
    const overallLeaderShare = (sorted[0].orders / totalOrders) * 100;
    const cuisineLeaderShare = leader.share;
    const isFlipped = leader.ch !== overallLeader;
    posts.push({
      id: 20,
      title: `The ${paradoxCuisine.cuisine} Delivery Paradox`,
      hook: isFlipped
        ? `${overallLeader} leads the UAE delivery market overall.\n\nBut for ${paradoxCuisine.cuisine.toLowerCase()}? ${leader.ch} takes the crown at ~${cuisineLeaderShare.toFixed(0)}%.\n\nThat's a full category flip.`
        : `${leader.ch} leads ${paradoxCuisine.cuisine.toLowerCase()} delivery at ~${cuisineLeaderShare.toFixed(0)}%.\n\nBut look at the gap — it's ${Math.abs(cuisineLeaderShare - overallLeaderShare).toFixed(0)}pp ${cuisineLeaderShare > overallLeaderShare ? 'higher' : 'lower'} than their overall share.\n\nSomething unique is happening here.`,
      body: `${paradoxCuisine.cuisine} is one of the most ordered categories in the UAE. Here's the platform breakdown:\n\n${msToBarData(paradoxCuisine.marketShare)
        .map((d) => `• ${d.name}: ~${d.value}%`)
        .join('\n')}\n\nWhy the pattern differs:\n\n• ${paradoxCuisine.cuisine} customers may have different app preferences\n• Restaurant density on each platform varies by cuisine\n• Platform-specific promotions and bundling play a role\n• Delivery speed expectations differ for this category\n\nThe bottom line: category-level data > overall market data when making platform decisions.`,
      cta: `${paradoxCuisine.cuisine} restaurant operators — does this match your experience? Which platform drives your volume?`,
      chartSuggestion: `Attach as image — ${paradoxCuisine.cuisine} platform breakdown`,
      chartType: 'horizontal-bar',
      chartData: msToBarData(paradoxCuisine.marketShare),
      chartFormatValue: (v: number) => `${v.toFixed(1)}%`,
      icon: <Flame className="h-5 w-5" />,
      tags: ['#FoodDelivery', `#${paradoxCuisine.cuisine.replace(/\s/g, '')}`, '#UAE', '#DataDriven'],
    });
  }

  return posts;
}

// ═══════════════════════════════════════════
// Card Components
// ═══════════════════════════════════════════

function PostCard({ post }: { post: LinkedInPost }) {
  const [copied, setCopied] = useState(false);

  const fullPost = `${post.hook}\n\n${post.body}\n\n${post.cta}\n\n${post.tags.join(' ')}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {post.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Post #{post.id}</p>
              <h3 className="text-base font-semibold leading-tight">{post.title}</h3>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Chart Visual ── */}
        <ChartShell caption={post.chartSuggestion}>
          <PostChart post={post} />
        </ChartShell>

        {/* ── Hook ── */}
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hook
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed">{post.hook}</p>
        </div>

        {/* ── Body ── */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Body
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {post.body}
          </p>
        </div>

        {/* ── CTA ── */}
        <div className="rounded-lg border-l-4 border-primary/40 bg-primary/5 px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Call to Action
          </p>
          <p className="text-sm font-medium italic">{post.cta}</p>
        </div>

        {/* ── Tags ── */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-[220px] animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-24 animate-pulse rounded-lg bg-muted/50" />
            <div className="h-32 animate-pulse rounded bg-muted/30" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Page
// ═══════════════════════════════════════════

export default function LinkedInContentPage() {
  const dashQ = useQuery({
    queryKey: ['linkedin-dashboard'],
    queryFn: fetchDashboardData,
    retry: 1,
  });
  const areasQ = useQuery({
    queryKey: ['linkedin-areas'],
    queryFn: fetchAreaData,
    retry: 1,
  });
  const cuisinesQ = useQuery({
    queryKey: ['linkedin-cuisines'],
    queryFn: fetchCuisineData,
    retry: 1,
  });
  const missingQ = useQuery({
    queryKey: ['linkedin-missing-brands'],
    queryFn: fetchMissingBrandsData,
    retry: 1,
  });

  const dashData = dashQ.data ?? (dashQ.isError ? getMockData() : null);
  const areaData = areasQ.data ?? (areasQ.isError ? getMockAreaData() : null);
  const cuisineData = cuisinesQ.data ?? (cuisinesQ.isError ? getMockCuisineData() : null);
  const missingData = missingQ.data ?? (missingQ.isError ? getMockMissingBrandsData() : null);

  const isDemoMode =
    (dashQ.isError || areasQ.isError || cuisinesQ.isError || missingQ.isError) &&
    !!dashData;

  const basePosts = useMemo(() => {
    if (!dashData) return [];
    return generateLinkedInPosts(dashData.channelData, dashData.monthlyData);
  }, [dashData]);

  const deepPosts = useMemo(() => {
    if (!dashData || !areaData || !cuisineData || !missingData) return [];
    return generateDeepDivePosts(
      dashData.channelData,
      areaData,
      cuisineData,
      missingData
    );
  }, [dashData, areaData, cuisineData, missingData]);

  const deepLoading =
    !areasQ.isError && !cuisinesQ.isError && !missingQ.isError &&
    (areasQ.isLoading || cuisinesQ.isLoading || missingQ.isLoading);

  return (
    <div className="flex flex-col">
      <Header
        title="LinkedIn Content"
        subtitle="Data-backed post ideas for food delivery insights"
      />

      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <GradientDefs />

        {/* Intro */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-r from-primary/5 via-background to-primary/5 p-6">
          <h2 className="text-lg font-semibold">20 Ready-to-Post LinkedIn Ideas</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Each post is generated from real UAE food delivery market data. Content uses
            percentages and ratios — safe to share publicly. Each card includes a{' '}
            <strong>suggested visual</strong> you can screenshot or recreate. Hover over any card
            and click <strong>Copy</strong> to grab the full text.
          </p>
        </div>

        {dashQ.isLoading && <ContentSkeleton />}

        {isDemoMode && (
          <div
            className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100"
            role="alert"
          >
            <strong>Demo mode</strong> – Real data is unavailable. You are viewing sample data.{' '}
            <button onClick={() => dashQ.refetch()} className="ml-1 underline">
              Try again
            </button>
          </div>
        )}

        {/* ── Section 1: Market Overview ── */}
        {basePosts.length > 0 && (
          <>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-border" />
              <h3 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Market Overview — 10 Posts
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {basePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}

        {/* ── Section 2: Deep Dives ── */}
        {deepPosts.length > 0 && (
          <>
            <div className="flex items-center gap-3 pt-4">
              <div className="h-px flex-1 bg-border" />
              <h3 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Deep Dives — Areas, Cuisines &amp; Surprising Finds
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {deepPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}

        {deepLoading && basePosts.length > 0 && (
          <>
            <div className="flex items-center gap-3 pt-4">
              <div className="h-px flex-1 bg-border" />
              <h3 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Loading deep dives…
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>
            <ContentSkeleton />
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Mock Data (fallback when BigQuery unavailable)
// ═══════════════════════════════════════════

function makeMockMarketShare(
  base: number[]
): Record<Channel, number> {
  const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];
  const raw = base.map((b) => Math.max(b + (Math.random() - 0.5) * 6, 1));
  const total = raw.reduce((s, v) => s + v, 0);
  const ms: Record<Channel, number> = {} as Record<Channel, number>;
  channels.forEach((ch, i) => {
    ms[ch] = parseFloat(((raw[i] / total) * 100).toFixed(1));
  });
  return ms;
}

function getMockAreaData(): MarketShareByAreaExtended[] {
  const areas = [
    { area: 'Dubai Marina', city: 'Dubai', orders: 120000, cuisines: 8, signal: 5, base: [32, 28, 22, 12, 6] },
    { area: 'Downtown Dubai', city: 'Dubai', orders: 95000, cuisines: 7, signal: 5, base: [35, 25, 20, 13, 7] },
    { area: 'JBR', city: 'Dubai', orders: 80000, cuisines: 6, signal: 5, base: [30, 30, 22, 12, 6] },
    { area: 'Business Bay', city: 'Dubai', orders: 70000, cuisines: 6, signal: 4, base: [38, 24, 20, 12, 6] },
    { area: 'DIFC', city: 'Dubai', orders: 55000, cuisines: 5, signal: 4, base: [28, 32, 22, 12, 6] },
    { area: 'JLT', city: 'Dubai', orders: 45000, cuisines: 5, signal: 4, base: [42, 22, 18, 12, 6] },
    { area: 'Al Barsha', city: 'Dubai', orders: 40000, cuisines: 4, signal: 3, base: [45, 20, 18, 11, 6] },
    { area: 'Deira', city: 'Dubai', orders: 35000, cuisines: 4, signal: 3, base: [48, 18, 16, 12, 6] },
    { area: 'Jumeirah', city: 'Dubai', orders: 30000, cuisines: 3, signal: 2, base: [40, 26, 20, 10, 4] },
    { area: 'Al Nahda', city: 'Sharjah', orders: 20000, cuisines: 3, signal: 2, base: [55, 15, 15, 10, 5] },
    { area: 'Khalifa City', city: 'Abu Dhabi', orders: 15000, cuisines: 2, signal: 1, base: [60, 15, 12, 8, 5] },
    { area: 'Al Ain City', city: 'Al Ain', orders: 8000, cuisines: 2, signal: 1, base: [65, 12, 10, 8, 5] },
  ];

  return areas.map((a) => ({
    area: a.area,
    city: a.city,
    totalOrders: a.orders,
    cuisineCount: a.cuisines,
    signalStrength: a.signal,
    marketShare: makeMockMarketShare(a.base),
  }));
}

function getMockCuisineData(): MarketShareByCuisine[] {
  const cuisines = [
    { cuisine: 'American', base: [42, 22, 18, 12, 6] },
    { cuisine: 'Asian', base: [35, 28, 20, 11, 6] },
    { cuisine: 'Beverages', base: [38, 25, 18, 13, 6] },
    { cuisine: 'Desserts', base: [30, 32, 18, 14, 6] },
    { cuisine: 'Healthy', base: [25, 30, 25, 14, 6] },
    { cuisine: 'Indian', base: [48, 18, 16, 12, 6] },
    { cuisine: 'Italian', base: [34, 28, 20, 12, 6] },
    { cuisine: 'Middle Eastern', base: [45, 20, 18, 11, 6] },
    { cuisine: 'Shawarma', base: [50, 16, 18, 10, 6] },
    { cuisine: 'Turkish', base: [40, 24, 20, 10, 6] },
    { cuisine: 'Seafood', base: [28, 32, 22, 12, 6] },
    { cuisine: 'Fast Food', base: [44, 20, 18, 12, 6] },
  ];

  return cuisines.map((c) => ({
    cuisine: c.cuisine,
    marketShare: makeMockMarketShare(c.base),
  }));
}

function getMockMissingBrandsData(): MissingBrand[] {
  const brands = [
    { cuisine: 'American', loc: 'Dubai Marina', count: 3 },
    { cuisine: 'American', loc: 'JBR', count: 2 },
    { cuisine: 'Indian', loc: 'Deira', count: 4 },
    { cuisine: 'Indian', loc: 'Al Barsha', count: 2 },
    { cuisine: 'Middle Eastern', loc: 'Business Bay', count: 3 },
    { cuisine: 'Middle Eastern', loc: 'Downtown Dubai', count: 2 },
    { cuisine: 'Italian', loc: 'DIFC', count: 2 },
    { cuisine: 'Asian', loc: 'JLT', count: 3 },
    { cuisine: 'Asian', loc: 'Dubai Marina', count: 2 },
    { cuisine: 'Desserts', loc: 'Jumeirah', count: 3 },
    { cuisine: 'Desserts', loc: 'Downtown Dubai', count: 1 },
    { cuisine: 'Turkish', loc: 'Al Nahda', count: 2 },
    { cuisine: 'Beverages', loc: 'Business Bay', count: 2 },
    { cuisine: 'Healthy', loc: 'DIFC', count: 1 },
    { cuisine: 'Shawarma', loc: 'Deira', count: 5 },
    { cuisine: 'Shawarma', loc: 'Al Barsha', count: 3 },
    { cuisine: 'Seafood', loc: 'JBR', count: 1 },
    { cuisine: 'Fast Food', loc: 'JLT', count: 2 },
    { cuisine: 'Fast Food', loc: 'Al Nahda', count: 1 },
  ];

  return brands.map((b, i) => ({
    id: `brand-${i}`,
    name: `Brand ${String.fromCharCode(65 + i)}`,
    cuisine: b.cuisine,
    location: b.loc,
    rating: 0,
    locationCount: b.count,
  }));
}

function getMockData(): DashboardData {
  const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];
  const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10'];

  const channelData: AggregatedData[] = channels.map((channel, index) => {
    const baseOrders = [50000, 30000, 25000, 15000, 10000][index];
    const orders = baseOrders + Math.floor(Math.random() * 5000);
    const grossSales = orders * (55 + Math.random() * 25);
    const netSales = grossSales * (0.82 + Math.random() * 0.08);
    const adsSpend = grossSales * (0.04 + Math.random() * 0.06);
    const discountSpend = grossSales * (0.06 + Math.random() * 0.06);
    const adsReturn = adsSpend * (2.5 + Math.random() * 5);

    return {
      channel,
      orders,
      netSales,
      grossSales,
      adsSpend,
      discountSpend,
      adsReturn,
      roas: adsSpend > 0 ? adsReturn / adsSpend : 0,
      aov: orders > 0 ? grossSales / orders : 0,
    };
  });

  const monthlyData: MonthlyMarketShare[] = months.map((month) => {
    let remaining = 100;
    const marketShare: Record<Channel, number> = {} as Record<Channel, number>;
    channels.forEach((channel, index) => {
      if (index === channels.length - 1) {
        marketShare[channel] = Math.max(remaining, 0);
      } else {
        const base = [40, 23, 19, 12, 6][index];
        const share = Math.max(0, Math.min(remaining, base + (Math.random() - 0.5) * 6));
        marketShare[channel] = parseFloat(share.toFixed(1));
        remaining -= marketShare[channel];
      }
    });
    return { month, marketShare };
  });

  return {
    summary: {
      totalOrders: channelData.reduce((s, d) => s + d.orders, 0),
      totalNetSales: channelData.reduce((s, d) => s + d.netSales, 0),
      totalGrossSales: channelData.reduce((s, d) => s + d.grossSales, 0),
      totalAdsSpend: channelData.reduce((s, d) => s + d.adsSpend, 0),
      totalDiscountSpend: channelData.reduce((s, d) => s + d.discountSpend, 0),
    },
    channelData,
    monthlyData,
    filterOptions: {
      months,
      cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
      areas: ['Al Barsha', 'JBR', 'Marina', 'Downtown', 'Business Bay'],
      cuisines: ['American', 'Asian', 'Indian', 'Italian', 'Middle Eastern'],
    },
  };
}
