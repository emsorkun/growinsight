'use client';

import { useFilterStore } from '@/store/filter-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

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
              level <= strength
                ? SIGNAL_COLORS.active[level - 1]
                : SIGNAL_COLORS.inactive,
          }}
        />
      ))}
    </div>
  );
}

interface FilterBarProps {
  showSignalStrength?: boolean;
  /** Hide month filter (e.g. for weekly figures page) */
  hideMonth?: boolean;
}

export function FilterBar({ showSignalStrength = false, hideMonth = false }: FilterBarProps) {
  const {
    options,
    selectedMonth,
    selectedCity,
    selectedArea,
    selectedCuisine,
    selectedSignalStrengths,
    setSelectedMonth,
    setSelectedCity,
    setSelectedArea,
    setSelectedCuisine,
    toggleSignalStrength,
  } = useFilterStore();

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
      {!hideMonth && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-month" className="text-xs font-medium text-muted-foreground">
            Month
          </label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger id="filter-month" className="w-[160px]">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {options.months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-city" className="text-xs font-medium text-muted-foreground">
          City
        </label>
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger id="filter-city" className="w-[160px]">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {options.cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-area" className="text-xs font-medium text-muted-foreground">
          Area
        </label>
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger id="filter-area" className="w-[180px]">
            <SelectValue placeholder="All Areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {options.areas.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-cuisine" className="text-xs font-medium text-muted-foreground">
          Cuisine
        </label>
        <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
          <SelectTrigger id="filter-cuisine" className="w-[180px]">
            <SelectValue placeholder="All Cuisines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cuisines</SelectItem>
            {options.cuisines.map((cuisine) => (
              <SelectItem key={cuisine} value={cuisine}>
                {cuisine}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showSignalStrength && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-signal-strength" className="text-xs font-medium text-muted-foreground">
            Signal Strength
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button id="filter-signal-strength" variant="outline" className="w-[160px] justify-between font-normal">
                <span className="truncate">{getSignalStrengthLabel()}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              {[1, 2, 3, 4, 5].map((strength) => (
                <DropdownMenuCheckboxItem
                  key={strength}
                  checked={selectedSignalStrengths.includes(strength)}
                  onCheckedChange={() => toggleSignalStrength(strength)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-3">
                    <SignalStrengthIndicator strength={strength} />
                    <span>{strength} - {SIGNAL_LABELS[strength]}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
