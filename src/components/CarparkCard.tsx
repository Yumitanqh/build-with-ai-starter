import React from 'react';
import { Carpark, VehicleType } from '../types/carpark';
import { getAvailabilityStatus, formatDistance } from '../utils/formatters';
import { Bookmark, Navigation, Zap, ShieldCheck, ChevronRight, Calculator } from 'lucide-react';

interface CarparkCardProps {
  carpark: Carpark;
  selectedVehicle: VehicleType;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onOpenFeeCalculator: (e: React.MouseEvent) => void;
  userDistanceMeters?: number;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  selectedVehicle,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onOpenFeeCalculator,
  userDistanceMeters,
}) => {
  const lotInfo = carpark.lots[selectedVehicle] || carpark.lots.car;
  const status = getAvailabilityStatus(lotInfo);
  const occupancyPercent = lotInfo.total > 0 ? Math.round(((lotInfo.total - lotInfo.available) / lotInfo.total) * 100) : 100;

  // Status color helpers
  const statusColorMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    slate: 'text-slate-500 dark:text-slate-400',
  };

  const barColorMap = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    slate: 'bg-slate-400',
  };

  return (
    <div
      onClick={onSelect}
      className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
      }`}
    >
      {/* Top Header: Unboxed metadata kicker & Favorite bookmark button */}
      <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-mono truncate">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{carpark.id}</span>
          <span aria-hidden="true">·</span>
          <span>{carpark.agency}</span>
          <span aria-hidden="true">·</span>
          <span>{carpark.type}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{carpark.area}</span>
        </div>

        <button
          onClick={onToggleFavorite}
          title={isFavorite ? 'Remove from saved' : 'Save carpark'}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors shrink-0"
        >
          <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
        </button>
      </div>

      {/* Main Title */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
          {carpark.name}
        </h3>
        {/* Availability Count (Large Tabular Numerals) */}
        <div className="text-right shrink-0">
          <div className="flex items-baseline justify-end gap-1">
            <span className={`text-xl font-bold font-mono tabular-nums leading-none ${statusColorMap[status.color as keyof typeof statusColorMap] || 'text-slate-900'}`}>
              {lotInfo.available}
            </span>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              / {lotInfo.total}
            </span>
          </div>
          <span className={`text-[11px] font-medium ${statusColorMap[status.color as keyof typeof statusColorMap] || 'text-slate-500'}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Occupancy Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full my-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColorMap[status.color as keyof typeof barColorMap] || 'bg-slate-400'}`}
          style={{ width: `${Math.min(100, Math.max(4, 100 - occupancyPercent))}%` }}
        />
      </div>

      {/* Rate and Features Row */}
      <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
            {carpark.pricing.weekdayDayRate}
          </span>
          {carpark.pricing.hasFreeParkingScheme && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sunday FPS</span>
            </>
          )}
        </div>

        {/* Feature Icons & Clearance */}
        <div className="flex items-center gap-2 text-slate-400">
          {carpark.hasEvCharging && (
            <span title={`EV Charging available (${carpark.evChargerCount || 2} chargers)`} className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-mono text-[11px]">
              <Zap className="w-3 h-3" />
              <span>{carpark.evChargerCount}</span>
            </span>
          )}
          {carpark.hasShelter && (
            <span title="Covered Shelter" className="text-slate-500 dark:text-slate-400 text-[11px]">
              Sheltered
            </span>
          )}
          <span className="text-[11px] font-mono">
            {carpark.clearanceHeightMeters}m
          </span>
        </div>
      </div>

      {/* Bottom Proximity / MRT footer */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="truncate">
          <span>{carpark.nearestMrt.name} MRT ({carpark.nearestMrt.distanceMeters}m)</span>
          {userDistanceMeters !== undefined && (
            <span className="ml-1 text-blue-600 dark:text-blue-400 font-mono">
              · {formatDistance(userDistanceMeters)} from you
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenFeeCalculator}
            title="Calculate Parking Fee"
            className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
          >
            <Calculator className="w-3 h-3" />
            <span>Calc Fee</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium">
            <span>Details</span>
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
