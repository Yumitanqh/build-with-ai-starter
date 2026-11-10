import { Carpark, VehicleType } from '../types/carpark';

export interface FeeCalculationResult {
  totalEstimatedFee: number;
  breakdown: string[];
  isFree: boolean;
  gracePeriodApplied: boolean;
  applicableNightCap: boolean;
}

export function calculateParkingFee(
  carpark: Carpark,
  vehicleType: VehicleType,
  dayType: 'weekday' | 'saturday' | 'sunday_holiday',
  entryHour: number, // 0 - 23
  entryMinute: number, // 0 - 59
  durationMinutes: number
): FeeCalculationResult {
  const breakdown: string[] = [];

  // Motorcycles in HDB/URA typically have fixed flat rates ($0.65 per session or per day)
  if (vehicleType === 'motorcycle') {
    if (carpark.agency === 'HDB' || carpark.agency === 'URA') {
      return {
        totalEstimatedFee: 0.65,
        breakdown: ['HDB/URA Standard Motorcycle Flat Rate: $0.65 per session (7am-10:30pm)'],
        isFree: false,
        gracePeriodApplied: false,
        applicableNightCap: false,
      };
    } else {
      const motoFee = Math.min(3.0, 1.20 + Math.floor(durationMinutes / 120) * 0.50);
      return {
        totalEstimatedFee: Number(motoFee.toFixed(2)),
        breakdown: [`Commercial Motorcycle Rate: estimated $${motoFee.toFixed(2)}`],
        isFree: false,
        gracePeriodApplied: false,
        applicableNightCap: false,
      };
    }
  }

  // Grace period check
  if (durationMinutes <= carpark.pricing.gracePeriodMins) {
    return {
      totalEstimatedFee: 0,
      breakdown: [`Exited within ${carpark.pricing.gracePeriodMins}-minute grace period`],
      isFree: true,
      gracePeriodApplied: true,
      applicableNightCap: false,
    };
  }

  // Sunday / PH Free Parking Scheme check
  if (dayType === 'sunday_holiday' && carpark.pricing.hasFreeParkingScheme) {
    const entryTimeDec = entryHour + entryMinute / 60;
    const exitTimeDec = entryTimeDec + durationMinutes / 60;
    // Free Parking Scheme is typically 7:30am to 10:30pm (7.5 to 22.5)
    if (entryTimeDec >= 7.5 && exitTimeDec <= 22.5) {
      return {
        totalEstimatedFee: 0,
        breakdown: ['HDB/URA Free Parking Scheme (FPS) active: Sunday 7:30am - 10:30pm'],
        isFree: true,
        gracePeriodApplied: false,
        applicableNightCap: false,
      };
    }
  }

  let totalFee = 0;
  const billableHalfHours = Math.ceil(durationMinutes / 30);

  if (carpark.agency === 'HDB' || carpark.agency === 'URA') {
    const isCentral = carpark.pricing.isCentralArea;
    const halfHourRate = isCentral ? 1.20 : 0.60;
    
    // Check if falls in day or night
    const dayHalfHours = billableHalfHours;
    totalFee = dayHalfHours * halfHourRate;
    
    // Night cap: $5.00 maximum for HDB between 10:30pm and 7:00am
    let nightCapApplied = false;
    if (totalFee > 5.00 && (entryHour >= 22 || entryHour < 7)) {
      totalFee = 5.00;
      nightCapApplied = true;
    }

    breakdown.push(
      `${billableHalfHours} block(s) of 30 mins @ $${halfHourRate.toFixed(2)} (${isCentral ? 'Central Area' : 'Standard Area'})`
    );
    if (nightCapApplied) {
      breakdown.push('Night cap of $5.00 applied');
    }

    return {
      totalEstimatedFee: Number(totalFee.toFixed(2)),
      breakdown,
      isFree: false,
      gracePeriodApplied: false,
      applicableNightCap: nightCapApplied,
    };
  }

  // Commercial / Mall carpark estimation
  const hours = durationMinutes / 60;
  const baseRate = carpark.pricing.weekdayDayRatePerHr || 2.4;
  
  if (dayType === 'weekday' && entryHour >= 18) {
    // Evening per-entry rate if applicable
    totalFee = 3.50;
    breakdown.push('Evening Per-Entry Flat Rate: $3.50');
  } else {
    // 1st hour + subsequent hours
    if (hours <= 1) {
      totalFee = baseRate;
      breakdown.push(`1st hour standard rate: $${baseRate.toFixed(2)}`);
    } else {
      const remainingHalfHrs = Math.ceil((durationMinutes - 60) / 30);
      const subRate = baseRate * 0.6; // typical half hr increment
      totalFee = baseRate + remainingHalfHrs * (subRate / 2);
      breakdown.push(`1st hour: $${baseRate.toFixed(2)}`);
      breakdown.push(`Additional ${remainingHalfHrs} half-hour(s): $${(remainingHalfHrs * (subRate / 2)).toFixed(2)}`);
    }
  }

  return {
    totalEstimatedFee: Number(totalFee.toFixed(2)),
    breakdown,
    isFree: false,
    gracePeriodApplied: false,
    applicableNightCap: false,
  };
}
