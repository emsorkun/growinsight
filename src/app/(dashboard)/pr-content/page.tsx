/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState, Fragment, useId, useRef } from 'react';
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
  CHANNEL_COLORS,
} from '@/types';
import { formatPercentage } from '@/lib/data-utils';
import {
  Copy,
  Check,
  Printer,
  FileText,
  Quote,
  Building2,
  Users,
  Globe,
  TrendingUp,
  BarChart3,
  Rocket,
  Heart,
  Lightbulb,
  Shield,
  Zap,
  Target,
} from 'lucide-react';

// ═══════════════════════════════════════════
// Types & Constants
// ═══════════════════════════════════════════

const CHANNELS: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

const GRADIENT_COLORS: Record<string, [string, string]> = {
  Talabat: ['#F97316', '#FDBA74'],
  Deliveroo: ['#06B6D4', '#67E8F9'],
  Careem: ['#10B981', '#6EE7B7'],
  Noon: ['#EAB308', '#FDE047'],
  Keeta: ['#6B7280', '#D1D5DB'],
};

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

// ═══════════════════════════════════════════
// Data Fetchers
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

// ═══════════════════════════════════════════
// SVG Gradient Definitions
// ═══════════════════════════════════════════

function GradientDefs() {
  return (
    <svg className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
      <defs>
        {Object.entries(GRADIENT_COLORS).map(([name, [c1, c2]]) => (
          <Fragment key={name}>
            <linearGradient id={`pr-gv-${name}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c2} />
              <stop offset="100%" stopColor={c1} />
            </linearGradient>
            <linearGradient id={`pr-gh-${name}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
            <linearGradient id={`pr-ga-${name}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c1} stopOpacity={0.65} />
              <stop offset="100%" stopColor={c1} stopOpacity={0.05} />
            </linearGradient>
          </Fragment>
        ))}
      </defs>
    </svg>
  );
}

// ═══════════════════════════════════════════
// Chart Primitives
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

function ArticleChart({
  children,
  caption,
  source,
}: {
  children: React.ReactNode;
  caption: string;
  source?: string;
}) {
  return (
    <figure className="my-6">
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 ring-1 ring-white/[0.07]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/[0.06] blur-3xl" />
        <div className="relative px-3 pb-3 pt-4">{children}</div>
      </div>
      <figcaption className="mt-2 space-y-0.5 px-1">
        <p className="text-xs font-medium text-muted-foreground">{caption}</p>
        {source && (
          <p className="text-[10px] text-muted-foreground/60">Source: {source}</p>
        )}
      </figcaption>
    </figure>
  );
}

// ═══════════════════════════════════════════
// Chart Components (publication-sized)
// ═══════════════════════════════════════════

function MarketShareDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const uid = useId().replace(/:/g, '');
  return (
    <div className="relative h-[280px]">
      <ResponsiveContainer>
        <RechartsPieChart>
          <defs>
            {data.map((d, i) => {
              const [c1, c2] = GRADIENT_COLORS[d.name] || [d.color, d.color];
              return (
                <linearGradient key={i} id={`pr-dn-${uid}-${i}`} x1="0" y1="0" x2="1" y2="1">
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
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            strokeWidth={0}
            animationDuration={900}
            animationEasing="ease-out"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#pr-dn-${uid}-${i})`} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingTop: 8 }}
            formatter={(value: string) => (
              <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 500 }}>{value}</span>
            )}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

function VerticalBar({
  data,
  formatValue,
}: {
  data: { name: string; value: number; color: string }[];
  formatValue?: (v: number) => string;
}) {
  const fmt = formatValue || ((v: number) => v.toFixed(1));
  return (
    <div className="h-[280px]">
      <ResponsiveContainer>
        <RechartsBarChart data={data} margin={{ top: 28, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip formatter={fmt} />} />
          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            barSize={40}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={GRADIENT_COLORS[d.name] ? `url(#pr-gv-${d.name})` : d.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: any) => fmt(Number(v))}
              style={{ fill: '#E2E8F0', fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HorizontalBar({
  data,
  formatValue,
}: {
  data: { name: string; value: number; color: string }[];
  formatValue?: (v: number) => string;
}) {
  const fmt = formatValue || ((v: number) => v.toFixed(1));
  return (
    <div className="h-[280px]">
      <ResponsiveContainer>
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 60, left: 5, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip content={<ChartTooltip formatter={fmt} />} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={26} animationDuration={800}>
            {data.map((d, i) => (
              <Cell key={i} fill={GRADIENT_COLORS[d.name] ? `url(#pr-gh-${d.name})` : d.color} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v: any) => fmt(Number(v))}
              style={{ fill: '#E2E8F0', fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendArea({ data }: { data: Record<string, any>[] }) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
          <Legend
            verticalAlign="top"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingBottom: 8 }}
            formatter={(value: string) => (
              <span style={{ color: '#94A3B8', fontSize: 10, fontWeight: 500 }}>{value}</span>
            )}
          />
          {CHANNELS.map((ch) => (
            <Area
              key={ch}
              type="monotone"
              dataKey={ch}
              stackId="1"
              stroke={CHANNEL_COLORS[ch]}
              fill={`url(#pr-ga-${ch})`}
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

function MarketShareStackedBar({
  data,
}: {
  data: { area: string; [key: string]: any }[];
}) {
  return (
    <div className="h-[280px]">
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
            dataKey="area"
            tick={{ fill: '#CBD5E1', fontSize: 10, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={80}
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
          {CHANNELS.map((ch) => (
            <Bar
              key={ch}
              dataKey={ch}
              stackId="s"
              fill={CHANNEL_COLORS[ch]}
              barSize={24}
              animationDuration={800}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ═══════════════════════════════════════════
// Quote Block Component
// ═══════════════════════════════════════════

function QuoteBlock({
  quote,
  author,
  title,
}: {
  quote: string;
  author: string;
  title: string;
}) {
  return (
    <blockquote className="relative my-6 rounded-xl border-l-4 border-primary/60 bg-primary/5 px-6 py-5">
      <Quote className="absolute -top-2 left-4 h-6 w-6 text-primary/30" />
      <p className="text-sm italic leading-relaxed text-foreground/90 lg:text-base">
        &ldquo;{quote}&rdquo;
      </p>
      <footer className="mt-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          {author.charAt(0)}
        </div>
        <div>
          <cite className="not-italic text-sm font-semibold">{author}</cite>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </footer>
    </blockquote>
  );
}

// ═══════════════════════════════════════════
// Info Box Component
// ═══════════════════════════════════════════

function InfoBox({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string; icon: React.ReactNode }[];
}) {
  return (
    <div className="my-6 rounded-xl border border-border bg-muted/30 p-5">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2">
            <div className="mt-0.5 text-primary/70">{item.icon}</div>
            <div>
              <p className="text-lg font-bold leading-tight">{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Article Component
// ═══════════════════════════════════════════

function PRArticle({
  articleNumber,
  headline,
  subheadline,
  dateline,
  children,
}: {
  articleNumber: number;
  headline: string;
  subheadline: string;
  dateline: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    if (!articleRef.current) return;
    const text = articleRef.current.innerText;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (!articleRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${headline}</title>
          <style>
            body { font-family: Georgia, 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.7; }
            h1 { font-size: 28px; line-height: 1.2; margin-bottom: 8px; }
            h2 { font-size: 20px; margin-top: 28px; }
            h3 { font-size: 16px; margin-top: 24px; }
            p { margin: 12px 0; font-size: 15px; }
            blockquote { border-left: 3px solid #666; padding-left: 16px; margin: 20px 0; font-style: italic; }
            .dateline { color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
            .subheadline { font-size: 18px; color: #444; font-weight: normal; margin-bottom: 24px; }
            .stats { display: flex; gap: 24px; margin: 20px 0; padding: 16px; background: #f5f5f5; border-radius: 8px; }
            .stat-item { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .stat-label { font-size: 12px; color: #666; }
            hr { border: none; border-top: 1px solid #ddd; margin: 32px 0; }
            .publication { font-size: 12px; color: #999; margin-top: 40px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="dateline">${dateline}</div>
          <h1>${headline}</h1>
          <div class="subheadline">${subheadline}</div>
          <hr/>
          ${articleRef.current.innerHTML.replace(/<button[^>]*>.*?<\/button>/gs, '').replace(/<svg[^>]*>.*?<\/svg>/gs, '').replace(/<figure[^>]*>.*?<\/figure>/gs, '<p style="color:#999;font-style:italic;">[Chart/Figure — see digital version]</p>')}
          <hr/>
          <div class="publication">Prepared for Caterer Middle East | ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card className="overflow-hidden">
      {/* Article Header */}
      <div className="relative border-b border-border bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-5 dark:from-slate-900/50 dark:via-slate-800/30 dark:to-slate-900/50">
        <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Article {articleNumber}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Caterer Middle East
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight lg:text-2xl">{headline}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground lg:text-base">{subheadline}</p>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {dateline}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Article Body */}
      <CardContent className="px-6 py-6 lg:px-8" ref={articleRef}>
        <div className="prose-sm mx-auto max-w-none space-y-4 text-sm leading-relaxed text-foreground/90 lg:text-[15px] lg:leading-[1.75]">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════
// Skeleton
// ═══════════════════════════════════════════

function ArticleSkeleton() {
  return (
    <Card>
      <div className="border-b border-border p-6">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-7 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      <CardContent className="space-y-4 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted/50" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted/40" />
            {i === 1 && <div className="h-[200px] animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════
// Mock Data (fallback)
// ═══════════════════════════════════════════

function makeMockMarketShare(base: number[]): Record<Channel, number> {
  const raw = base.map((b) => Math.max(b + (Math.random() - 0.5) * 6, 1));
  const total = raw.reduce((s, v) => s + v, 0);
  const ms: Record<Channel, number> = {} as Record<Channel, number>;
  CHANNELS.forEach((ch, i) => {
    ms[ch] = parseFloat(((raw[i] / total) * 100).toFixed(1));
  });
  return ms;
}

function getMockData(): DashboardData {
  const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10'];
  const channelData: AggregatedData[] = CHANNELS.map((channel, index) => {
    const baseOrders = [50000, 30000, 25000, 15000, 10000][index];
    const orders = baseOrders + Math.floor(Math.random() * 5000);
    const grossSales = orders * (55 + Math.random() * 25);
    const netSales = grossSales * (0.82 + Math.random() * 0.08);
    const adsSpend = grossSales * (0.04 + Math.random() * 0.06);
    const discountSpend = grossSales * (0.06 + Math.random() * 0.06);
    const adsReturn = adsSpend * (2.5 + Math.random() * 5);
    return { channel, orders, netSales, grossSales, adsSpend, discountSpend, adsReturn, roas: adsSpend > 0 ? adsReturn / adsSpend : 0, aov: orders > 0 ? grossSales / orders : 0 };
  });

  const monthlyData: MonthlyMarketShare[] = months.map((month) => {
    let remaining = 100;
    const marketShare: Record<Channel, number> = {} as Record<Channel, number>;
    CHANNELS.forEach((channel, index) => {
      if (index === CHANNELS.length - 1) {
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
    filterOptions: { months, cities: [], areas: [], cuisines: [] },
  };
}

function getMockAreaData(): MarketShareByAreaExtended[] {
  const areas = [
    { area: 'Dubai Marina', city: 'Dubai', orders: 120000, cuisines: 8, signal: 5, base: [32, 28, 22, 12, 6] },
    { area: 'Downtown Dubai', city: 'Dubai', orders: 95000, cuisines: 7, signal: 5, base: [35, 25, 20, 13, 7] },
    { area: 'JBR', city: 'Dubai', orders: 80000, cuisines: 6, signal: 5, base: [30, 30, 22, 12, 6] },
    { area: 'Business Bay', city: 'Dubai', orders: 70000, cuisines: 6, signal: 4, base: [38, 24, 20, 12, 6] },
    { area: 'Al Barsha', city: 'Dubai', orders: 40000, cuisines: 4, signal: 3, base: [45, 20, 18, 11, 6] },
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
    { cuisine: 'Desserts', base: [30, 32, 18, 14, 6] },
    { cuisine: 'Indian', base: [48, 18, 16, 12, 6] },
    { cuisine: 'Middle Eastern', base: [45, 20, 18, 11, 6] },
    { cuisine: 'Italian', base: [34, 28, 20, 12, 6] },
  ];
  return cuisines.map((c) => ({ cuisine: c.cuisine, marketShare: makeMockMarketShare(c.base) }));
}

// ═══════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════

export default function PRContentPage() {
  const dashQ = useQuery({ queryKey: ['pr-dashboard'], queryFn: fetchDashboardData, retry: 1 });
  const areasQ = useQuery({ queryKey: ['pr-areas'], queryFn: fetchAreaData, retry: 1 });
  const cuisinesQ = useQuery({ queryKey: ['pr-cuisines'], queryFn: fetchCuisineData, retry: 1 });

  const dashData = dashQ.data ?? (dashQ.isError ? getMockData() : null);
  const areaData = areasQ.data ?? (areasQ.isError ? getMockAreaData() : null);
  const cuisineData = cuisinesQ.data ?? (cuisinesQ.isError ? getMockCuisineData() : null);

  const isDemoMode = (dashQ.isError || areasQ.isError || cuisinesQ.isError) && !!dashData;

  // Computed data for articles
  const chartData = useMemo(() => {
    if (!dashData) return null;

    const sorted = [...dashData.channelData].sort((a, b) => b.orders - a.orders);
    const totalOrders = sorted.reduce((s, d) => s + d.orders, 0);
    if (totalOrders === 0) return null;

    const leader = sorted[0];
    const leaderShare = (leader.orders / totalOrders) * 100;

    // Market share donut
    const marketShareDonut = sorted
      .filter((d) => d.orders > 0)
      .map((d) => ({
        name: d.channel,
        value: parseFloat(((d.orders / totalOrders) * 100).toFixed(1)),
        color: CHANNEL_COLORS[d.channel as Channel],
      }));

    // AOV bar
    const aovBar = [...dashData.channelData]
      .filter((d) => d.aov > 0)
      .sort((a, b) => b.aov - a.aov)
      .map((d) => ({
        name: d.channel,
        value: parseFloat(d.aov.toFixed(0)),
        color: CHANNEL_COLORS[d.channel as Channel],
      }));

    // ROAS bar
    const roasBar = [...dashData.channelData]
      .filter((d) => d.roas > 0)
      .sort((a, b) => b.roas - a.roas)
      .map((d) => ({
        name: d.channel,
        value: parseFloat(d.roas.toFixed(2)),
        color: CHANNEL_COLORS[d.channel as Channel],
      }));

    // Monthly trend
    const monthlyTrend = dashData.monthlyData.map((m) => ({ month: m.month, ...m.marketShare }));

    // Area stacked bar
    const areaStackedBar = areaData
      ? areaData.slice(0, 5).map((a) => ({
          area: a.area,
          ...Object.fromEntries(CHANNELS.map((ch) => [ch, parseFloat((a.marketShare[ch] || 0).toFixed(1))])),
        }))
      : [];

    // Revenue efficiency
    const efficiencyBar = dashData.channelData
      .filter((d) => d.grossSales > 0)
      .map((d) => ({
        name: d.channel,
        value: parseFloat(((d.netSales / d.grossSales) * 100).toFixed(1)),
        color: CHANNEL_COLORS[d.channel as Channel],
      }))
      .sort((a, b) => b.value - a.value);

    // Trends
    const recentMonths = dashData.monthlyData.slice(-3);
    const olderMonths = dashData.monthlyData.slice(-6, -3);
    const trends: { channel: Channel; delta: number }[] = [];
    if (recentMonths.length > 0 && olderMonths.length > 0) {
      CHANNELS.forEach((ch) => {
        const recent = recentMonths.reduce((s, m) => s + (m.marketShare[ch] || 0), 0) / recentMonths.length;
        const older = olderMonths.reduce((s, m) => s + (m.marketShare[ch] || 0), 0) / olderMonths.length;
        trends.push({ channel: ch, delta: recent - older });
      });
    }
    const fastGrower = [...trends].sort((a, b) => b.delta - a.delta)[0];

    return {
      sorted,
      totalOrders,
      leader,
      leaderShare,
      marketShareDonut,
      aovBar,
      roasBar,
      monthlyTrend,
      areaStackedBar,
      efficiencyBar,
      fastGrower,
      trends,
    };
  }, [dashData, areaData]);

  const isLoading = dashQ.isLoading;

  return (
    <div className="flex flex-col">
      <Header
        title="PR Content"
        subtitle="Press release articles for Caterer Middle East"
      />

      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <GradientDefs />

        {/* Intro Banner */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-r from-primary/5 via-background to-primary/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Press Release Content for Caterer Middle East</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Three publication-ready articles featuring exclusive UAE food delivery market data and the GrowDash story.
                Each article includes data visualisations, executive quotes, and company background.
                Use the <strong>Copy</strong> button to grab article text or <strong>Print</strong> for a formatted version.
              </p>
            </div>
          </div>
        </div>

        {isDemoMode && (
          <div
            className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100"
            role="alert"
          >
            <strong>Demo mode</strong> — Real data is unavailable. You are viewing sample data.{' '}
            <button onClick={() => dashQ.refetch()} className="ml-1 underline">Try again</button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-6">
            <ArticleSkeleton />
            <ArticleSkeleton />
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ARTICLE 1 */}
        {/* ═══════════════════════════════════════════ */}

        {chartData && (
          <PRArticle
            articleNumber={1}
            headline="Exclusive Data Reveals UAE Food Delivery Is Now a Five-Platform Race"
            subheadline="New analysis from GrowDash, the AI-powered restaurant delivery platform powering 5,000+ restaurants, maps the shifting competitive landscape across platforms, cuisines, and neighbourhoods"
            dateline={`Dubai, UAE — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          >
            <p>
              The UAE&apos;s food delivery sector has entered a new era of competition. What was once widely regarded as
              a two-horse race between legacy aggregators is now a dynamic battleground involving five major platforms —
              each carving out distinct strongholds across cuisines, neighbourhoods, and customer segments.
            </p>

            <p>
              That is the headline finding from an exclusive market analysis by <strong>GrowDash</strong>, the Dubai-based
              technology company that serves as the operating system for restaurant delivery operations. Drawing on
              aggregated, anonymised order data from over 5,000 restaurants across the UAE, the analysis provides
              the most granular publicly available breakdown of the country&apos;s delivery market share.
            </p>

            <ArticleChart
              caption={`Figure 1: UAE food delivery order share by platform — ${chartData.leader.channel} leads at ~${Math.round(chartData.leaderShare)}%, but challengers are gaining ground`}
              source="GrowDash aggregated restaurant data, 2025"
            >
              <MarketShareDonut data={chartData.marketShareDonut} />
            </ArticleChart>

            <h3 className="!mt-8 text-base font-bold lg:text-lg">The Numbers: A Market in Flux</h3>

            <p>
              According to GrowDash data, <strong>{chartData.leader.channel}</strong> continues to command the largest
              share of delivery orders at approximately <strong>~{Math.round(chartData.leaderShare)}%</strong>.
              However, the remaining four platforms — {chartData.sorted.slice(1).map((d) => d.channel).join(', ')} —
              collectively account for over <strong>~{Math.round(100 - chartData.leaderShare)}%</strong> of the market,
              signalling a competitive environment that is far more fragmented than industry headlines suggest.
            </p>

            {chartData.fastGrower && chartData.fastGrower.delta > 0.5 && (
              <p>
                Most notably, <strong>{chartData.fastGrower.channel}</strong> has been the fastest-growing platform
                over the past quarter, gaining approximately <strong>~{Math.abs(chartData.fastGrower.delta).toFixed(1)} percentage points</strong> of
                market share — a significant shift in a market this size.
              </p>
            )}

            <QuoteBlock
              quote="Restaurants have always known the market was changing, but until now they haven't had the data to see exactly how. Our analysis shows that the era of a single dominant platform is giving way to a genuinely competitive multi-platform landscape. The restaurants that understand this shift early will be the ones that thrive."
              author="Sean Trevaskis"
              title="Co-Founder & CEO, GrowDash"
            />

            <ArticleChart
              caption="Figure 2: Monthly market share trend across all five platforms — illustrating the gradual redistribution of order volume"
              source="GrowDash aggregated restaurant data, 2025"
            >
              <TrendArea data={chartData.monthlyTrend} />
            </ArticleChart>

            <h3 className="!mt-8 text-base font-bold lg:text-lg">Average Order Values Tell a Different Story</h3>

            <p>
              While order volume is one measure of market power, revenue per order tells a more nuanced story.
              GrowDash&apos;s analysis reveals significant variation in Average Order Value (AOV) across platforms,
              with {chartData.aovBar[0]?.name || 'leading platforms'} commanding the highest average basket size.
            </p>

            <ArticleChart
              caption="Figure 3: Average Order Value (AED) by platform — same city, same cuisines, different customer behaviour"
              source="GrowDash aggregated restaurant data, 2025"
            >
              <VerticalBar data={chartData.aovBar} formatValue={(v) => `AED ${v.toFixed(0)}`} />
            </ArticleChart>

            <p>
              &ldquo;A platform with a smaller order share but a significantly higher AOV can actually be more profitable
              for restaurants,&rdquo; notes <strong>Enver Sorkun, Co-Founder and CPO of GrowDash</strong>.
              &ldquo;This is why we encourage operators to look beyond top-line order counts. Revenue optimisation
              requires a platform-by-platform strategy.&rdquo;
            </p>

            <h3 className="!mt-8 text-base font-bold lg:text-lg">Ad Spend Efficiency: The ROAS Gap</h3>

            <p>
              Perhaps the most striking finding relates to advertising efficiency. The Return on Ad Spend (ROAS)
              varies dramatically across platforms, with the best-performing channel delivering{' '}
              {chartData.roasBar.length >= 2
                ? `${(chartData.roasBar[0].value / chartData.roasBar[chartData.roasBar.length - 1].value).toFixed(1)}x`
                : 'significantly'}{' '}
              more revenue per advertising dirham than the least efficient.
            </p>

            <ArticleChart
              caption="Figure 4: Return on Ad Spend (ROAS) by platform — the gap between best and worst represents a significant revenue opportunity"
              source="GrowDash aggregated restaurant data, 2025"
            >
              <HorizontalBar data={chartData.roasBar} formatValue={(v) => `${v.toFixed(1)}x`} />
            </ArticleChart>

            <p>
              For restaurant operators spending across multiple platforms without visibility into these metrics,
              the analysis suggests that misallocated ad budgets could be costing the industry millions of dirhams annually.
            </p>

            {chartData.areaStackedBar.length > 0 && (
              <>
                <h3 className="!mt-8 text-base font-bold lg:text-lg">Hyper-Local Competition: It&apos;s a Different Race in Every Neighbourhood</h3>

                <p>
                  The GrowDash analysis goes beyond city-level data to reveal dramatic variations at the neighbourhood
                  level. In premium areas such as Dubai Marina and DIFC, competition is fierce with all five platforms
                  holding meaningful market share. In suburban and outer areas, a single platform can command over 60%
                  of orders.
                </p>

                <ArticleChart
                  caption="Figure 5: Market share by area — competitive dynamics vary dramatically by neighbourhood"
                  source="GrowDash aggregated restaurant data, 2025"
                >
                  <MarketShareStackedBar data={chartData.areaStackedBar} />
                </ArticleChart>

                <p>
                  &ldquo;We see restaurants applying the same strategy across all their locations, regardless of the
                  local competitive landscape,&rdquo; says Sorkun. &ldquo;A branch in Marina needs a completely different
                  approach to one in Al Nahda. Our platform makes that level of precision possible.&rdquo;
                </p>
              </>
            )}

            <h3 className="!mt-8 text-base font-bold lg:text-lg">What This Means for the Industry</h3>

            <p>
              The data presents a clear message for restaurant operators: the delivery landscape is more complex and
              more competitive than it has ever been. But with complexity comes opportunity. Restaurants that leverage
              data to optimise their presence across platforms — rather than defaulting to the largest aggregator —
              stand to gain meaningful revenue and margin advantages.
            </p>

            <QuoteBlock
              quote="We built GrowDash because we saw restaurant operators drowning in five different dashboards, making decisions based on incomplete information. The market data is clear — there is real money being left on the table by restaurants that don't have a multi-platform strategy informed by data."
              author="Enver Sorkun"
              title="Co-Founder & CPO, GrowDash"
            />

            {/* Boilerplate */}
            <div className="!mt-10 rounded-xl border border-border bg-muted/30 p-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                About GrowDash
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Founded in 2022 in Dubai, GrowDash is the operating system for restaurant delivery. The platform
                provides restaurants with a single source of truth across all delivery channels, powered by Aisha —
                a proprietary AI agent trained on millions of data points from over 5,000 restaurants. GrowDash
                serves restaurant groups across 6 countries, with a team of 28+ across the UAE, UK, Turkey, Pakistan,
                and India. The company raised its seed round in 2024 led by Salica Investments.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Media contact:</strong> press@mygrowdash.com | <strong>Website:</strong> mygrowdash.com
              </p>
            </div>
          </PRArticle>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ARTICLE 2 */}
        {/* ═══════════════════════════════════════════ */}

        {chartData && (
          <PRArticle
            articleNumber={2}
            headline="From Data Chaos to AI-Powered Growth: Inside GrowDash's Mission to Transform Restaurant Delivery"
            subheadline="The Dubai-born startup is giving 5,000+ restaurants an AI delivery manager — and the results are rewriting the playbook for multi-platform operations"
            dateline={`Dubai, UAE — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          >
            <p>
              When Sean Trevaskis and Enver Sorkun left their senior roles at Talabat — the Delivery Hero-owned
              super app — in 2022, they carried with them a hard-won insight: the restaurants powering the region&apos;s
              booming delivery economy were flying blind.
            </p>

            <p>
              &ldquo;After five years building the advertising and discount technology at Talabat across eight countries,
              we saw the other side of the equation,&rdquo; recalls Trevaskis. &ldquo;Restaurants had been transformed
              into e-commerce businesses overnight. They were operating across multiple delivery platforms, each with its
              own dashboard, its own metrics, its own advertising tools. The result was data chaos.&rdquo;
            </p>

            <p>
              That frustration became the founding thesis for <strong>GrowDash</strong> — a platform that would give
              restaurant operators a single source of truth and, eventually, an AI partner capable of turning raw data
              into actionable growth strategies.
            </p>

            <InfoBox
              title="GrowDash at a Glance"
              items={[
                { label: 'Founded', value: '2022', icon: <Building2 className="h-4 w-4" /> },
                { label: 'Team Members', value: '28+', icon: <Users className="h-4 w-4" /> },
                { label: 'Countries', value: '6', icon: <Globe className="h-4 w-4" /> },
                { label: 'Restaurants', value: '5,000+', icon: <TrendingUp className="h-4 w-4" /> },
              ]}
            />

            <h3 className="!mt-8 text-base font-bold lg:text-lg">The Problem: Five Dashboards, Zero Clarity</h3>

            <p>
              The scale of the problem GrowDash addresses is easy to understate. A typical multi-outlet restaurant
              group in the UAE operates on three to five delivery platforms simultaneously. Each platform has its
              own reporting interface, its own advertising suite, and its own discount mechanics.
            </p>

            <p>
              For operations teams, this means hours spent each day jumping between dashboards, manually pulling
              reports into spreadsheets, and making decisions based on incomplete — and often contradictory — information.
              The opportunity cost is enormous: while managers spend their mornings reconciling numbers, competitors
              are already adjusting their strategies based on real-time data.
            </p>

            <QuoteBlock
              quote="We practice what we preach — every decision at GrowDash is backed by data, every hypothesis is tested. When we showed restaurant operators what they were missing by not having a unified view of their delivery business, the reaction was immediate. They could see the revenue they were leaving on the table."
              author="Sean Trevaskis"
              title="Co-Founder & CEO, GrowDash"
            />

            <h3 className="!mt-8 text-base font-bold lg:text-lg">The Solution: Aisha, Your AI Delivery Manager</h3>

            <p>
              In 2024, GrowDash introduced <strong>Aisha</strong> — a proprietary AI agent that the company describes
              as a &ldquo;24/7 AI delivery manager.&rdquo; Powered by machine learning models trained on millions of
              data points from over 5,000 restaurants, Aisha transforms GrowDash from a dashboard into an active
              decision-making partner.
            </p>

            <p>
              Aisha analyses order patterns, advertising performance, discount effectiveness, and competitive positioning
              across all platforms in real time. Rather than presenting operators with charts to interpret, it surfaces
              specific recommendations: which platform to increase ad spend on this week, which locations need a
              discount adjustment, which new areas represent untapped growth potential.
            </p>

            <ArticleChart
              caption="Figure 1: Revenue retention (net-to-gross ratio) varies significantly across platforms — a key metric Aisha monitors for every restaurant"
              source="GrowDash aggregated restaurant data, 2025"
            >
              <HorizontalBar data={chartData.efficiencyBar} formatValue={(v) => `${v.toFixed(1)}%`} />
            </ArticleChart>

            <p>
              &ldquo;The gap between the most efficient and least efficient platform can be 10 to 15 percentage points
              in terms of revenue retention,&rdquo; explains Enver Sorkun, who leads product and engineering.
              &ldquo;On thousands of monthly orders, that translates to tens of thousands of dirhams. Aisha identifies
              these opportunities automatically and recommends actions — sometimes before the restaurant even realises
              there&apos;s a problem.&rdquo;
            </p>

            <h3 className="!mt-8 text-base font-bold lg:text-lg">Growth Story: From 100 to 5,000 Restaurants</h3>

            <p>
              GrowDash&apos;s trajectory mirrors the broader explosion of the UAE&apos;s delivery economy. After
              signing its first 100 restaurants in 2023 — driven by rapid adoption among multi-brand restaurant groups
              in the UAE — the platform scaled to over 5,000 restaurants by 2025.
            </p>

            <p>
              The company secured its seed funding round in 2024, led by <strong>Salica Investments</strong>, to
              accelerate product development and geographical expansion. That same year saw the launch of Aisha and a
              fundamental repositioning: from a data dashboard to an AI-powered operational platform.
            </p>

            <p>
              In 2025, GrowDash expanded into the UK market, marking the company&apos;s first foray outside the
              Middle East and signalling ambitions that extend well beyond the region.
            </p>

            <ArticleChart
              caption="Figure 2: Delivery market share is shifting month by month — GrowDash tracks these trends in real time for every restaurant"
              source="GrowDash aggregated restaurant data, 2025"
            >
              <TrendArea data={chartData.monthlyTrend} />
            </ArticleChart>

            <h3 className="!mt-8 text-base font-bold lg:text-lg">The Team: Industry Veterans Meet AI</h3>

            <p>
              GrowDash&apos;s leadership combines deep industry expertise with technical ambition.{' '}
              <strong>Sean Trevaskis</strong>, Co-Founder and CEO, brings commercial leadership experience from
              Talabat and Deliveroo across the Middle East, UK, and Europe. <strong>Enver Sorkun</strong>,
              Co-Founder and CPO, built and scaled Talabat&apos;s advertising and discount platform across eight
              countries and over 100,000 customers.
            </p>

            <p>
              The broader team of 28+ spans engineering, design, and operations across five countries — UAE, UK,
              Turkey, Pakistan, and India. The company&apos;s commercial leadership includes <strong>Gaelle</strong>,
              Commercial Director, recognised across MENA as a delivery expert after a decade leading commercial
              teams at Talabat and Zomato, and <strong>James</strong>, UK Commercial Lead, who joined from a senior
              role at Deliveroo to spearhead the company&apos;s expansion into the British market.
            </p>

            <QuoteBlock
              quote="Every feature we build starts with a real problem faced by restaurant operators. Their success is our success. We move fast, ship often, and learn quickly. The restaurants we serve don't have time for perfect — they need tools that work today and get better tomorrow."
              author="Enver Sorkun"
              title="Co-Founder & CPO, GrowDash"
            />

            <h3 className="!mt-8 text-base font-bold lg:text-lg">What Comes Next</h3>

            <p>
              With the UK launch underway and Aisha continuing to evolve, GrowDash is positioning itself at the
              intersection of two of the region&apos;s most powerful trends: the continued growth of food delivery
              and the rapid adoption of AI in business operations.
            </p>

            <p>
              For the thousands of restaurants already on the platform, the value proposition is straightforward:
              replace the chaos of five dashboards and gut-feel decisions with a single, AI-powered system that
              sees everything, analyses everything, and acts on the insights that matter.
            </p>

            <p>
              As Trevaskis puts it: &ldquo;One platform. One AI. Total clarity. That&apos;s what restaurants need,
              and that&apos;s what we deliver.&rdquo;
            </p>

            {/* Company timeline */}
            <div className="!mt-10 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                GrowDash Timeline
              </h4>
              <div className="relative space-y-0 border-l-2 border-primary/20 pl-6">
                {[
                  { year: '2022', event: 'Founded in Dubai by Sean Trevaskis and Enver Sorkun, after 5 years at Talabat' },
                  { year: '2023', event: 'First 100 restaurants onboarded; rapid adoption across UAE multi-brand groups' },
                  { year: '2024', event: 'Seed funding led by Salica Investments; launch of Aisha AI agent' },
                  { year: '2025', event: 'Surpasses 5,000 restaurants; UK market launch; operations across 6 countries' },
                ].map((item) => (
                  <div key={item.year} className="relative pb-4">
                    <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-primary bg-background" />
                    <p className="text-xs font-bold text-primary">{item.year}</p>
                    <p className="text-sm text-foreground/80">{item.event}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Boilerplate */}
            <div className="!mt-10 rounded-xl border border-border bg-muted/30 p-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                About GrowDash
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                GrowDash is the operating system for restaurant delivery. Founded in 2022 in Dubai, the company
                provides restaurants with a unified platform to manage, analyse, and optimise their operations
                across all delivery channels. Powered by Aisha, a proprietary AI agent trained on data from over
                5,000 restaurants, GrowDash turns data chaos into actionable insights that drive real growth.
                The company operates across 6 countries with a team of 28+ and is backed by Salica Investments.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Media contact:</strong> press@mygrowdash.com | <strong>Website:</strong>{' '}
                <a href="https://mygrowdash.com" target="_blank" rel="noopener noreferrer" className="underline">
                  mygrowdash.com
                </a>
              </p>
            </div>
          </PRArticle>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ARTICLE 3 — Founder Story */}
        {/* ═══════════════════════════════════════════ */}

        {chartData && (
          <PRArticle
            articleNumber={3}
            headline="'We Saw Restaurants Drowning in Data': How Two Talabat Veterans Built the Operating System for Delivery"
            subheadline="Sean Trevaskis and Enver Sorkun spent five years building the tools that powered Delivery Hero's restaurant advertising machine. Then they left to solve the problem from the other side."
            dateline={`Dubai, UAE — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          >
            <p>
              In 2017, when Sean Trevaskis and Enver Sorkun first joined <strong>Talabat</strong> — the Middle East&apos;s
              largest food delivery platform and a subsidiary of Germany&apos;s Delivery Hero — the region&apos;s delivery
              market was in its infancy. By the time they left five years later, they had built and scaled the advertising
              and discount technology that powered Talabat&apos;s growth across eight countries and more than 100,000
              restaurant partners.
            </p>

            <p>
              But it was what they witnessed on the restaurant side of the equation that would define their next chapter.
            </p>

            <QuoteBlock
              quote="We had the best seat in the house to see how restaurants interacted with delivery platforms. And what we saw was alarming. These operators had become e-commerce businesses overnight, but they were still making decisions with spreadsheets and gut feel. Five dashboards open at once, hours wasted on manual reporting, and no way to see the full picture."
              author="Sean Trevaskis"
              title="Co-Founder & CEO, GrowDash"
            />

            <h3 className="!mt-8 text-base font-bold lg:text-lg">The Moment That Changed Everything</h3>

            <p>
              The turning point came during a conversation with a Dubai-based restaurant group that operated across
              four delivery platforms. The operations manager described spending the first three hours of every working
              day logging into separate dashboards, pulling reports, copying data into spreadsheets, and attempting to
              reconcile figures that never quite matched.
            </p>

            <p>
              &ldquo;This was a sophisticated operator running dozens of locations,&rdquo; recalls Enver Sorkun,
              GrowDash&apos;s Co-Founder and Chief Product Officer. &ldquo;If they were struggling, imagine what
              it was like for a single-outlet owner trying to make sense of Talabat, Deliveroo, Careem, Noon,
              and now Keeta — all at the same time. The industry had a tool for everything except the thing operators
              actually needed: clarity.&rdquo;
            </p>

            <p>
              In 2022, Trevaskis and Sorkun left Talabat and founded <strong>GrowDash</strong> in Dubai with a
              mission that could fit on a napkin: <em>one platform, one AI, total clarity</em>.
            </p>

            <h3 className="!mt-8 text-base font-bold lg:text-lg">Building from the Inside Out</h3>

            <p>
              What gives GrowDash its edge, both founders argue, is that they didn&apos;t build a solution from the
              outside looking in. Having spent half a decade inside the platform ecosystem — understanding how
              advertising algorithms work, how discount mechanics affect order flow, how commission structures vary
              by market — they designed GrowDash to address the specific blind spots that restaurant operators face.
            </p>

            <InfoBox
              title="The Problem in Numbers"
              items={[
                { label: 'Dashboards checked daily', value: '5+', icon: <BarChart3 className="h-4 w-4" /> },
                { label: 'Hours on manual reporting', value: '3+', icon: <Zap className="h-4 w-4" /> },
                { label: 'Decisions on gut feel', value: 'Most', icon: <Target className="h-4 w-4" /> },
                { label: 'Revenue left on table', value: 'Millions', icon: <TrendingUp className="h-4 w-4" /> },
              ]}
            />

            <p>
              &ldquo;Other analytics tools give you charts,&rdquo; says Sorkun. &ldquo;We built something that
              understands how the platforms actually work — because we built those platforms. When Aisha recommends
              shifting ad spend from one channel to another, it&apos;s not a generic suggestion. It&apos;s based on
              how the algorithms on each platform actually respond to budget changes.&rdquo;
            </p>

            <h3 className="!mt-8 text-base font-bold lg:text-lg">From Dashboard to AI Delivery Manager</h3>

            <p>
              GrowDash&apos;s first product was a unified analytics dashboard — bringing data from every delivery
              platform into a single view. It was enough to win the company&apos;s first 100 restaurant partners
              in 2023, with rapid adoption across UAE-based multi-brand groups who immediately saw the time savings.
            </p>

            <p>
              But the founders always knew the dashboard was just the beginning.
            </p>

            <QuoteBlock
              quote="Dashboards are passive. They wait for you to log in, find the right chart, interpret the data, and decide what to do. We wanted to flip that model entirely. We wanted a system that would proactively tell operators what's happening, why it matters, and what to do about it — 24 hours a day, seven days a week."
              author="Enver Sorkun"
              title="Co-Founder & CPO, GrowDash"
            />

            <p>
              That vision materialised in 2024 with the launch of <strong>Aisha</strong> — GrowDash&apos;s proprietary
              AI agent. Named deliberately to feel like a member of the team rather than a piece of software, Aisha is
              trained on millions of data points from over 5,000 restaurants. It monitors order patterns, advertising
              performance, discount ROI, competitive positioning, and market trends across every platform — then surfaces
              specific, actionable recommendations.
            </p>

            <p>
              The impact was transformational. Restaurant groups that had previously relied on weekly manual reviews
              were suddenly receiving real-time alerts and recommendations. An operator might wake up to a message from
              Aisha noting that their ROAS on one platform had dropped 40% overnight and suggesting a specific budget
              reallocation — before the morning team meeting had even started.
            </p>

            <ArticleChart
              caption="Figure 1: Advertising efficiency (ROAS) varies dramatically across platforms — the kind of insight Aisha surfaces automatically for every restaurant"
              source="GrowDash aggregated restaurant data, 2025"
            >
              <HorizontalBar data={chartData.roasBar} formatValue={(v) => `${v.toFixed(1)}x`} />
            </ArticleChart>

            <h3 className="!mt-8 text-base font-bold lg:text-lg">Scaling at Speed: The GrowDash Growth Story</h3>

            <p>
              The numbers tell their own story. From 100 restaurants in 2023, GrowDash scaled to over 5,000 by 2025 —
              a 50x increase in under two years. The growth was organic at first, driven by word of mouth among
              restaurant operators who shared a common pain point. Then it accelerated.
            </p>

            <p>
              In 2024, the company raised a <strong>seed round led by Salica Investments</strong>, providing the
              capital to invest in Aisha&apos;s development and begin planning international expansion. The same year
              saw Gaelle — recognised across MENA as a delivery expert after a decade leading commercial teams at
              Talabat and Zomato — join as Commercial Director, bringing with her a deep network across the region&apos;s
              restaurant industry.
            </p>

            <p>
              By early 2025, the team had grown to 28+ across five countries — the UAE, UK, Turkey, Pakistan, and India —
              and GrowDash launched operations in the <strong>United Kingdom</strong>, its first market outside the
              Middle East. James, a self-described &ldquo;ultimate restaurant nerd&rdquo; who previously served as
              Senior National Account Manager at Deliveroo, was brought on to lead the UK expansion.
            </p>

            {/* Growth timeline visual */}
            <div className="!mt-8 grid grid-cols-1 gap-3 sm:grid-cols-5">
              {[
                { year: '2022', metric: '0', label: 'Founded', color: 'bg-slate-500' },
                { year: '2023', metric: '100', label: 'Restaurants', color: 'bg-blue-500' },
                { year: '2024', metric: 'Seed', label: 'Funded', color: 'bg-emerald-500' },
                { year: '2024', metric: 'Aisha', label: 'Launched', color: 'bg-purple-500' },
                { year: '2025', metric: '5,000+', label: 'Restaurants', color: 'bg-primary' },
              ].map((item, i) => (
                <div key={i} className="relative overflow-hidden rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <div className={`absolute inset-x-0 top-0 h-1 ${item.color}`} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.year}</p>
                  <p className="mt-1 text-xl font-bold">{item.metric}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            <h3 className="!mt-8 text-base font-bold lg:text-lg">Culture as Competitive Advantage</h3>

            <p>
              Ask Trevaskis and Sorkun what separates GrowDash from the growing number of restaurant-tech startups
              in the region, and the answer goes beyond product features. They point to four values that, they say,
              govern every decision — from which feature to build next to how a customer support ticket is handled.
            </p>

            {/* Values grid */}
            <div className="!mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  icon: <Heart className="h-5 w-5" />,
                  title: 'Customer Obsessed',
                  desc: 'Every feature starts with a real problem faced by restaurant operators. Their success is the only metric that matters.',
                },
                {
                  icon: <Rocket className="h-5 w-5" />,
                  title: 'Bias for Action',
                  desc: 'Move fast, ship often, learn quickly. Perfect is the enemy of good — the team iterates relentlessly.',
                },
                {
                  icon: <Lightbulb className="h-5 w-5" />,
                  title: 'Data-Driven Decisions',
                  desc: 'GrowDash practices what it preaches. Every internal decision is backed by data, every hypothesis tested.',
                },
                {
                  icon: <Shield className="h-5 w-5" />,
                  title: 'Transparency & Trust',
                  desc: 'No hidden agendas, no corporate speak. Honest with each other and with customers — always.',
                },
              ].map((value) => (
                <div key={value.title} className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {value.icon}
                    </div>
                    <h4 className="text-sm font-semibold">{value.title}</h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{value.desc}</p>
                </div>
              ))}
            </div>

            <p className="!mt-6">
              &ldquo;We&apos;re not building for restaurant operators from a distance,&rdquo; says Trevaskis.
              &ldquo;Most of our team has worked inside delivery platforms or inside restaurants. We know what
              2am order reconciliation feels like. We know the frustration of running a promotion that cannibalises
              your margins. That empathy is baked into everything we build.&rdquo;
            </p>

            <h3 className="!mt-8 text-base font-bold lg:text-lg">The Bigger Picture: Why Restaurants Need an Operating System</h3>

            <p>
              The shift GrowDash is betting on goes beyond analytics. The founders believe that the restaurant
              delivery industry is undergoing the same transformation that e-commerce went through a decade ago —
              when merchants realised they couldn&apos;t manage Amazon, eBay, and their own website with separate
              tools and spreadsheets.
            </p>

            <p>
              &ldquo;Shopify didn&apos;t just give merchants a dashboard,&rdquo; explains Sorkun. &ldquo;It gave
              them an operating system — a single place to manage inventory, marketing, fulfilment, and analytics.
              That&apos;s what restaurants need for delivery. And that&apos;s what we&apos;re building.&rdquo;
            </p>

            <ArticleChart
              caption="Figure 2: Market share distribution across UAE delivery platforms — the multi-platform reality that makes a unified operating system essential"
              source="GrowDash aggregated restaurant data, 2025"
            >
              <MarketShareDonut data={chartData.marketShareDonut} />
            </ArticleChart>

            <p>
              With five platforms now active in the UAE market, the complexity is only increasing. GrowDash&apos;s
              own data makes the case better than any pitch deck could. According to aggregated insights
              from its 5,000+ restaurant network, <strong>{chartData.leader.channel}</strong> commands
              roughly <strong>~{Math.round(chartData.leaderShare)}%</strong> of delivery orders in the UAE —
              but the remaining four platforms collectively hold over <strong>~{Math.round(100 - chartData.leaderShare)}%</strong>,
              making the market far more competitive than most operators realise. Average order values swing
              by as much as <strong>AED {chartData.aovBar.length >= 2 ? Math.abs(chartData.aovBar[0].value - chartData.aovBar[chartData.aovBar.length - 1].value).toFixed(0) : '20'}+</strong> between
              the highest and lowest platforms — meaning a restaurant&apos;s revenue-per-order strategy should
              be platform-specific, not one-size-fits-all.
            </p>

            <ArticleChart
              caption="Figure 3: Average Order Value (AED) varies significantly across platforms — a critical blind spot for restaurants without a unified view"
              source="GrowDash aggregated restaurant data, 2025"
            >
              <VerticalBar data={chartData.aovBar} formatValue={(v) => `AED ${v.toFixed(0)}`} />
            </ArticleChart>

            <p>
              Perhaps more striking is the advertising gap. GrowDash data reveals that Return on Ad Spend varies
              by up to <strong>{chartData.roasBar.length >= 2 ? (chartData.roasBar[0].value / chartData.roasBar[chartData.roasBar.length - 1].value).toFixed(1) : '3'}x</strong> between
              the best- and worst-performing platform — meaning a restaurant spending equally across all channels
              could be losing a significant share of its advertising budget on the wrong platform. These are
              exactly the kind of insights, Sorkun argues, that a human operations manager juggling five dashboards
              at 8am simply cannot catch — but an AI trained on millions of data points can surface in seconds.
            </p>

            <h3 className="!mt-8 text-base font-bold lg:text-lg">Looking Ahead: From the Middle East to the World</h3>

            <p>
              The UK launch in 2025 is just the beginning of GrowDash&apos;s international ambitions. While the
              founders are careful not to reveal too much about their roadmap, Trevaskis acknowledges that the
              delivery data chaos they identified in the UAE exists in virtually every market.
            </p>

            <p>
              &ldquo;The platforms are different in London than they are in Dubai,&rdquo; he says. &ldquo;But the
              problem is identical. Restaurant operators everywhere are juggling multiple platforms, drowning in
              dashboards, and making decisions without the full picture. GrowDash and Aisha solve that problem —
              regardless of which platforms are dominant in a given market.&rdquo;
            </p>

            <QuoteBlock
              quote="Three years ago, we were two people with a thesis. Today we're 28 people across five countries, powering over 5,000 restaurants, with an AI that's making decisions that used to take operations teams hours. But honestly? We feel like we're just getting started. The restaurant delivery industry is enormous, and we've barely scratched the surface of what Aisha can do."
              author="Sean Trevaskis"
              title="Co-Founder & CEO, GrowDash"
            />

            <p>
              For restaurant operators in the UAE and the UK — and, if the founders have their way, many more
              markets soon — the message is simple. The era of managing delivery by gut feel, spreadsheet, and
              hope is over. There is now an alternative: a platform built by people who understand the industry
              from the inside, powered by an AI that never sleeps.
            </p>

            <p>
              One platform. One AI. Total clarity.
            </p>

            {/* Team profiles */}
            <div className="!mt-10 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                The GrowDash Leadership Team
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    name: 'Sean Trevaskis',
                    role: 'Co-Founder & CEO',
                    bio: 'Highly experienced commercial leader with deep industry knowledge gained working at Talabat and Deliveroo across the Middle East, UK and Europe.',
                    initials: 'ST',
                  },
                  {
                    name: 'Enver Sorkun',
                    role: 'Co-Founder & CPO',
                    bio: 'A product and engineering leader who built and scaled Talabat\'s advertising and discount platform across 8 countries and over 100,000 customers.',
                    initials: 'ES',
                  },
                  {
                    name: 'Gaelle',
                    role: 'Commercial Director',
                    bio: 'Recognised across MENA as a delivery expert after spending over 10 years leading commercial teams at Talabat and Zomato.',
                    initials: 'G',
                  },
                  {
                    name: 'James',
                    role: 'UK Commercial Lead',
                    bio: 'A career spanning restaurant operations, restaurant tech, and most recently Senior National Account Manager at Deliveroo.',
                    initials: 'J',
                  },
                ].map((person) => (
                  <div key={person.name} className="flex gap-3 rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {person.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{person.name}</p>
                      <p className="text-xs font-medium text-primary/80">{person.role}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{person.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Plus <strong>Aisha</strong>, the AI Delivery Manager — your 24/7 delivery expert powered by machine learning
                and trained on millions of data points — and 25+ talented engineers, designers, and operators across 5 countries.
              </p>
            </div>

            {/* Boilerplate */}
            <div className="!mt-10 rounded-xl border border-border bg-muted/30 p-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                About GrowDash
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                GrowDash is the operating system for restaurant delivery. Founded in 2022 in Dubai by Sean Trevaskis
                and Enver Sorkun — both former Talabat executives — the company provides restaurants with a unified
                platform to manage, analyse, and optimise their operations across all delivery channels. Powered by
                Aisha, a proprietary AI agent trained on data from over 5,000 restaurants, GrowDash turns data chaos
                into actionable insights that drive real growth. The company operates across 6 countries with a team
                of 28+ and is backed by Salica Investments. For more information visit{' '}
                <a href="https://growdash.ai" target="_blank" rel="noopener noreferrer" className="underline">
                  growdash.ai
                </a>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Media contact:</strong> press@mygrowdash.com | <strong>Website:</strong>{' '}
                <a href="https://growdash.ai" target="_blank" rel="noopener noreferrer" className="underline">
                  growdash.ai
                </a>
              </p>
            </div>
          </PRArticle>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* Footer Note */}
        {/* ═══════════════════════════════════════════ */}
        {chartData && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> All market data uses percentages and ratios from aggregated, anonymised restaurant data.
              No proprietary revenue figures or individual restaurant data are disclosed. Content prepared for{' '}
              <strong>Caterer Middle East</strong> publication. Charts can be exported using the Print function.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
