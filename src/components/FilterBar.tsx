import React from 'react';
import { FilterState, RegionArea, AgencyType } from '../types/carpark';
import { Search, SlidersHorizontal, Map, List, Columns2, X } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  viewMode: 'split' | 'map' | 'list';
  onViewModeChange: (mode: 'split' | 'map' | 'list') => void;
  resultCount: number;
  totalCount: number;
}

const REGIONS: (RegionArea | 'All')[] = [
  'All',
  'Downtown / CBD',
  'Central / Orchard',
  'East',
  'West',
  'North',
  'North-East',
  'South / Marina',
];

const AGENCIES: (AgencyType | 'All')[] = ['All', 'HDB', 'URA', 'Commercial', 'LTA'];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  resultCount,
  totalCount,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.selectedRegion !== 'All' ||
    filters.selectedAgency !== 'All' ||
    filters.onlyEvCharging ||
    filters.onlyFreeParkingScheme ||
    filters.onlyCovered ||
    (filters.maxClearanceRequired ?? 0) > 0;

  const handleClearFilters = () => {
    onFilterChange({
      searchQuery: '',
      selectedRegion: 'All',
      selectedAgency: 'All',
      onlyEvCharging: false,
      onlyFreeParkingScheme: false,
      onlyCovered: false,
      maxClearanceRequired: undefined,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Row 1: Search + Quick Region Select + View Mode Toggles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search carpark code (e.g. ACB, TM14), name, MRT or street..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region Select */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Region:
            </label>
            <select
              value={filters.selectedRegion}
              onChange={(e) => onFilterChange({ selectedRegion: e.target.value })}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Agency Select */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Agency:
            </label>
            <select
              value={filters.selectedAgency}
              onChange={(e) => onFilterChange({ selectedAgency: e.target.value })}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AGENCIES.map((agency) => (
                <option key={agency} value={agency}>
                  {agency === 'All' ? 'All Agencies' : agency}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-end sm:self-auto shrink-0">
            <button
              onClick={() => onViewModeChange('split')}
              title="Split View (Map + List)"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Columns2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('map')}
              title="Map Only"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Map className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              title="List Only"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Filters + Sort By + Clear Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onFilterChange({ onlyEvCharging: !filters.onlyEvCharging })}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                filters.onlyEvCharging
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              ⚡ EV Charging
            </button>

            <button
              onClick={() => onFilterChange({ onlyFreeParkingScheme: !filters.onlyFreeParkingScheme })}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                filters.onlyFreeParkingScheme
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              Free Parking (FPS)
            </button>

            <button
              onClick={() => onFilterChange({ onlyCovered: !filters.onlyCovered })}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                filters.onlyCovered
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              Covered / Shelter
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-2 ml-1"
              >
                <span>Reset filters</span>
              </button>
            )}
          </div>

          {/* Sort By & Results Count */}
          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums text-xs">
              Showing {resultCount} of {totalCount}
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Sort:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
                className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="availability_desc">Most Lots Available</option>
                <option value="occupancy_asc">Lowest Occupancy %</option>
                <option value="rate_asc">Lowest Day Rate</option>
                <option value="name_asc">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
