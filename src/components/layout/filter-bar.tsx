'use client';

import { useFilterStore } from '@/store/filter-store';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, X } from 'lucide-react';
import { trackFilterChange } from '@/lib/tracking-client';

// Signal strength colors - green for high, red for low
const SIGNAL_COLORS = {
  active: ['#22C55E', '#84CC16', '#EAB308', '#F97316', '#EF4444'],
  inactive: '#E5E7EB',
};

const SIGNAL_LABELS: Record<number, string> = {
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
  5: 'Excellent',
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

/** Format a YYYY-MM string into a human-readable month label */
function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('en', {
    month: 'short',
    year: 'numeric',
  });
}

/** Helper to build a label for a multiselect dropdown */
function getMultiSelectLabel(selected: string[], allLabel: string) {
  if (selected.length === 0) return allLabel;
  if (selected.length === 1) return selected[0];
  return `${selected.length} selected`;
}

interface FilterBarProps {
  showSignalStrength?: boolean;
  /** Hide month filter (e.g. for weekly figures page) */
  hideMonth?: boolean;
}

export function FilterBar({ showSignalStrength = false, hideMonth = false }: FilterBarProps) {
  const {
    options,
    selectedMonths,
    selectedCities,
    selectedAreas,
    selectedCuisines,
    selectedSignalStrengths,
    toggleMonth,
    toggleCity,
    toggleArea,
    toggleCuisine,
    toggleSignalStrength,
    resetFilters,
  } = useFilterStore();

  const hasActiveFilters =
    selectedMonths.length > 0 ||
    selectedCities.length > 0 ||
    selectedAreas.length > 0 ||
    selectedCuisines.length > 0 ||
    selectedSignalStrengths.length > 0;

  const handleMonthToggle = (month: string) => {
    toggleMonth(month);
    trackFilterChange({ filter: 'month', value: month });
  };

  const handleCityToggle = (city: string) => {
    toggleCity(city);
    trackFilterChange({ filter: 'city', value: city });
  };

  const handleAreaToggle = (area: string) => {
    toggleArea(area);
    trackFilterChange({ filter: 'area', value: area });
  };

  const handleCuisineToggle = (cuisine: string) => {
    toggleCuisine(cuisine);
    trackFilterChange({ filter: 'cuisine', value: cuisine });
  };

  const handleSignalToggle = (strength: number) => {
    toggleSignalStrength(strength);
    trackFilterChange({ filter: 'signal_strength', value: strength });
  };

  const getMonthLabel = () => {
    if (selectedMonths.length === 0) return 'All Months';
    if (selectedMonths.length === 1) return formatMonthLabel(selectedMonths[0]);
    return `${selectedMonths.length} selected`;
  };

  const getSignalStrengthLabel = () => {
    if (selectedSignalStrengths.length === 0) return 'All Signals';
    if (selectedSignalStrengths.length === 5) return 'All Signals';
    if (selectedSignalStrengths.length === 1) {
      return `${selectedSignalStrengths[0]} - ${SIGNAL_LABELS[selectedSignalStrengths[0]]}`;
    }
    return `${selectedSignalStrengths.length} selected`;
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
      {/* Month - multiselect */}
      {!hideMonth && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Month</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[160px] justify-between font-normal">
                <span className="truncate">{getMonthLabel()}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[300px] w-[200px] overflow-y-auto">
              {options.months.map((month) => (
                <DropdownMenuCheckboxItem
                  key={month}
                  checked={selectedMonths.includes(month)}
                  onCheckedChange={() => handleMonthToggle(month)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {formatMonthLabel(month)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* City - multiselect */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">City</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[160px] justify-between font-normal">
              <span className="truncate">{getMultiSelectLabel(selectedCities, 'All Cities')}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-[300px] w-[200px] overflow-y-auto">
            {options.cities.map((city) => (
              <DropdownMenuCheckboxItem
                key={city}
                checked={selectedCities.includes(city)}
                onCheckedChange={() => handleCityToggle(city)}
                onSelect={(e) => e.preventDefault()}
              >
                {city}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Area - multiselect */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Area</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between font-normal">
              <span className="truncate">{getMultiSelectLabel(selectedAreas, 'All Areas')}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-[300px] w-[220px] overflow-y-auto">
            {options.areas.map((area) => (
              <DropdownMenuCheckboxItem
                key={area}
                checked={selectedAreas.includes(area)}
                onCheckedChange={() => handleAreaToggle(area)}
                onSelect={(e) => e.preventDefault()}
              >
                {area}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cuisine - multiselect */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Cuisine</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between font-normal">
              <span className="truncate">
                {getMultiSelectLabel(selectedCuisines, 'All Cuisines')}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-[300px] w-[220px] overflow-y-auto">
            {options.cuisines.map((cuisine) => (
              <DropdownMenuCheckboxItem
                key={cuisine}
                checked={selectedCuisines.includes(cuisine)}
                onCheckedChange={() => handleCuisineToggle(cuisine)}
                onSelect={(e) => e.preventDefault()}
              >
                {cuisine}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showSignalStrength && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filter-signal-strength"
            className="text-xs font-medium text-muted-foreground"
          >
            Signal Strength
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="filter-signal-strength"
                variant="outline"
                className="w-[160px] justify-between font-normal"
              >
                <span className="truncate">{getSignalStrengthLabel()}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              {[1, 2, 3, 4, 5].map((strength) => (
                <DropdownMenuCheckboxItem
                  key={strength}
                  checked={selectedSignalStrengths.includes(strength)}
                  onCheckedChange={() => handleSignalToggle(strength)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-3">
                    <SignalStrengthIndicator strength={strength} />
                    <span>
                      {strength} - {SIGNAL_LABELS[strength]}
                    </span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Clear all filters */}
      {hasActiveFilters && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-transparent select-none">&nbsp;</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetFilters();
              trackFilterChange({ filter: 'all', value: 'cleared' });
            }}
            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
