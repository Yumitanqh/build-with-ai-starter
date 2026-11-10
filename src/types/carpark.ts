export type AgencyType = 'HDB' | 'URA' | 'LTA' | 'Commercial';
export type CarparkType = 'MSCP' | 'Surface' | 'Basement' | 'Mechanised';
export type VehicleType = 'car' | 'motorcycle' | 'heavyVehicle';
export type RegionArea = 
  | 'Central / Orchard'
  | 'Downtown / CBD'
  | 'North'
  | 'South / Marina'
  | 'East'
  | 'West'
  | 'North-East';

export interface LotAvailability {
  total: number;
  available: number;
}

export interface PricingStructure {
  weekdayDayRate: string;       // e.g. "$1.20 / 30 mins"
  weekdayDayRatePerHr: number;  // numerical for calculation e.g. 2.40
  weekdayEveningRate: string;   // e.g. "$0.60 / 30 mins" or "$3.50/entry"
  weekdayEveningRatePerHr?: number;
  saturdayRate: string;
  sundayHolidayRate: string;
  gracePeriodMins: number;      // e.g. 15
  nightCap: string;             // e.g. "$5.00 maximum"
  isCentralArea: boolean;
  hasFreeParkingScheme: boolean; // Sunday / PH free parking (FPS)
}

export interface HourlyTrendPoint {
  hour: string; // "08:00", "12:00", etc.
  occupiedPercent: number;
  availableLots: number;
}

export interface Carpark {
  id: string; // e.g. "ACB", "TM14", "OR01"
  name: string;
  address: string;
  postalCode: string;
  agency: AgencyType;
  type: CarparkType;
  area: RegionArea;
  coordinates: {
    lat: number;
    lng: number;
  };
  nearestMrt: {
    name: string;
    line: string;
    distanceMeters: number;
  };
  lots: {
    car: LotAvailability;
    motorcycle?: LotAvailability;
    heavyVehicle?: LotAvailability;
  };
  pricing: PricingStructure;
  clearanceHeightMeters: number;
  hasEvCharging: boolean;
  evChargerCount?: number;
  hasShelter: boolean;
  electronicParkingSystem: boolean; // CashCard / NETS / EZ-Link IU
  lastUpdated: string; // ISO string
  trend: 'filling_fast' | 'stable' | 'emptying' | 'critical';
  history24h: HourlyTrendPoint[];
}

export interface FilterState {
  searchQuery: string;
  selectedVehicle: VehicleType;
  selectedRegion: string;
  selectedAgency: string;
  selectedType: string;
  minAvailableLots: number;
  onlyEvCharging: boolean;
  onlyFreeParkingScheme: boolean;
  onlyCovered: boolean;
  maxClearanceRequired?: number;
  sortBy: 'availability_desc' | 'availability_asc' | 'rate_asc' | 'name_asc' | 'occupancy_asc';
}

export interface ApiConnectionConfig {
  mode: 'simulated' | 'custom_api';
  customEndpointUrl: string;
  customApiKey?: string;
  refreshIntervalSeconds: number;
}
