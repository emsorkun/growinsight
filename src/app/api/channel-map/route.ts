import { NextResponse } from 'next/server';
import { fetchSalesData } from '@/lib/bigquery';
import type { Channel } from '@/types';

// UAE area coordinates from reference database
const AREA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Dubai
  'Academic City': { lat: 25.1083, lng: 55.3967 },
  'Al Badaa': { lat: 25.2033, lng: 55.2561 },
  "Al Bada'a": { lat: 25.2033, lng: 55.2561 },
  'Al Barsha': { lat: 25.1091, lng: 55.1946 },
  'Al Barsha South': { lat: 25.085, lng: 55.19 },
  Barsha: { lat: 25.1091, lng: 55.1946 },
  'Barsha Heights': { lat: 25.0978, lng: 55.1756 },
  'Barsha South': { lat: 25.085, lng: 55.19 },
  'Al Garhoud': { lat: 25.2456, lng: 55.3467 },
  'Al Jaddaf': { lat: 25.22, lng: 55.33 },
  'Al Jadaf': { lat: 25.22, lng: 55.33 },
  'Al Jurf': { lat: 25.0833, lng: 55.1333 },
  'Al Karama': { lat: 25.2428, lng: 55.3022 },
  'Al Khawaneej': { lat: 25.2833, lng: 55.45 },
  'Al Mankhool': { lat: 25.2439, lng: 55.29 },
  'Al Muteena': { lat: 25.275, lng: 55.325 },
  'Al Nahda': { lat: 25.2933, lng: 55.3692 },
  'Al Nakheel': { lat: 25.2944, lng: 55.3167 },
  'Al Quoz': { lat: 25.1344, lng: 55.2453 },
  'Al Qusais': { lat: 25.2667, lng: 55.3833 },
  'Al Raffa': { lat: 25.2561, lng: 55.29 },
  'Al Rigga': { lat: 25.2656, lng: 55.3167 },
  'Al Safa': { lat: 25.1833, lng: 55.2333 },
  'Al Satwa': { lat: 25.2292, lng: 55.2744 },
  'Al Seef': { lat: 25.2533, lng: 55.2967 },
  'Al Sufouh': { lat: 25.1056, lng: 55.1511 },
  'Al Warqa': { lat: 25.2, lng: 55.4167 },
  'Al Wasl': { lat: 25.2061, lng: 55.2531 },
  Arjan: { lat: 25.05, lng: 55.2333 },
  Baniyas: { lat: 25.2778, lng: 55.3056 },
  'Blue Waters': { lat: 25.0811, lng: 55.12 },
  'Business Bay': { lat: 25.1842, lng: 55.2724 },
  'City Walk': { lat: 25.2067, lng: 55.2633 },
  'Damac Hills': { lat: 25.04, lng: 55.23 },
  'DAMAC Hills': { lat: 25.04, lng: 55.23 },
  Deira: { lat: 25.2697, lng: 55.3095 },
  'Deira Corniche': { lat: 25.28, lng: 55.32 },
  'Design District': { lat: 25.1833, lng: 55.3167 },
  DIFC: { lat: 25.215, lng: 55.28 },
  'Discovery Gardens': { lat: 25.0333, lng: 55.1333 },
  'Downtown Dubai': { lat: 25.1972, lng: 55.2744 },
  'Dubai Airport Free Zone': { lat: 25.25, lng: 55.3667 },
  'Dubai Hills': { lat: 25.1, lng: 55.2333 },
  'Dubai Investment Park': { lat: 24.9833, lng: 55.1667 },
  'Dubai Marina': { lat: 25.08, lng: 55.135 },
  'Gold Souq': { lat: 25.2858, lng: 55.2967 },
  'Healthcare City': { lat: 25.2267, lng: 55.32 },
  Hessa: { lat: 25.0667, lng: 55.1833 },
  'Hor Al Anz': { lat: 25.2778, lng: 55.3333 },
  Hudaiba: { lat: 25.235, lng: 55.265 },
  'Industrial Area': { lat: 25.0833, lng: 55.3833 },
  'International City': { lat: 25.1737, lng: 55.4049 },
  'International Media Production Zone': { lat: 25.0333, lng: 55.1667 },
  IMPZ: { lat: 25.0333, lng: 55.1667 },
  'Internet City': { lat: 25.1, lng: 55.1667 },
  Jailbird: { lat: 25.22, lng: 55.28 },
  'Jebel Ali': { lat: 25.0167, lng: 55.0333 },
  JBR: { lat: 25.08, lng: 55.14 },
  JLT: { lat: 25.0692, lng: 55.1444 },
  Jumeirah: { lat: 25.2158, lng: 55.2461 },
  'Jumeirah Beach Residence': { lat: 25.08, lng: 55.14 },
  'Jumeirah Islands': { lat: 25.05, lng: 55.15 },
  'Jumeirah Lake Towers': { lat: 25.0692, lng: 55.1444 },
  'Jumeirah Park': { lat: 25.04, lng: 55.15 },
  'Jumeirah Village Circle': { lat: 25.055, lng: 55.21 },
  JVC: { lat: 25.055, lng: 55.21 },
  'Kite Beach': { lat: 25.15, lng: 55.2 },
  Marina: { lat: 25.08, lng: 55.135 },
  Meadows: { lat: 25.05, lng: 55.15 },
  'Media City': { lat: 25.0944, lng: 55.1536 },
  'Merh O Mah': { lat: 25.12, lng: 55.2 },
  Meydan: { lat: 25.1633, lng: 55.3033 },
  Mirdif: { lat: 25.2256, lng: 55.4189 },
  'Motor City': { lat: 25.05, lng: 55.2333 },
  Mudon: { lat: 25.03, lng: 55.26 },
  Muhaisnah: { lat: 25.2611, lng: 55.4089 },
  'Nadd Al Hamar': { lat: 25.1833, lng: 55.3667 },
  'Nad Al Sheba': { lat: 25.1667, lng: 55.3333 },
  'Oud Metha': { lat: 25.23, lng: 55.31 },
  'Palm Jumeirah': { lat: 25.1124, lng: 55.139 },
  'Port Saeed': { lat: 25.2667, lng: 55.3167 },
  Rashidiya: { lat: 25.2333, lng: 55.3833 },
  'Al Rashidiya': { lat: 25.2333, lng: 55.3833 },
  'Sheikh Zayed Road': { lat: 25.15, lng: 55.2167 },
  'Silicon Oasis': { lat: 25.1167, lng: 55.3833 },
  'Dubai Silicon Oasis': { lat: 25.1167, lng: 55.3833 },
  'Trade Centre': { lat: 25.2283, lng: 55.285 },
  'Umm Al Sheif': { lat: 25.1333, lng: 55.2 },
  'Umm Ramool': { lat: 25.2333, lng: 55.3667 },
  'Umm Suqeim': { lat: 25.15, lng: 55.2 },
  'University City': { lat: 25.1167, lng: 55.3833 },

  // Abu Dhabi
  'Abu Dhabi': { lat: 24.4539, lng: 54.3773 },
  'Abu Dhabi Central': { lat: 24.4539, lng: 54.3773 },
  'Al Bahya': { lat: 24.5197, lng: 54.6417 },
  'Al Bateen': { lat: 24.4603, lng: 54.3478 },
  'Al Dhafrah': { lat: 23.65, lng: 53.7 },
  'Al Falah': { lat: 24.3667, lng: 54.5333 },
  'Al Hosn': { lat: 24.4833, lng: 54.3533 },
  'Al Khalidiyah': { lat: 24.4681, lng: 54.3481 },
  'Al Manhal': { lat: 24.4528, lng: 54.3678 },
  'Al Markaziyah': { lat: 24.49, lng: 54.365 },
  'Al Maryah Island': { lat: 24.5, lng: 54.3833 },
  'Al Muntazah': { lat: 24.42, lng: 54.5 },
  'Al Mushrif': { lat: 24.4544, lng: 54.3878 },
  'Al Nahyan': { lat: 24.465, lng: 54.38 },
  'Al Qana': { lat: 24.41, lng: 54.49 },
  'Al Raha': { lat: 24.4628, lng: 54.5833 },
  'Al Rowdah': { lat: 24.4539, lng: 54.3708 },
  'Al Zahiya': { lat: 24.4578, lng: 54.3944 },
  'Bani Yas East': { lat: 24.3167, lng: 54.6333 },
  Bawabat: { lat: 24.35, lng: 54.6 },
  Corniche: { lat: 24.475, lng: 54.3347 },
  Deerfields: { lat: 24.3667, lng: 54.5167 },
  'Falah City': { lat: 24.3833, lng: 54.55 },
  Khalidiya: { lat: 24.4681, lng: 54.3481 },
  'Khalifa City': { lat: 24.4216, lng: 54.5766 },
  'Madinat Khalifa': { lat: 24.45, lng: 54.4 },
  'Masdar City': { lat: 24.4264, lng: 54.6156 },
  'Mohammed Bin Zayed City': { lat: 24.3458, lng: 54.5217 },
  'MBZ City': { lat: 24.3458, lng: 54.5217 },
  'Muroor Road': { lat: 24.4553, lng: 54.3992 },
  Mushrif: { lat: 24.4544, lng: 54.3878 },
  Mussafah: { lat: 24.332, lng: 54.5344 },
  'Mussafah South': { lat: 24.31, lng: 54.52 },
  'Reem Island': { lat: 24.4972, lng: 54.4036 },
  'Al Reem Island': { lat: 24.4972, lng: 54.4036 },
  'Saadiyat Island': { lat: 24.5333, lng: 54.4167 },
  Shahama: { lat: 24.5333, lng: 54.6833 },
  'Yas Island': { lat: 24.4958, lng: 54.6039 },
  Zafranah: { lat: 24.4417, lng: 54.4167 },

  // Al Ain
  'Al Ain': { lat: 24.2075, lng: 55.7447 },
  'Al Ain Central': { lat: 24.2075, lng: 55.7447 },
  'Al Dhahir': { lat: 24.1833, lng: 55.7667 },
  'Al Hili': { lat: 24.2667, lng: 55.75 },
  'Al Jimi': { lat: 24.2376, lng: 55.7347 },
  'Al Mutarad': { lat: 24.2, lng: 55.75 },
  'Al Wijdani': { lat: 24.19, lng: 55.76 },
  'Al Yahar': { lat: 24.3167, lng: 55.7 },
  Zakher: { lat: 24.1255, lng: 55.1958 },

  // Sharjah
  'Al Fisht': { lat: 25.355, lng: 55.4 },
  'Al Jada': { lat: 25.32, lng: 55.4 },
  'Al Jurain': { lat: 25.34, lng: 55.41 },
  'Al Juraina': { lat: 25.35, lng: 55.42 },
  'Al Majaz': { lat: 25.3213, lng: 55.3835 },
  'Al Qasba': { lat: 25.33, lng: 55.39 },
  'Al Rahmaniya': { lat: 25.36, lng: 55.43 },
  'Al Rifaah': { lat: 25.37, lng: 55.4 },
  'Al Seyouh': { lat: 25.2833, lng: 55.55 },
  'Al Shuwaihen': { lat: 25.36, lng: 55.39 },
  'Industrial Area Sharjah': { lat: 25.3, lng: 55.45 },
  Muwailah: { lat: 25.3167, lng: 55.45 },
  Muwaileh: { lat: 25.3167, lng: 55.45 },
  Samnan: { lat: 25.37, lng: 55.42 },
  Sharjah: { lat: 25.3488, lng: 55.4054 },
  'Sharjah Central': { lat: 25.3488, lng: 55.4054 },
  'University City Sharjah': { lat: 25.2967, lng: 55.4733 },

  // Ajman
  Ajman: { lat: 25.4111, lng: 55.435 },
  'Ajman Central': { lat: 25.4111, lng: 55.435 },
  'Al Hamidiya': { lat: 25.42, lng: 55.45 },
  'Al Jurf Ajman': { lat: 25.4, lng: 55.46 },
  'Al Nuaimia': { lat: 25.3933, lng: 55.4433 },
  'Al Rashidiya Ajman': { lat: 25.41, lng: 55.44 },
  'Al Rawda Ajman': { lat: 25.415, lng: 55.465 },
  Mutawa: { lat: 25.405, lng: 55.455 },

  // Ras Al Khaimah
  'Al Dhait': { lat: 25.75, lng: 55.95 },
  'Al Nakheel RAK': { lat: 25.79, lng: 55.96 },
  'Al Rifaah RAK': { lat: 25.76, lng: 55.94 },
  'Dafan Al Khor': { lat: 25.82, lng: 55.97 },
  'Ras Al Khaimah': { lat: 25.7895, lng: 55.9432 },
  'Ras Al Khaimah Central': { lat: 25.8007, lng: 55.9762 },

  // Fujairah
  'Al Gurfa': { lat: 25.15, lng: 56.33 },
  Fujairah: { lat: 25.1164, lng: 56.3414 },
  'Fujairah City': { lat: 25.1164, lng: 56.3414 },
};

// Get city from area name
function getCityFromArea(area: string): string {
  const lowercaseArea = area.toLowerCase();
  if (
    lowercaseArea.includes('abu dhabi') ||
    lowercaseArea.includes('khalifa') ||
    lowercaseArea.includes('maryah') ||
    lowercaseArea.includes('reem') ||
    lowercaseArea.includes('yas')
  ) {
    return 'Abu Dhabi';
  }
  if (
    lowercaseArea.includes('sharjah') ||
    lowercaseArea.includes('shagara') ||
    lowercaseArea.includes('majaz') ||
    lowercaseArea.includes('qasimia')
  ) {
    return 'Sharjah';
  }
  if (lowercaseArea.includes('ajman') || lowercaseArea.includes('nuaimia')) {
    return 'Ajman';
  }
  if (lowercaseArea.includes('ras al khaimah')) {
    return 'Ras Al Khaimah';
  }
  if (lowercaseArea.includes('fujairah')) {
    return 'Fujairah';
  }
  if (lowercaseArea.includes('umm al quwain')) {
    return 'Umm Al Quwain';
  }
  return 'Dubai';
}

export interface ChannelMapData {
  area: string;
  city: string;
  lat: number;
  lng: number;
  totalOrders: number;
  totalSales: number;
  dominantChannel: Channel;
  channelBreakdown: Record<Channel, { orders: number; sales: number; share: number }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const city = searchParams.get('city');
  const cuisine = searchParams.get('cuisine');
  const channel = searchParams.get('channel');

  try {
    const salesData = await fetchSalesData({
      months: month ? [month] : undefined,
      cities: city ? [city] : undefined,
      cuisines: cuisine ? [cuisine] : undefined,
    });

    // Aggregate data by area
    const areaMap = new Map<
      string,
      {
        orders: Record<Channel, number>;
        sales: Record<Channel, number>;
        city: string;
      }
    >();

    const channels: Channel[] = ['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'];

    for (const row of salesData) {
      if (!row.area) continue;

      const existing = areaMap.get(row.area) || {
        orders: { Talabat: 0, Deliveroo: 0, Careem: 0, Noon: 0, Keeta: 0 },
        sales: { Talabat: 0, Deliveroo: 0, Careem: 0, Noon: 0, Keeta: 0 },
        city: row.city || getCityFromArea(row.area),
      };

      const channelName = (row.channel.charAt(0).toUpperCase() +
        row.channel.slice(1).toLowerCase()) as Channel;
      if (channels.includes(channelName)) {
        existing.orders[channelName] += row.orders || 0;
        existing.sales[channelName] += row.netSales || 0;
      }

      areaMap.set(row.area, existing);
    }

    // Convert to response format
    const result: ChannelMapData[] = [];

    for (const [area, data] of areaMap) {
      // Find coordinates - try exact match first, then normalized match, then fuzzy match
      let coords = AREA_COORDINATES[area];

      if (!coords) {
        // Normalize area name for better matching
        const normalizeAreaName = (name: string) => {
          return name
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
        };

        const areaLower = normalizeAreaName(area);

        // Try exact normalized match first
        for (const [key, value] of Object.entries(AREA_COORDINATES)) {
          if (normalizeAreaName(key) === areaLower) {
            coords = value;
            break;
          }
        }

        // Try prefix/suffix match (e.g., "Al Barsha" matches "Al Barsha 1")
        if (!coords) {
          for (const [key, value] of Object.entries(AREA_COORDINATES)) {
            const keyLower = normalizeAreaName(key);
            // Check if one starts with the other (for numbered areas like "Al Barsha" vs "Al Barsha 1")
            if (areaLower.startsWith(keyLower) || keyLower.startsWith(areaLower)) {
              coords = value;
              break;
            }
          }
        }

        // Try partial match (contains)
        if (!coords) {
          for (const [key, value] of Object.entries(AREA_COORDINATES)) {
            const keyLower = normalizeAreaName(key);
            if (areaLower.includes(keyLower) || keyLower.includes(areaLower)) {
              coords = value;
              break;
            }
          }
        }
      }

      if (!coords) {
        // Use city center as fallback with offset towards inland (east/higher longitude)
        const cityCoords: Record<string, { lat: number; lng: number }> = {
          Dubai: { lat: 25.2048, lng: 55.2708 },
          'Abu Dhabi': { lat: 24.4539, lng: 54.42 },
          Sharjah: { lat: 25.3462, lng: 55.4211 },
          Ajman: { lat: 25.4111, lng: 55.436 },
          'Ras Al Khaimah': { lat: 25.7897, lng: 55.9432 },
          Fujairah: { lat: 25.1288, lng: 56.3265 },
          'Umm Al Quwain': { lat: 25.5644, lng: 55.5552 },
        };
        coords = cityCoords[data.city] || cityCoords['Dubai'];
        // Add small random offset - only move east (inland) to avoid placing markers in the sea
        // Hash-based offset for consistency (same area always gets same offset)
        const hash = area.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const latOffset = ((hash % 100) / 100 - 0.5) * 0.04; // ±0.02 degrees latitude
        const lngOffset = ((hash % 50) / 50) * 0.04 + 0.01; // +0.01 to +0.05 degrees longitude (always east/inland)
        coords = {
          lat: coords.lat + latOffset,
          lng: coords.lng + lngOffset,
        };
        console.log(`Area "${area}" not found in coordinates, using fallback for ${data.city}`);
      }

      const totalOrders = channels.reduce((sum, ch) => sum + data.orders[ch], 0);
      const totalSales = channels.reduce((sum, ch) => sum + data.sales[ch], 0);

      if (totalOrders < 1000) continue;

      // Find dominant channel
      let dominantChannel: Channel = 'Talabat';
      let maxOrders = 0;
      for (const ch of channels) {
        if (data.orders[ch] > maxOrders) {
          maxOrders = data.orders[ch];
          dominantChannel = ch;
        }
      }

      // Build channel breakdown
      const channelBreakdown: Record<Channel, { orders: number; sales: number; share: number }> =
        {} as Record<Channel, { orders: number; sales: number; share: number }>;
      for (const ch of channels) {
        channelBreakdown[ch] = {
          orders: data.orders[ch],
          sales: data.sales[ch],
          share: totalOrders > 0 ? (data.orders[ch] / totalOrders) * 100 : 0,
        };
      }

      // Filter by channel if specified
      if (channel && channel !== 'all') {
        const channelKey = (channel.charAt(0).toUpperCase() +
          channel.slice(1).toLowerCase()) as Channel;
        if (!channels.includes(channelKey) || data.orders[channelKey] === 0) {
          continue;
        }
      }

      result.push({
        area,
        city: data.city,
        lat: coords.lat,
        lng: coords.lng,
        totalOrders,
        totalSales,
        dominantChannel,
        channelBreakdown,
      });
    }

    // Sort by total orders descending
    result.sort((a, b) => b.totalOrders - a.totalOrders);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching channel map data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch channel map data',
      },
      { status: 500 }
    );
  }
}
