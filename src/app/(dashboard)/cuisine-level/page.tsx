'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { FilterBar } from '@/components/layout/filter-bar';
import { useFilterStore } from '@/store/filter-store';
import { CHANNEL_COLORS, getCuisineIcon, type MarketShareByCuisine, type Channel } from '@/types';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHANNELS: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

type SortColumn = 'cuisine' | Channel;
type SortDirection = 'asc' | 'desc';

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

export default function CuisineLevelPage() {
  const [data, setData] = useState<MarketShareByCuisine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { selectedMonth, selectedCity, selectedArea } = useFilterStore();

  const fetchCuisineData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedMonth !== 'all') params.set('month', selectedMonth);
      if (selectedCity !== 'all') params.set('city', selectedCity);
      if (selectedArea !== 'all') params.set('area', selectedArea);

      const response = await fetch(`/api/cuisines?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Set mock data for demo
      setData(getMockCuisineData());
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedCity, selectedArea]);

  useEffect(() => {
    fetchCuisineData();
  }, [fetchCuisineData]);

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  }, [sortColumn]);

  const filteredData = useMemo(() => {
    let result = data;
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter((item) =>
        item.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;
        
        if (sortColumn === 'cuisine') {
          aValue = a.cuisine.toLowerCase();
          bValue = b.cuisine.toLowerCase();
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
  }, [data, searchQuery, sortColumn, sortDirection]);

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
      <Header title="Cuisine Level Analysis" subtitle="Market share by cuisine categories" />

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
              <CardTitle className="text-lg font-semibold">Market Share by Cuisine</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search cuisines..."
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
                        column="cuisine"
                        label="Cuisine"
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No cuisines found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((row) => {
                        const highestChannel = getHighestChannel(row.marketShare);
                        return (
                          <TableRow key={row.cuisine} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getCuisineIcon(row.cuisine)}</span>
                                {row.cuisine}
                              </div>
                            </TableCell>
                            {CHANNELS.map((channel) => (
                              <TableCell
                                key={channel}
                                className={cn(
                                  'text-center',
                                  highestChannel === channel &&
                                    'font-semibold'
                                )}
                                style={
                                  highestChannel === channel
                                    ? { color: CHANNEL_COLORS[channel] }
                                    : undefined
                                }
                              >
                                {row.marketShare[channel]?.toFixed(1)}%
                              </TableCell>
                            ))}
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
    </div>
  );
}

function getMockCuisineData(): MarketShareByCuisine[] {
  const cuisines = [
    'American',
    'Asian',
    'Beverages',
    'Breakfast & Bakery',
    'Desserts & Sweets',
    'Healthy & Special Diets',
    'Indian',
    'International',
    'Italian',
    'Mexican',
    'Middle Eastern',
    'Seafood',
    'Shawarma',
    'Soup & Liquid',
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
        const baseShare = [38, 27, 18, 12, 5][index];
        const randomVariation = (Math.random() - 0.5) * 12;
        const share = Math.max(0, baseShare + randomVariation);
        marketShare[channel] = Math.min(remaining, share);
        remaining -= marketShare[channel];
      }
    });

    return { cuisine, marketShare };
  });
}
