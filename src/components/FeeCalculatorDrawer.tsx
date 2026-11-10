import React, { useState } from 'react';
import { Carpark, VehicleType } from '../types/carpark';
import { calculateParkingFee } from '../utils/feeCalculator';
import { X, Calculator, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface FeeCalculatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  carparks: Carpark[];
  selectedCarparkId?: string;
  onSelectCarparkForDetail: (carpark: Carpark) => void;
}

export const FeeCalculatorDrawer: React.FC<FeeCalculatorDrawerProps> = ({
  isOpen,
  onClose,
  carparks,
  selectedCarparkId,
  onSelectCarparkForDetail,
}) => {
  if (!isOpen) return null;

  const [activeCarparkId, setActiveCarparkId] = useState<string>(
    selectedCarparkId || carparks[0]?.id || ''
  );
  const [vehicle, setVehicle] = useState<VehicleType>('car');
  const [dayType, setDayType] = useState<'weekday' | 'saturday' | 'sunday_holiday'>('weekday');
  const [entryHour, setEntryHour] = useState<number>(12);
  const [entryMinute, setEntryMinute] = useState<number>(0);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);

  const selectedCarpark = carparks.find((c) => c.id === activeCarparkId) || carparks[0];

  const totalMinutes = durationHours * 60 + durationMinutes;
  const result = selectedCarpark
    ? calculateParkingFee(
        selectedCarpark,
        vehicle,
        dayType,
        entryHour,
        entryMinute,
        totalMinutes
      )
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Singapore Parking Fee Calculator
              </h2>
              <p className="text-xs text-slate-500">
                Official HDB, URA & Commercial parking rate estimator.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Select Carpark */}
          <div>
            <label className="block font-semibold text-slate-900 dark:text-white mb-1">
              Select Carpark
            </label>
            <select
              value={activeCarparkId}
              onChange={(e) => setActiveCarparkId(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
            >
              {carparks.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  [{cp.id}] {cp.name} ({cp.agency} · {cp.area})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Vehicle Type</label>
              <select
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value as VehicleType)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="car">Car</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="heavyVehicle">Heavy Vehicle</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Day of Visit</label>
              <select
                value={dayType}
                onChange={(e) => setDayType(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="weekday">Weekday (Mon - Fri)</option>
                <option value="saturday">Saturday</option>
                <option value="sunday_holiday">Sunday / Public Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Entry Time</label>
              <div className="flex gap-1">
                <select
                  value={entryHour}
                  onChange={(e) => setEntryHour(Number(e.target.value))}
                  className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                <select
                  value={entryMinute}
                  onChange={(e) => setEntryMinute(Number(e.target.value))}
                  className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                >
                  <option value={0}>00m</option>
                  <option value={15}>15m</option>
                  <option value={30}>30m</option>
                  <option value={45}>45m</option>
                </select>
              </div>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-900 dark:text-white">
                Parking Duration: {durationHours} hr {durationMinutes > 0 ? `${durationMinutes} min` : ''}
              </label>
              <span className="text-slate-400 font-mono text-[11px]">
                {totalMinutes} total minutes
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[15, 30, 60, 90, 120, 180, 240, 360].map((mins) => {
                const isSelected = totalMinutes === mins;
                return (
                  <button
                    key={mins}
                    onClick={() => {
                      setDurationHours(Math.floor(mins / 60));
                      setDurationMinutes(mins % 60);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result Card */}
          {result && (
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">ESTIMATED TOTAL PARKING CHARGE</span>
                  <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                    ${result.totalEstimatedFee.toFixed(2)}
                  </div>
                </div>
                {result.isFree && (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-xs">
                    FREE PARKING APPLIED
                  </span>
                )}
              </div>

              {/* Itemized Calculation Breakdown */}
              <div className="space-y-1 pt-2 border-t border-blue-100 dark:border-blue-900/40">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Calculation Details:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {result.breakdown.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                    <span>
                      Standard Grace Period: {selectedCarpark.pricing.gracePeriodMins} minutes before charges begin
                    </span>
                  </li>
                  {selectedCarpark.pricing.hasFreeParkingScheme && (
                    <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>HDB Free Parking Scheme active on Sundays & Public Holidays (7:30am - 10:30pm)</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={() => {
              if (selectedCarpark) {
                onClose();
                onSelectCarparkForDetail(selectedCarpark);
              }
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            View {selectedCarpark?.id} Full Carpark Details →
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
