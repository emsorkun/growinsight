'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHANNEL_COLORS, type Channel } from '@/types';

interface StackedBarChartProps {
  title: string;
  data: Array<{
    month: string;
    marketShare: Record<Channel, number>;
  }>;
}

const CHANNELS: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="font-medium mb-2">{label}</p>
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

export function StackedBarChartCard({ title, data }: StackedBarChartProps) {
  const chartData = data.map((item) => ({
    month: item.month.substring(0, 3),
    ...item.marketShare,
  }));

  return (
    <Card className="card-hover col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value) => value}
                wrapperStyle={{ paddingTop: '1rem' }}
              />
              {CHANNELS.map((channel) => (
                <Bar
                  key={channel}
                  dataKey={channel}
                  stackId="a"
                  fill={CHANNEL_COLORS[channel]}
                >
                  <LabelList
                    dataKey={channel}
                    position="center"
                    formatter={(value: number) => value >= 5 ? `${value.toFixed(0)}%` : ''}
                    style={{ 
                      fill: '#fff', 
                      fontSize: 10,
                      fontWeight: 600,
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  />
                </Bar>
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
