import { describe, it, expect, beforeEach } from 'vitest';
import { useFilterStore } from '@/store/filter-store';

describe('Filter Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFilterStore.setState({
      selectedMonth: 'all',
      selectedCity: 'all',
      selectedArea: 'all',
      selectedCuisine: 'all',
      options: {
        months: [],
        cities: [],
        areas: [],
        cuisines: [],
      },
    });
  });

  describe('setSelectedMonth', () => {
    it('should update selected month', () => {
      useFilterStore.getState().setSelectedMonth('January');
      expect(useFilterStore.getState().selectedMonth).toBe('January');
    });
  });

  describe('setSelectedCity', () => {
    it('should update selected city', () => {
      useFilterStore.getState().setSelectedCity('Dubai');
      expect(useFilterStore.getState().selectedCity).toBe('Dubai');
    });

    it('should reset area when city changes', () => {
      useFilterStore.getState().setSelectedArea('Marina');
      useFilterStore.getState().setSelectedCity('Abu Dhabi');

      expect(useFilterStore.getState().selectedCity).toBe('Abu Dhabi');
      expect(useFilterStore.getState().selectedArea).toBe('all');
    });
  });

  describe('setSelectedArea', () => {
    it('should update selected area', () => {
      useFilterStore.getState().setSelectedArea('Marina');
      expect(useFilterStore.getState().selectedArea).toBe('Marina');
    });
  });

  describe('setSelectedCuisine', () => {
    it('should update selected cuisine', () => {
      useFilterStore.getState().setSelectedCuisine('Italian');
      expect(useFilterStore.getState().selectedCuisine).toBe('Italian');
    });
  });

  describe('setOptions', () => {
    it('should update filter options', () => {
      const options = {
        months: ['January', 'February'],
        cities: ['Dubai', 'Abu Dhabi'],
        areas: ['Marina', 'JBR'],
        cuisines: ['Italian', 'American'],
      };

      useFilterStore.getState().setOptions(options);

      const state = useFilterStore.getState();
      expect(state.options.months).toEqual(['January', 'February']);
      expect(state.options.cities).toEqual(['Dubai', 'Abu Dhabi']);
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to default', () => {
      // Set some filters
      useFilterStore.getState().setSelectedMonth('January');
      useFilterStore.getState().setSelectedCity('Dubai');
      useFilterStore.getState().setSelectedArea('Marina');
      useFilterStore.getState().setSelectedCuisine('Italian');

      // Reset
      useFilterStore.getState().resetFilters();

      const state = useFilterStore.getState();
      expect(state.selectedMonth).toBe('all');
      expect(state.selectedCity).toBe('all');
      expect(state.selectedArea).toBe('all');
      expect(state.selectedCuisine).toBe('all');
    });
  });
});
