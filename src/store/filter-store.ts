import { create } from 'zustand';
import type { FilterState, FilterOptions } from '@/types';

interface FilterStore extends FilterState {
  options: FilterOptions;
  selectedSignalStrengths: number[];
  setSelectedMonth: (month: string) => void;
  setSelectedCity: (city: string) => void;
  setSelectedArea: (area: string) => void;
  setSelectedCuisine: (cuisine: string) => void;
  setSelectedSignalStrengths: (strengths: number[]) => void;
  toggleSignalStrength: (strength: number) => void;
  setOptions: (options: FilterOptions) => void;
  resetFilters: () => void;
}

const initialState: FilterState & { selectedSignalStrengths: number[] } = {
  selectedMonth: 'all',
  selectedCity: 'all',
  selectedArea: 'all',
  selectedCuisine: 'all',
  selectedSignalStrengths: [],
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...initialState,
  options: {
    months: [],
    cities: [],
    areas: [],
    cuisines: [],
  },

  setSelectedMonth: (month: string) => set({ selectedMonth: month }),
  setSelectedCity: (city: string) => set({ selectedCity: city, selectedArea: 'all' }),
  setSelectedArea: (area: string) => set({ selectedArea: area }),
  setSelectedCuisine: (cuisine: string) => set({ selectedCuisine: cuisine }),
  setSelectedSignalStrengths: (strengths: number[]) => set({ selectedSignalStrengths: strengths }),
  toggleSignalStrength: (strength: number) => {
    const current = get().selectedSignalStrengths;
    if (current.includes(strength)) {
      set({ selectedSignalStrengths: current.filter((s) => s !== strength) });
    } else {
      set({ selectedSignalStrengths: [...current, strength].sort() });
    }
  },
  setOptions: (options: FilterOptions) => set({ options }),
  resetFilters: () => set(initialState),
}));
