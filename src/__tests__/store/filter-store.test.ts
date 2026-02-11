import { describe, it, expect, beforeEach } from 'vitest';
import { useFilterStore } from '@/store/filter-store';

describe('Filter Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFilterStore.setState({
      selectedMonths: [],
      selectedCities: [],
      selectedAreas: [],
      selectedCuisines: [],
      selectedSignalStrengths: [],
      options: {
        months: [],
        cities: [],
        areas: [],
        cuisines: [],
      },
    });
  });

  describe('toggleMonth', () => {
    it('should add a month when toggled on', () => {
      useFilterStore.getState().toggleMonth('2025-01');
      expect(useFilterStore.getState().selectedMonths).toEqual(['2025-01']);
    });

    it('should remove a month when toggled off', () => {
      useFilterStore.getState().toggleMonth('2025-01');
      useFilterStore.getState().toggleMonth('2025-01');
      expect(useFilterStore.getState().selectedMonths).toEqual([]);
    });

    it('should support multiple months', () => {
      useFilterStore.getState().toggleMonth('2025-03');
      useFilterStore.getState().toggleMonth('2025-01');
      expect(useFilterStore.getState().selectedMonths).toEqual(['2025-01', '2025-03']);
    });
  });

  describe('toggleCity', () => {
    it('should add a city when toggled on', () => {
      useFilterStore.getState().toggleCity('Dubai');
      expect(useFilterStore.getState().selectedCities).toEqual(['Dubai']);
    });

    it('should remove a city when toggled off', () => {
      useFilterStore.getState().toggleCity('Dubai');
      useFilterStore.getState().toggleCity('Dubai');
      expect(useFilterStore.getState().selectedCities).toEqual([]);
    });

    it('should support multiple cities', () => {
      useFilterStore.getState().toggleCity('Dubai');
      useFilterStore.getState().toggleCity('Abu Dhabi');
      expect(useFilterStore.getState().selectedCities).toEqual(['Abu Dhabi', 'Dubai']);
    });

    it('should reset areas when city changes', () => {
      useFilterStore.getState().toggleArea('Marina');
      useFilterStore.getState().toggleCity('Abu Dhabi');

      expect(useFilterStore.getState().selectedCities).toEqual(['Abu Dhabi']);
      expect(useFilterStore.getState().selectedAreas).toEqual([]);
    });
  });

  describe('toggleArea', () => {
    it('should add an area when toggled on', () => {
      useFilterStore.getState().toggleArea('Marina');
      expect(useFilterStore.getState().selectedAreas).toEqual(['Marina']);
    });

    it('should remove an area when toggled off', () => {
      useFilterStore.getState().toggleArea('Marina');
      useFilterStore.getState().toggleArea('Marina');
      expect(useFilterStore.getState().selectedAreas).toEqual([]);
    });
  });

  describe('toggleCuisine', () => {
    it('should add a cuisine when toggled on', () => {
      useFilterStore.getState().toggleCuisine('Italian');
      expect(useFilterStore.getState().selectedCuisines).toEqual(['Italian']);
    });

    it('should remove a cuisine when toggled off', () => {
      useFilterStore.getState().toggleCuisine('Italian');
      useFilterStore.getState().toggleCuisine('Italian');
      expect(useFilterStore.getState().selectedCuisines).toEqual([]);
    });
  });

  describe('setOptions', () => {
    it('should update filter options', () => {
      const options = {
        months: ['2025-01', '2025-02'],
        cities: ['Dubai', 'Abu Dhabi'],
        areas: ['Marina', 'JBR'],
        cuisines: ['Italian', 'American'],
      };

      useFilterStore.getState().setOptions(options);

      const state = useFilterStore.getState();
      expect(state.options.months).toEqual(['2025-01', '2025-02']);
      expect(state.options.cities).toEqual(['Dubai', 'Abu Dhabi']);
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to default', () => {
      // Set some filters
      useFilterStore.getState().toggleMonth('2025-01');
      useFilterStore.getState().toggleCity('Dubai');
      useFilterStore.getState().toggleArea('Marina');
      useFilterStore.getState().toggleCuisine('Italian');

      // Reset
      useFilterStore.getState().resetFilters();

      const state = useFilterStore.getState();
      expect(state.selectedMonths).toEqual([]);
      expect(state.selectedCities).toEqual([]);
      expect(state.selectedAreas).toEqual([]);
      expect(state.selectedCuisines).toEqual([]);
    });
  });
});
