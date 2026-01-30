'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarChartData {
  name: string;
  value: number;
  color: string;
}

interface BarChartProps {
  title: string;
  data: BarChartData[];
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
}

const CustomTooltip = ({ 
  active, 
  payload, 
  label,
  formatValue 
}: { 
  active?: boolean; 
  payload?: { value: number; payload: BarChartData }[]; 
  label?: string;
  formatValue?: (value: number) => string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          {formatValue ? formatValue(payload[0].value) : payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export function BarChartCard({ title, data, yAxisLabel, formatValue }: BarChartProps) {
  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
                label={yAxisLabel ? { 
                  value: yAxisLabel, 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: 'var(--muted-foreground)',
                  fontSize: 12,
                } : undefined}
              />
              <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
