import { describe, it, expect } from 'vitest';
import { getCuisineIcon, CHANNEL_COLORS, CUISINE_ICONS } from '@/types';

describe('Types and Constants', () => {
  describe('CHANNEL_COLORS', () => {
    it('should have correct colors for all channels', () => {
      expect(CHANNEL_COLORS.Talabat).toBe('#F97316');
      expect(CHANNEL_COLORS.Deliveroo).toBe('#06B6D4');
      expect(CHANNEL_COLORS.Careem).toBe('#10B981');
      expect(CHANNEL_COLORS.Noon).toBe('#FDE047');
      expect(CHANNEL_COLORS.Keeta).toBe('#6B7280');
    });

    it('should have 5 channels', () => {
      expect(Object.keys(CHANNEL_COLORS)).toHaveLength(5);
    });
  });

  describe('getCuisineIcon', () => {
    it('should return correct icon for known cuisines', () => {
      expect(getCuisineIcon('American')).toBe('🍔');
      expect(getCuisineIcon('Asian')).toBe('🥢');
      expect(getCuisineIcon('Italian')).toBe('🍝');
      expect(getCuisineIcon('Indian')).toBe('🔥');
      expect(getCuisineIcon('Mexican')).toBe('🌮');
    });

    it('should return default icon for unknown cuisines', () => {
      expect(getCuisineIcon('Unknown Cuisine')).toBe('🍽️');
      expect(getCuisineIcon('')).toBe('🍽️');
    });

    it('should be case insensitive', () => {
      expect(getCuisineIcon('ITALIAN')).toBe('🍝');
      expect(getCuisineIcon('italian')).toBe('🍝');
      expect(getCuisineIcon('Italian')).toBe('🍝');
    });

    it('should match partial cuisine names', () => {
      expect(getCuisineIcon('Fast Food Restaurant')).toBe('🍔');
      expect(getCuisineIcon('Asian Fusion')).toBe('🥢');
    });
  });

  describe('CUISINE_ICONS', () => {
    it('should have a default icon', () => {
      expect(CUISINE_ICONS.default).toBe('🍽️');
    });

    it('should have icons for common cuisines', () => {
      expect(CUISINE_ICONS.American).toBe('🍔');
      expect(CUISINE_ICONS.Beverages).toBe('☕');
      expect(CUISINE_ICONS.Desserts).toBe('🍰');
    });
  });
});
