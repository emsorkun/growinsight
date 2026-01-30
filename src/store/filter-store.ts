import { create } from 'zustand';
import type { FilterState, FilterOptions } from '@/types';

interface FilterStore extends FilterState {
  options: FilterOptions;
  setSelectedMonth: (month: string) => void;
  setSelectedCity: (city: string) => void;
  setSelectedArea: (area: string) => void;
  setSelectedCuisine: (cuisine: string) => void;
  setOptions: (options: FilterOptions) => void;
  resetFilters: () => void;
}

const initialState: FilterState = {
  selectedMonth: 'all',
  selectedCity: 'all',
  selectedArea: 'all',
  selectedCuisine: 'all',
};

export const useFilterStore = create<FilterStore>((set) => ({
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
  setOptions: (options: FilterOptions) => set({ options }),
  resetFilters: () => set(initialState),
}));
