import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Carpark, VehicleType } from '../types/carpark';
import { REGION_CENTERS } from '../data/singaporeCarparks';
import { getAvailabilityStatus } from '../utils/formatters';
import { Crosshair, Layers, Navigation, ZoomIn, ZoomOut } from 'lucide-react';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  selectedVehicle: VehicleType;
  darkMode: boolean;
  userLocation: { lat: number; lng: number } | null;
  onLocateUser: () => void;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  selectedVehicle,
  darkMode,
  userLocation,
  onLocateUser,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [activeRegion, setActiveRegion] = useState<string>('All Singapore');

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false, // We supply custom controls
      attributionControl: false,
    });

    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer group for carpark pins
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when Dark Mode changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [darkMode]);

  // Update Markers when carparks, selectedVehicle, or selectedCarpark changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    carparks.forEach((carpark) => {
      const lotInfo = carpark.lots[selectedVehicle] || carpark.lots.car;
      const status = getAvailabilityStatus(lotInfo);
      const isSelected = selectedCarpark?.id === carpark.id;

      let statusClass = 'status-plenty';
      if (status.status === 'limited') statusClass = 'status-limited';
      if (status.status === 'critical') statusClass = 'status-critical';
      if (status.status === 'full') statusClass = 'status-full';

      const customHtml = `
        <div class="pin-content ${statusClass} ${isSelected ? 'selected-pin' : ''}">
          <span style="font-size: 9px; opacity: 0.9;">P</span>
          <span>${lotInfo.available}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-carpark-pin',
        html: customHtml,
        iconSize: [44, 24],
        iconAnchor: [22, 12],
      });

      const marker = L.marker([carpark.coordinates.lat, carpark.coordinates.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.on('click', () => {
        onSelectCarpark(carpark);
      });

      // Quick popup tooltip on hover
      marker.bindTooltip(
        `<div style="font-family: inherit; font-size: 12px; padding: 2px 4px;">
          <strong>${carpark.name}</strong><br/>
          <span style="color: #64748b;">${lotInfo.available} / ${lotInfo.total} lots (${status.label})</span>
        </div>`,
        { direction: 'top', offset: [0, -10] }
      );

      marker.addTo(markersLayerRef.current!);
    });
  }, [carparks, selectedCarpark, selectedVehicle, onSelectCarpark]);

  // Fly to selected carpark
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedCarpark) return;
    mapInstanceRef.current.flyTo(
      [selectedCarpark.coordinates.lat, selectedCarpark.coordinates.lng],
      15,
      { duration: 0.8 }
    );
  }, [selectedCarpark]);

  // Render User Location Pin if available
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userHtml = `
          <div style="position: relative; width: 20px; height: 20px;">
            <div style="position: absolute; width: 20px; height: 20px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 12px; height: 12px; background: #2563eb; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `;
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: userHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 2000,
        }).addTo(mapInstanceRef.current);

        marker.bindTooltip('Your Current Location', { permanent: false, direction: 'top' });
        userMarkerRef.current = marker;
      }
    }
  }, [userLocation]);

  const handleRegionJump = (regionName: string) => {
    setActiveRegion(regionName);
    const region = REGION_CENTERS[regionName];
    if (region && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([region.lat, region.lng], region.zoom, { duration: 0.9 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
      {/* Leaflet map DOM container */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%' }} />

      {/* Top Floating Region Quick Jump Filter Bar */}
      <div className="absolute top-3 left-3 right-3 z-500 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-x-auto max-w-full">
          {Object.keys(REGION_CENTERS).map((regionKey) => {
            const isActive = activeRegion === regionKey;
            return (
              <button
                key={regionKey}
                onClick={() => handleRegionJump(regionKey)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {regionKey === 'All Singapore' ? 'All SG' : regionKey.replace(' / ', '/')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Control Buttons (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-500 flex flex-col gap-2">
        <button
          onClick={onLocateUser}
          title="Find Near My Location"
          className="p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Crosshair className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>

        <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Zoom In"
            className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Zoom Out"
            className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-500 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 shadow-sm text-xs text-slate-700 dark:text-slate-300 flex items-center gap-3">
        <span className="font-semibold text-slate-900 dark:text-slate-100">Lots:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
          <span>&gt;25%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
          <span>10–25%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-600"></span>
          <span>&lt;10%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-500"></span>
          <span>Full</span>
        </div>
      </div>
    </div>
  );
};
