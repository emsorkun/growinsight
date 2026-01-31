import { CHANNEL_COLORS, type AggregatedData, type Channel } from '@/types';

export interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export function getDashboardChartData(channelData: AggregatedData[]) {
  return {
    orders: channelData.map((d) => ({
      name: d.channel,
      value: d.orders,
      color: CHANNEL_COLORS[d.channel as Channel],
    })),
    netSales: channelData.map((d) => ({
      name: d.channel,
      value: d.netSales,
      color: CHANNEL_COLORS[d.channel as Channel],
    })),
    adsSpendVsGross: channelData.map((d) => ({
      name: d.channel,
      value: d.grossSales > 0 ? (d.adsSpend / d.grossSales) * 100 : 0,
      color: CHANNEL_COLORS[d.channel as Channel],
    })),
    discountSpendVsGross: channelData.map((d) => ({
      name: d.channel,
      value: d.grossSales > 0 ? (d.discountSpend / d.grossSales) * 100 : 0,
      color: CHANNEL_COLORS[d.channel as Channel],
    })),
    totalMarketingVsGross: channelData.map((d) => ({
      name: d.channel,
      value: d.grossSales > 0 ? ((d.adsSpend + d.discountSpend) / d.grossSales) * 100 : 0,
      color: CHANNEL_COLORS[d.channel as Channel],
    })),
    roas: channelData.map((d) => ({
      name: d.channel,
      value: d.roas,
      color: CHANNEL_COLORS[d.channel as Channel],
    })),
    aov: channelData.map((d) => ({
      name: d.channel,
      value: d.aov,
      color: CHANNEL_COLORS[d.channel as Channel],
    })),
  };
}
