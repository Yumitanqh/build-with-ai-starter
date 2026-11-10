import React, { useState } from 'react';
import { Carpark, VehicleType } from '../types/carpark';
import { calculateParkingFee } from '../utils/feeCalculator';
import { getAvailabilityStatus, formatDistance } from '../utils/formatters';
import {
  X,
  Navigation,
  ExternalLink,
  Bookmark,
  Zap,
  Shield,
  Clock,
  Car,
  Bike,
  Truck,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Activity,
  Calculator,
  Train,
} from 'lucide-react';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  onClose: () => void;
  selectedVehicle: VehicleType;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  userDistanceMeters?: number;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  selectedVehicle,
  isFavorite,
  onToggleFavorite,
  userDistanceMeters,
}) => {
  if (!carpark) return null;

  const [copied, setCopied] = useState(false);
  const [calcVehicle, setCalcVehicle] = useState<VehicleType>(selectedVehicle);
  const [calcDay, setCalcDay] = useState<'weekday' | 'saturday' | 'sunday_holiday'>('weekday');
  const [calcEntryHour, setCalcEntryHour] = useState<number>(12);
  const [calcDurationMins, setCalcDurationMins] = useState<number>(120);

  const lotInfo = carpark.lots[selectedVehicle] || carpark.lots.car;
  const status = getAvailabilityStatus(lotInfo);

  const feeResult = calculateParkingFee(
    carpark,
    calcVehicle,
    calcDay,
    calcEntryHour,
    0,
    calcDurationMins
  );

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${carpark.name}, ${carpark.address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`;
  const wazeUrl = `https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{carpark.id}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.agency}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.type}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.area}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {carpark.name}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate">{carpark.address}</span>
              <button
                onClick={handleCopyAddress}
                title="Copy Address"
                className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleFavorite}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs">
          {/* Real-time Availability Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Car lots */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-blue-500" />
                  <span>Car Lots</span>
                </span>
                <span className="font-mono text-[11px]">
                  {Math.round(((carpark.lots.car.total - carpark.lots.car.available) / carpark.lots.car.total) * 100)}% occ
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {carpark.lots.car.available}
                </span>
                <span className="text-slate-400 font-mono text-xs tabular-nums">
                  / {carpark.lots.car.total}
                </span>
              </div>
              <span className={`inline-block mt-1 font-medium ${
                status.status === 'plenty' ? 'text-emerald-600 dark:text-emerald-400' :
                status.status === 'limited' ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {getAvailabilityStatus(carpark.lots.car).label}
              </span>
            </div>

            {/* Motorcycle lots */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5 text-amber-500" />
                  <span>Motorcycles</span>
                </span>
                <span className="font-mono text-[11px]">
                  {carpark.lots.motorcycle ? 'Available' : 'N/A'}
                </span>
              </div>
              {carpark.lots.motorcycle ? (
                <>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {carpark.lots.motorcycle.available}
                    </span>
                    <span className="text-slate-400 font-mono text-xs tabular-nums">
                      / {carpark.lots.motorcycle.total}
                    </span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Lots Ready</span>
                </>
              ) : (
                <div className="mt-2 text-slate-400">No motorcycle lots recorded</div>
              )}
            </div>

            {/* Proximity / Nearest Station */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Train className="w-3.5 h-3.5 text-purple-500" />
                  <span>Nearest MRT</span>
                </span>
                <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                  {carpark.nearestMrt.distanceMeters}m
                </span>
              </div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm mt-1">
                {carpark.nearestMrt.name}
              </div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                {carpark.nearestMrt.line}
              </span>
            </div>
          </div>

          {/* 24-Hour Occupancy Forecast & Trend */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Today's 24-Hour Occupancy Curve</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">
                Peak expected @ 12:00 - 14:00
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
              <div className="flex items-end justify-between gap-1.5 h-24 pt-4">
                {carpark.history24h.map((point, index) => {
                  const heightPercent = point.occupiedPercent;
                  const isPeak = heightPercent > 70;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center p-1 bg-slate-900 text-white rounded text-[10px] font-mono whitespace-nowrap z-10">
                        <span>{point.hour}</span>
                        <span>{point.occupiedPercent}% occupied</span>
                      </div>
                      <div
                        className={`w-full rounded-t transition-all ${
                          isPeak ? 'bg-amber-500 dark:bg-amber-400' : 'bg-blue-500 dark:bg-blue-400'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-700">
                        {point.hour.slice(0, 2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-700/60 pt-1.5">
                <span>00:00 (Midnight)</span>
                <span>12:00 (Noon)</span>
                <span>23:59 (Night)</span>
              </div>
            </div>
          </div>

          {/* Pricing Rules & Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                Official Parking Rates
              </h4>
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Weekday Day (7am - 5pm)</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {carpark.pricing.weekdayDayRate}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Weekday Evening</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {carpark.pricing.weekdayEveningRate}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Sunday & Public Holidays</span>
                  <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {carpark.pricing.sundayHolidayRate}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Grace Period</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {carpark.pricing.gracePeriodMins} mins
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                Facility Features
              </h4>
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Clearance Height</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {carpark.clearanceHeightMeters}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">EV Charging Hub</span>
                  <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                    {carpark.hasEvCharging ? `${carpark.evChargerCount || 2} Fast Chargers` : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Shelter / Weather Cover</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {carpark.hasShelter ? 'Full MSCP / Covered' : 'Open-Air Surface'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment System</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    Electronic Parking (EPS / In-Vehicle Unit)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Quick Parking Fee Estimator */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white text-xs">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>Estimate Parking Fee For Your Visit</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">Live Calculator</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs mb-3">
              <div>
                <label className="block text-slate-500 mb-1">Vehicle</label>
                <select
                  value={calcVehicle}
                  onChange={(e) => setCalcVehicle(e.target.value as VehicleType)}
                  className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium"
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="heavyVehicle">Heavy Vehicle</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Day</label>
                <select
                  value={calcDay}
                  onChange={(e) => setCalcDay(e.target.value as any)}
                  className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium"
                >
                  <option value="weekday">Weekday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday_holiday">Sunday / PH</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Entry Time</label>
                <select
                  value={calcEntryHour}
                  onChange={(e) => setCalcEntryHour(Number(e.target.value))}
                  className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono"
                >
                  <option value={9}>09:00 AM (Morning)</option>
                  <option value={12}>12:00 PM (Lunch)</option>
                  <option value={15}>03:00 PM (Afternoon)</option>
                  <option value={19}>07:00 PM (Dinner)</option>
                  <option value={23}>11:00 PM (Night)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Duration</label>
                <select
                  value={calcDurationMins}
                  onChange={(e) => setCalcDurationMins(Number(e.target.value))}
                  className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono"
                >
                  <option value={15}>15 mins (Grace)</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={300}>5 hours</option>
                  <option value={480}>8 hours (Full work day)</option>
                </select>
              </div>
            </div>

            {/* Calculated Result Output */}
            <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-blue-900/40">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500">Estimated Cost:</span>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  {feeResult.breakdown.join(' · ')}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                  ${feeResult.totalEstimatedFee.toFixed(2)}
                </span>
                {feeResult.isFree && (
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    FREE
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            GPS: {carpark.coordinates.lat.toFixed(4)}° N, {carpark.coordinates.lng.toFixed(4)}° E
          </div>

          <div className="flex items-center gap-2">
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Waze</span>
            </a>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Navigate in Google Maps</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
