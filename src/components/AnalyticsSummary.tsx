import React from 'react';
import { Carpark, VehicleType } from '../types/carpark';
import { formatVehicleTypeLabel } from '../utils/formatters';
import { Car, Bike, Truck, Zap, Percent, Clock } from 'lucide-react';

interface AnalyticsSummaryProps {
  carparks: Carpark[];
  selectedVehicle: VehicleType;
  onVehicleChange: (v: VehicleType) => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  secondsUntilNextPoll: number;
}

export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({
  carparks,
  selectedVehicle,
  onVehicleChange,
  autoRefresh,
  onToggleAutoRefresh,
  secondsUntilNextPoll,
}) => {
  const totalCapacity = carparks.reduce((sum, c) => {
    const lot = c.lots[selectedVehicle] || c.lots.car;
    return sum + lot.total;
  }, 0);

  const totalAvailable = carparks.reduce((sum, c) => {
    const lot = c.lots[selectedVehicle] || c.lots.car;
    return sum + lot.available;
  }, 0);

  const overallPercent = totalCapacity > 0 ? Math.round((totalAvailable / totalCapacity) * 100) : 0;
  const evLocationsCount = carparks.filter((c) => c.hasEvCharging).length;
  const hdbFpsCount = carparks.filter((c) => c.pricing.hasFreeParkingScheme).length;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Vehicle Type Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => onVehicleChange('car')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedVehicle === 'car'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Cars</span>
          </button>
          <button
            onClick={() => onVehicleChange('motorcycle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedVehicle === 'motorcycle'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Motorcycles</span>
          </button>
          <button
            onClick={() => onVehicleChange('heavyVehicle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedVehicle === 'heavyVehicle'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Heavy</span>
          </button>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-500 dark:text-slate-400">Available {formatVehicleTypeLabel(selectedVehicle)}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {totalAvailable.toLocaleString()}
              </span>
              <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                / {totalCapacity.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-500 dark:text-slate-400">Islandwide Availability</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {overallPercent}%
              </span>
              <span className="text-slate-500 text-[11px]">lots free</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-500 dark:text-slate-400">EV Charging Hubs</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                {evLocationsCount}
              </span>
              <span className="text-slate-500 text-[11px]">carparks</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-500 dark:text-slate-400">Sunday Free (FPS)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {hdbFpsCount}
              </span>
              <span className="text-slate-500 text-[11px]">eligible</span>
            </div>
          </div>
        </div>

        {/* Auto Refresh Switch */}
        <div className="flex items-center gap-2 shrink-0 text-xs">
          <button
            onClick={onToggleAutoRefresh}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              autoRefresh
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Auto-poll: {autoRefresh ? `${secondsUntilNextPoll}s` : 'Off'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
