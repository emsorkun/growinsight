import { create } from 'zustand';
import type { FilterState, FilterOptions } from '@/types';

interface FilterStore extends FilterState {
  options: FilterOptions;
  selectedSignalStrengths: number[];
  setSelectedMonths: (months: string[]) => void;
  toggleMonth: (month: string) => void;
  setSelectedCities: (cities: string[]) => void;
  toggleCity: (city: string) => void;
  setSelectedAreas: (areas: string[]) => void;
  toggleArea: (area: string) => void;
  setSelectedCuisines: (cuisines: string[]) => void;
  toggleCuisine: (cuisine: string) => void;
  setSelectedSignalStrengths: (strengths: number[]) => void;
  toggleSignalStrength: (strength: number) => void;
  setOptions: (options: FilterOptions) => void;
  resetFilters: () => void;
}

const initialState: FilterState & { selectedSignalStrengths: number[] } = {
  selectedMonths: [],
  selectedCities: [],
  selectedAreas: [],
  selectedCuisines: [],
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

  setSelectedMonths: (months: string[]) => set({ selectedMonths: months }),
  toggleMonth: (month: string) => {
    const current = get().selectedMonths;
    if (current.includes(month)) {
      set({ selectedMonths: current.filter((m) => m !== month) });
    } else {
      set({ selectedMonths: [...current, month].sort() });
    }
  },

  setSelectedCities: (cities: string[]) => set({ selectedCities: cities }),
  toggleCity: (city: string) => {
    const current = get().selectedCities;
    if (current.includes(city)) {
      set({ selectedCities: current.filter((c) => c !== city), selectedAreas: [] });
    } else {
      set({ selectedCities: [...current, city].sort(), selectedAreas: [] });
    }
  },

  setSelectedAreas: (areas: string[]) => set({ selectedAreas: areas }),
  toggleArea: (area: string) => {
    const current = get().selectedAreas;
    if (current.includes(area)) {
      set({ selectedAreas: current.filter((a) => a !== area) });
    } else {
      set({ selectedAreas: [...current, area].sort() });
    }
  },

  setSelectedCuisines: (cuisines: string[]) => set({ selectedCuisines: cuisines }),
  toggleCuisine: (cuisine: string) => {
    const current = get().selectedCuisines;
    if (current.includes(cuisine)) {
      set({ selectedCuisines: current.filter((c) => c !== cuisine) });
    } else {
      set({ selectedCuisines: [...current, cuisine].sort() });
    }
  },

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
