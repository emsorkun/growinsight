// Channel types
export type Channel = 'Talabat' | 'Deliveroo' | 'Careem' | 'Noon' | 'Keeta';

export const CHANNEL_COLORS: Record<Channel, string> = {
  Talabat: '#F97316',
  Deliveroo: '#06B6D4',
  Careem: '#10B981',
  Noon: '#FDE047',
  Keeta: '#6B7280',
};

// Data models
export interface SalesData {
  channel: Channel;
  city: string;
  area: string;
  monthYear: string;
  month: string;
  year: string;
  location: string;
  cuisine: string;
  orders: number;
  netSales: number;
  grossSales: number;
  adsSpend: number;
  discountSpend: number;
  adsReturn: number;
}

export interface AggregatedData {
  channel: Channel;
  orders: number;
  netSales: number;
  grossSales: number;
  adsSpend: number;
  discountSpend: number;
  adsReturn: number;
  roas: number;
  aov: number;
}

export interface MarketShareByArea {
  area: string;
  marketShare: Record<Channel, number>;
}

export interface MarketShareByAreaExtended {
  area: string;
  city: string;
  marketShare: Record<Channel, number>;
  totalOrders: number;
  cuisineCount: number;
  signalStrength: number;
}

export interface CuisineDetailByArea {
  cuisine: string;
  marketShare: Record<Channel, number>;
  totalOrders: number;
}

export interface AreaMonthlyTrend {
  month: string;
  marketShare: Record<Channel, number>;
}

export interface MarketShareByCuisine {
  cuisine: string;
  marketShare: Record<Channel, number>;
}

export interface MonthlyMarketShare {
  month: string;
  marketShare: Record<Channel, number>;
}

// Weekly data (last 12 weeks)
export interface WeeklySalesData {
  channel: string;
  city: string;
  area: string;
  weekStartDate: string;
  week: number;
  year: number;
  location: string;
  cuisine: string;
  orders: number;
  netSales: number;
  grossSales: number;
  adsSpend: number;
  discountSpend: number;
  adsReturn: number;
}

export interface WeeklyMarketShare {
  weekLabel: string;
  weekStartDate: string;
  marketShare: Record<Channel, number>;
}

export interface MissingBrand {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  rating: number;
  locationCount: number;
}

// Filter types
export interface FilterOptions {
  months: string[];
  cities: string[];
  areas: string[];
  cuisines: string[];
}

export interface FilterState {
  selectedMonths: string[];
  selectedCities: string[];
  selectedAreas: string[];
  selectedCuisines: string[];
}

// Auth types
export interface User {
  id: string;
  username: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardSummary {
  totalOrders: number;
  totalNetSales: number;
  totalGrossSales: number;
  totalAdsSpend: number;
  totalDiscountSpend: number;
  channelData: AggregatedData[];
  monthlyData: MonthlyMarketShare[];
}

// Chart data types
export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface BarChartData {
  name: string;
  value: number;
  color: string;
}

// Cuisine icons mapping
export const CUISINE_ICONS: Record<string, string> = {
  American: '🍔',
  'Fast Food': '🍔',
  Asian: '🥢',
  Beverages: '☕',
  Breakfast: '🥐',
  Bakery: '🥐',
  Desserts: '🍰',
  Sweets: '🍰',
  Healthy: '🥗',
  'Special Diets': '🥗',
  Indian: '🔥',
  International: '🌍',
  Italian: '🍝',
  Mexican: '🌮',
  'Middle Eastern': '🥙',
  Seafood: '🐟',
  Shawarma: '🥙',
  Soup: '🍜',
  Turkish: '🥘',
  default: '🍽️',
};

export function getCuisineIcon(cuisine: string): string {
  const normalizedCuisine = cuisine.toLowerCase();

  for (const [key, icon] of Object.entries(CUISINE_ICONS)) {
    if (normalizedCuisine.includes(key.toLowerCase())) {
      return icon;
    }
  }

  return CUISINE_ICONS.default;
}

// Tracking types
export type TrackingEventType = 'login' | 'page_view' | 'filter_change' | 'button_click' | 'logout';

export interface TrackingEvent {
  id: number;
  event_type: TrackingEventType;
  user_id: string | null;
  username: string | null;
  user_name: string | null;
  page: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
}

export interface TrackingPayload {
  event_type: TrackingEventType;
  page?: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
}

export interface AdminEventsQuery {
  event_type?: TrackingEventType;
  username?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AdminEventsResponse {
  events: TrackingEvent[];
  total: number;
  page: number;
  limit: number;
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    eventsByType: Record<string, number>;
    eventsByDay: { date: string; count: number }[];
    topPages: { page: string; count: number }[];
    topUsers: { username: string; name: string; count: number }[];
  };
}
