'use client';

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  title: string;
  data: PieChartData[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: PieChartData }[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.value.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export function PieChartCard({ title, data }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const percentageData = data.map((item) => ({
    ...item,
    value: total > 0 ? (item.value / total) * 100 : 0,
  }));

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={percentageData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                strokeWidth={0}
              >
                {percentageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value, entry) => {
                  const payload = entry.payload as PieChartData | undefined;
                  return `${value} (${payload?.value?.toFixed(1) ?? 0}%)`;
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
