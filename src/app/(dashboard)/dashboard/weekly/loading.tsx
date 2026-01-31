import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-[280px] animate-pulse rounded bg-muted/50" />
      </CardContent>
    </Card>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-card p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="h-9 w-[160px] animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function WeeklyFiguresLoading() {
  return (
    <div className="flex flex-col">
      <Header title="Weekly Figures" subtitle="Last 12 weeks" />
      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <FilterBarSkeleton />
        <div className="grid gap-6 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
        <div className="grid gap-6 md:grid-cols-3">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    </div>
  );
}
