'use client';

import { useFilterStore } from '@/store/filter-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function FilterBar() {
  const {
    options,
    selectedMonth,
    selectedCity,
    selectedArea,
    selectedCuisine,
    setSelectedMonth,
    setSelectedCity,
    setSelectedArea,
    setSelectedCuisine,
  } = useFilterStore();

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Month</label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[160px]">
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

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">City</label>
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-[160px]">
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
        <label className="text-xs font-medium text-muted-foreground">Area</label>
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className="w-[180px]">
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
        <label className="text-xs font-medium text-muted-foreground">Cuisine</label>
        <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
          <SelectTrigger className="w-[180px]">
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
    </div>
  );
}
