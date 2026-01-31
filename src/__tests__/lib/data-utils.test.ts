import { describe, it, expect } from 'vitest';
import {
  aggregateByChannel,
  calculateMonthlyMarketShare,
  calculateMarketShareByArea,
  calculateMarketShareByCuisine,
  formatCurrency,
  formatNumber,
  formatPercentage,
} from '@/lib/data-utils';
import type { SalesData } from '@/types';

const mockSalesData: SalesData[] = [
  {
    channel: 'talabat',
    city: 'Dubai',
    area: 'Marina',
    monthYear: 'January-2025',
    month: '2025-01',
    year: '2025',
    location: 'Marina Mall',
    cuisine: 'Italian',
    orders: 100,
    netSales: 5000,
    grossSales: 6000,
    adsSpend: 500,
    discountSpend: 300,
    adsReturn: 2000,
  },
  {
    channel: 'deliveroo',
    city: 'Dubai',
    area: 'Marina',
    monthYear: 'January-2025',
    month: '2025-01',
    year: '2025',
    location: 'Marina Walk',
    cuisine: 'Italian',
    orders: 80,
    netSales: 4000,
    grossSales: 4800,
    adsSpend: 400,
    discountSpend: 200,
    adsReturn: 1600,
  },
  {
    channel: 'talabat',
    city: 'Dubai',
    area: 'JBR',
    monthYear: 'February-2025',
    month: '2025-02',
    year: '2025',
    location: 'JBR Beach',
    cuisine: 'American',
    orders: 150,
    netSales: 7500,
    grossSales: 9000,
    adsSpend: 750,
    discountSpend: 450,
    adsReturn: 3000,
  },
];

describe('Data Utils', () => {
  describe('aggregateByChannel', () => {
    it('should aggregate data by channel correctly', () => {
      const result = aggregateByChannel(mockSalesData);

      const talabat = result.find((d) => d.channel === 'Talabat');
      const deliveroo = result.find((d) => d.channel === 'Deliveroo');

      expect(talabat).toBeDefined();
      expect(talabat?.orders).toBe(250); // 100 + 150
      expect(talabat?.netSales).toBe(12500); // 5000 + 7500
      expect(talabat?.grossSales).toBe(15000); // 6000 + 9000

      expect(deliveroo).toBeDefined();
      expect(deliveroo?.orders).toBe(80);
      expect(deliveroo?.netSales).toBe(4000);
    });

    it('should calculate ROAS correctly', () => {
      const result = aggregateByChannel(mockSalesData);
      const talabat = result.find((d) => d.channel === 'Talabat');

      // ROAS = adsReturn / adsSpend = 5000 / 1250 = 4
      expect(talabat?.roas).toBe(4);
    });

    it('should calculate AOV correctly', () => {
      const result = aggregateByChannel(mockSalesData);
      const talabat = result.find((d) => d.channel === 'Talabat');

      // AOV = grossSales / orders = 15000 / 250 = 60
      expect(talabat?.aov).toBe(60);
    });

    it('should handle empty data', () => {
      const result = aggregateByChannel([]);
      expect(result).toEqual([]);
    });
  });

  describe('calculateMonthlyMarketShare', () => {
    it('should calculate monthly market share correctly', () => {
      const result = calculateMonthlyMarketShare(mockSalesData);

      expect(result.length).toBe(2); // January and February

      const january = result.find((d) => d.month === '2025-01');
      expect(january).toBeDefined();

      // January: Talabat 100 orders, Deliveroo 80 orders
      // Total: 180, Talabat: 55.56%, Deliveroo: 44.44%
      expect(january?.marketShare.Talabat).toBeCloseTo(55.56, 1);
      expect(january?.marketShare.Deliveroo).toBeCloseTo(44.44, 1);
    });

    it('should handle empty data', () => {
      const result = calculateMonthlyMarketShare([]);
      expect(result).toEqual([]);
    });
  });

  describe('calculateMarketShareByArea', () => {
    it('should calculate market share by area correctly', () => {
      const result = calculateMarketShareByArea(mockSalesData);

      expect(result.length).toBe(2); // Marina and JBR

      const marina = result.find((d) => d.area === 'Marina');
      expect(marina).toBeDefined();

      // Marina: Talabat 100, Deliveroo 80, Total: 180
      expect(marina?.marketShare.Talabat).toBeCloseTo(55.56, 1);
      expect(marina?.marketShare.Deliveroo).toBeCloseTo(44.44, 1);
    });
  });

  describe('calculateMarketShareByCuisine', () => {
    it('should calculate market share by cuisine correctly', () => {
      const result = calculateMarketShareByCuisine(mockSalesData);

      expect(result.length).toBe(2); // Italian and American

      const italian = result.find((d) => d.cuisine === 'Italian');
      expect(italian).toBeDefined();

      // Italian: Talabat 100, Deliveroo 80, Total: 180
      expect(italian?.marketShare.Talabat).toBeCloseTo(55.56, 1);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toContain('1,000');
      expect(formatCurrency(0)).toContain('0');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(50)).toBe('50.0%');
      expect(formatPercentage(33.333)).toBe('33.3%');
    });
  });
});
