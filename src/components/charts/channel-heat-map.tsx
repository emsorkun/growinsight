'use client';

import { useEffect, useRef, useMemo, Fragment } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CHANNEL_COLORS, type Channel } from '@/types';

// Fix for default marker icons in Leaflet with webpack
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ChannelMapData {
  area: string;
  city: string;
  lat: number;
  lng: number;
  totalOrders: number;
  totalSales: number;
  dominantChannel: Channel;
  channelBreakdown: Record<Channel, { orders: number; sales: number; share: number }>;
}

type ChannelFilter = 'all' | Channel;

interface ChannelHeatMapProps {
  data: ChannelMapData[];
  selectedChannel: ChannelFilter;
  onAreaHover?: (area: ChannelMapData | null) => void;
}

// Component to handle heatmap layer (channel view only)
function HeatmapLayer({
  data,
  selectedChannel,
}: {
  data: ChannelMapData[];
  selectedChannel: ChannelFilter;
}) {
  const map = useMap();
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    if (data.length === 0) return;

    // Dynamically import leaflet.heat
    import('leaflet.heat').then(() => {
      // Channel view: intensity by dominant channel share or selected channel presence
      const heatData: [number, number, number][] = data.map((d) => {
        let intensity: number;
        if (selectedChannel !== 'all') {
          const channelData = d.channelBreakdown[selectedChannel];
          intensity = (channelData?.share ?? 0) / 100;
        } else {
          intensity = d.channelBreakdown[d.dominantChannel]?.share ?? 0;
          intensity = intensity / 100;
        }
        return [d.lat, d.lng, intensity];
      });

      // Normalize intensities
      const maxIntensity = Math.max(...heatData.map((h) => h[2]), 1);
      const normalizedData = heatData.map(
        (h) => [h[0], h[1], h[2] / maxIntensity] as [number, number, number]
      );

      // Create heat layer with custom gradient based on selected channel
      let gradient: Record<number, string>;

      if (selectedChannel !== 'all') {
        const color = CHANNEL_COLORS[selectedChannel];
        gradient = {
          0.0: 'rgba(255, 255, 255, 0)',
          0.2: `${color}33`,
          0.4: `${color}66`,
          0.6: `${color}99`,
          0.8: `${color}CC`,
          1.0: color,
        };
      } else {
        // Default gradient for orders/sales
        gradient = {
          0.0: 'rgba(0, 0, 255, 0)',
          0.2: 'rgba(0, 255, 255, 0.3)',
          0.4: 'rgba(0, 255, 0, 0.5)',
          0.6: 'rgba(255, 255, 0, 0.7)',
          0.8: 'rgba(255, 165, 0, 0.85)',
          1.0: 'rgba(255, 0, 0, 1)',
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heat = (L as any).heatLayer(normalizedData, {
        radius: 35,
        blur: 25,
        maxZoom: 15,
        max: 1.0,
        gradient,
      });

      heat.addTo(map);
      heatLayerRef.current = heat;
    });

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, data, selectedChannel]);

  return null;
}

// Component to fit bounds
function FitBounds({ data }: { data: ChannelMapData[] }) {
  const map = useMap();

  useEffect(() => {
    if (data.length === 0) return;

    const bounds = L.latLngBounds(data.map((d) => [d.lat, d.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }, [map, data]);

  return null;
}

export default function ChannelHeatMap({
  data,
  selectedChannel,
  onAreaHover,
}: ChannelHeatMapProps) {
  // UAE center coordinates
  const center: [number, number] = [25.0657, 55.1713];
  const zoom = 10;

  const markerRadius = 7;

  // Get marker color by channel (channel view only)
  const getMarkerColor = (d: ChannelMapData): string => {
    if (selectedChannel !== 'all') {
      return CHANNEL_COLORS[selectedChannel];
    }
    return CHANNEL_COLORS[d.dominantChannel];
  };

  const markerOpacity = 0.75;

  // Fade radius scales with area size (totalOrders); larger areas get a bigger glow
  const maxOrders = data.length ? Math.max(...data.map((d) => d.totalOrders)) : 1;
  const getFadeRadius = (d: ChannelMapData): number => {
    const ratio = d.totalOrders / maxOrders;
    const minFade = 14;
    const maxFade = 32;
    return minFade + ratio * (maxFade - minFade);
  };
  const fadeOpacity = 0.22;

  // Calculate legend data (channel view)
  const legendData = useMemo(() => {
    if (selectedChannel === 'all') {
      return Object.entries(CHANNEL_COLORS).map(([channel, color]) => ({
        label: channel,
        color,
      }));
    }
    return null;
  }, [selectedChannel]);

  return (
    <div className="relative h-[600px] rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        style={{ background: '#f3f4f6' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds data={data} />
        <HeatmapLayer data={data} selectedChannel={selectedChannel} />

        {/* Circle markers: fade glow (size linked to area) + solid dot */}
        {data.map((d) => {
          const color = getMarkerColor(d);
          const fadeRadius = getFadeRadius(d);
          const handlers = {
            mouseover: () => onAreaHover?.(d),
            mouseout: () => onAreaHover?.(null),
          };
          return (
            <Fragment key={d.area}>
              {/* Fade/glow behind marker - radius scales with area size */}
              <CircleMarker
                center={[d.lat, d.lng]}
                radius={fadeRadius}
                pathOptions={{
                  color: 'transparent',
                  fillColor: color,
                  fillOpacity: fadeOpacity,
                  weight: 0,
                }}
                eventHandlers={handlers}
              />
              <CircleMarker
                center={[d.lat, d.lng]}
                radius={markerRadius}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: markerOpacity,
                  weight: 1.5,
                }}
                eventHandlers={handlers}
              >
                <Popup>
                  <div className="min-w-[200px] p-1">
                    <h3 className="font-semibold text-base mb-1">{d.area}</h3>
                    <p className="text-sm text-gray-500 mb-2">{d.city}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Dominant:</span>
                        <span
                          className="font-medium"
                          style={{ color: CHANNEL_COLORS[d.dominantChannel] }}
                        >
                          {d.dominantChannel}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium mb-1">Channel Share</p>
                      {(['Talabat', 'Deliveroo', 'Careem', 'Noon', 'Keeta'] as Channel[]).map(
                        (ch) => (
                          <div key={ch} className="flex items-center gap-2 text-xs">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: CHANNEL_COLORS[ch] }}
                            />
                            <span className="flex-1">{ch}</span>
                            <span>{d.channelBreakdown[ch]?.share?.toFixed(1) || 0}%</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}
      </MapContainer>

      {/* Legend */}
      {legendData && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
          <p className="text-xs font-semibold mb-2">Dominant Channel</p>
          <div className="space-y-1">
            {legendData.map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
