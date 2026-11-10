import { LotAvailability, VehicleType } from '../types/carpark';

export function getAvailabilityStatus(lot: LotAvailability) {
  if (lot.total === 0) return { status: 'none', label: 'No Lots', color: 'slate' };
  const percent = (lot.available / lot.total) * 100;

  if (lot.available === 0) {
    return { status: 'full', label: 'Full', percent: 0, color: 'slate', dotColor: 'bg-slate-400' };
  }
  if (percent < 10 || lot.available <= 10) {
    return { status: 'critical', label: 'Critical', percent: Math.round(percent), color: 'red', dotColor: 'bg-red-500' };
  }
  if (percent < 25 || lot.available <= 30) {
    return { status: 'limited', label: 'Filling Up', percent: Math.round(percent), color: 'amber', dotColor: 'bg-amber-500' };
  }
  return { status: 'plenty', label: 'Available', percent: Math.round(percent), color: 'emerald', dotColor: 'bg-emerald-500' };
}

export function formatDistance(meters?: number): string {
  if (meters === undefined || meters === null) return '';
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatVehicleTypeLabel(vehicle: VehicleType): string {
  switch (vehicle) {
    case 'car':
      return 'Cars';
    case 'motorcycle':
      return 'Motorcycles';
    case 'heavyVehicle':
      return 'Heavy Vehicles';
  }
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
