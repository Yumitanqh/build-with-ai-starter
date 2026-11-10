/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Carpark, FilterState, ApiConnectionConfig, VehicleType } from './types/carpark';
import { INITIAL_CARPARKS } from './data/singaporeCarparks';
import { calculateDistanceKm } from './utils/formatters';
import { Header } from './components/Header';
import { AnalyticsSummary } from './components/AnalyticsSummary';
import { FilterBar } from './components/FilterBar';
import { CarparkCard } from './components/CarparkCard';
import { CarparkMap } from './components/CarparkMap';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { BackendConnectorModal } from './components/BackendConnectorModal';
import { FeeCalculatorDrawer } from './components/FeeCalculatorDrawer';
import { Bookmark, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sg_parkwatch_dark') === 'true';
  });

  // Carparks dataset state
  const [carparks, setCarparks] = useState<Carpark[]>(INITIAL_CARPARKS);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [detailCarpark, setDetailCarpark] = useState<Carpark | null>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_parkwatch_favs');
      return saved ? JSON.parse(saved) : ['ACB', 'TM14', 'ION01'];
    } catch {
      return ['ACB', 'TM14'];
    }
  });
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedVehicle: 'car',
    selectedRegion: 'All',
    selectedAgency: 'All',
    selectedType: 'All',
    minAvailableLots: 0,
    onlyEvCharging: false,
    onlyFreeParkingScheme: false,
    onlyCovered: false,
    sortBy: 'availability_desc',
  });

  // View Mode: 'split' | 'map' | 'list'
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');

  // Backend API configuration state
  const [apiConfig, setApiConfig] = useState<ApiConnectionConfig>(() => {
    try {
      const saved = localStorage.getItem('sg_parkwatch_api_cfg');
      return saved
        ? JSON.parse(saved)
        : {
            mode: 'simulated',
            customEndpointUrl: '',
            refreshIntervalSeconds: 30,
          };
    } catch {
      return {
        mode: 'simulated',
        customEndpointUrl: '',
        refreshIntervalSeconds: 30,
      };
    }
  });

  // Modals state
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isFeeCalcModalOpen, setIsFeeCalcModalOpen] = useState(false);

  // Auto-refresh timer state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [secondsUntilNextPoll, setSecondsUntilNextPoll] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // User Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Sync dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sg_parkwatch_dark', String(darkMode));
  }, [darkMode]);

  // Sync favorites in localStorage
  useEffect(() => {
    localStorage.setItem('sg_parkwatch_favs', JSON.stringify(favorites));
  }, [favorites]);

  // Sync API config in localStorage
  useEffect(() => {
    localStorage.setItem('sg_parkwatch_api_cfg', JSON.stringify(apiConfig));
  }, [apiConfig]);

  // Simulate real-time lot fluctuations (or fetch from custom endpoint)
  const refreshLots = useCallback(async () => {
    setIsRefreshing(true);
    setSecondsUntilNextPoll(apiConfig.refreshIntervalSeconds);

    if (apiConfig.mode === 'custom_api' && apiConfig.customEndpointUrl) {
      try {
        const response = await fetch(apiConfig.customEndpointUrl);
        const data = await response.json();
        if (Array.isArray(data.carparks)) {
          // Merge custom data if provided
          setCarparks((prev) =>
            prev.map((item) => {
              const matched = data.carparks.find((c: any) => c.id === item.id);
              if (matched) {
                return {
                  ...item,
                  lots: {
                    ...item.lots,
                    car: {
                      ...item.lots.car,
                      available: matched.lotsAvailable ?? item.lots.car.available,
                    },
                  },
                  lastUpdated: new Date().toISOString(),
                };
              }
              return item;
            })
          );
        }
      } catch (err) {
        console.warn('Custom backend fetch error:', err);
      }
    } else {
      // Realistic simulation: slight lot fluctuation mimicking real-time cars entering/exiting
      setCarparks((prev) =>
        prev.map((c) => {
          // Random delta between -3 and +3
          const delta = Math.floor(Math.random() * 7) - 3;
          const newCarAvailable = Math.max(
            0,
            Math.min(c.lots.car.total, c.lots.car.available + delta)
          );

          let newMotoAvailable = c.lots.motorcycle?.available;
          if (c.lots.motorcycle) {
            const motoDelta = Math.floor(Math.random() * 3) - 1;
            newMotoAvailable = Math.max(
              0,
              Math.min(c.lots.motorcycle.total, c.lots.motorcycle.available + motoDelta)
            );
          }

          return {
            ...c,
            lots: {
              ...c.lots,
              car: {
                ...c.lots.car,
                available: newCarAvailable,
              },
              motorcycle: c.lots.motorcycle
                ? {
                    ...c.lots.motorcycle,
                    available: newMotoAvailable!,
                  }
                : undefined,
            },
            lastUpdated: new Date().toISOString(),
          };
        })
      );
    }

    setLastUpdatedTime(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    setTimeout(() => setIsRefreshing(false), 300);
  }, [apiConfig]);

  // Polling Interval Effect
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setSecondsUntilNextPoll((prev) => {
        if (prev <= 1) {
          refreshLots();
          return apiConfig.refreshIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, apiConfig.refreshIntervalSeconds, refreshLots]);

  // Locate User via Browser Geolocation
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Default to Marina Bay area if permission denied, for testing convenience
        setUserLocation({ lat: 1.2834, lng: 103.8585 });
      },
      { timeout: 8000 }
    );
  };

  // Toggle favorite
  const handleToggleFavorite = (carparkId: string) => {
    setFavorites((prev) =>
      prev.includes(carparkId) ? prev.filter((id) => id !== carparkId) : [...prev, carparkId]
    );
  };

  // Backend test helper
  const handleTestBackendConnection = async (url: string) => {
    try {
      const start = Date.now();
      const res = await fetch(url, { method: 'GET' });
      const duration = Date.now() - start;
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const count = Array.isArray(data.carparks)
        ? data.carparks.length
        : Array.isArray(data)
        ? data.length
        : 0;
      return {
        success: true,
        message: `Connected successfully (${duration}ms response). Parsed ${count} carparks.`,
        count,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Connection failed. Please ensure CORS is enabled on the server.',
      };
    }
  };

  // Filtered and Sorted Carparks
  const filteredCarparks = useMemo(() => {
    return carparks
      .filter((carpark) => {
        // Favorites only check
        if (favoritesOnly && !favorites.includes(carpark.id)) {
          return false;
        }

        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchId = carpark.id.toLowerCase().includes(q);
          const matchName = carpark.name.toLowerCase().includes(q);
          const matchAddress = carpark.address.toLowerCase().includes(q);
          const matchMrt = carpark.nearestMrt.name.toLowerCase().includes(q);
          const matchArea = carpark.area.toLowerCase().includes(q);
          if (!matchId && !matchName && !matchAddress && !matchMrt && !matchArea) {
            return false;
          }
        }

        // Region filter
        if (filters.selectedRegion !== 'All' && carpark.area !== filters.selectedRegion) {
          return false;
        }

        // Agency filter
        if (filters.selectedAgency !== 'All' && carpark.agency !== filters.selectedAgency) {
          return false;
        }

        // EV Charging only
        if (filters.onlyEvCharging && !carpark.hasEvCharging) {
          return false;
        }

        // Free Parking Scheme only
        if (filters.onlyFreeParkingScheme && !carpark.pricing.hasFreeParkingScheme) {
          return false;
        }

        // Covered / Shelter only
        if (filters.onlyCovered && !carpark.hasShelter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const lotA = a.lots[filters.selectedVehicle] || a.lots.car;
        const lotB = b.lots[filters.selectedVehicle] || b.lots.car;

        switch (filters.sortBy) {
          case 'availability_desc':
            return lotB.available - lotA.available;
          case 'availability_asc':
            return lotA.available - lotB.available;
          case 'occupancy_asc': {
            const occA = lotA.total > 0 ? (lotA.total - lotA.available) / lotA.total : 1;
            const occB = lotB.total > 0 ? (lotB.total - lotB.available) / lotB.total : 1;
            return occA - occB;
          }
          case 'rate_asc':
            return a.pricing.weekdayDayRatePerHr - b.pricing.weekdayDayRatePerHr;
          case 'name_asc':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [carparks, filters, favoritesOnly, favorites]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Header (Follows Top Bar Contract) */}
      <Header
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        onOpenFeeCalculator={() => setIsFeeCalcModalOpen(true)}
        onToggleFavoritesOnly={() => setFavoritesOnly((prev) => !prev)}
        favoritesCount={favorites.length}
        favoritesOnly={favoritesOnly}
        onRefreshData={refreshLots}
        isRefreshing={isRefreshing}
        lastUpdatedTime={lastUpdatedTime}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />

      {/* 2. Islandwide Telemetry & Vehicle Switcher */}
      <AnalyticsSummary
        carparks={carparks}
        selectedVehicle={filters.selectedVehicle}
        onVehicleChange={(vehicle) => setFilters((prev) => ({ ...prev, selectedVehicle: vehicle }))}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh((prev) => !prev)}
        secondsUntilNextPoll={secondsUntilNextPoll}
      />

      {/* 3. Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        resultCount={filteredCarparks.length}
        totalCount={carparks.length}
      />

      {/* 4. Active Saved Lots Filter Banner */}
      {favoritesOnly && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Filtering by your saved carparks only ({favorites.length} saved)</span>
          </div>
          <button
            onClick={() => setFavoritesOnly(false)}
            className="font-medium underline hover:text-amber-900 dark:hover:text-amber-100"
          >
            Show all carparks
          </button>
        </div>
      )}

      {/* 5. Main Viewport Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:px-6 lg:px-8">
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-230px)] min-h-[580px]">
            {/* Left: Scrollable List View (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {filteredCarparks.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      No carparks match your search
                    </h4>
                    <p className="text-xs text-slate-500">
                      Try clearing filters or searching for another estate or MRT.
                    </p>
                  </div>
                ) : (
                  filteredCarparks.map((carpark) => {
                    const distanceMeters = userLocation
                      ? calculateDistanceKm(
                          userLocation.lat,
                          userLocation.lng,
                          carpark.coordinates.lat,
                          carpark.coordinates.lng
                        ) * 1000
                      : undefined;

                    return (
                      <CarparkCard
                        key={carpark.id}
                        carpark={carpark}
                        selectedVehicle={filters.selectedVehicle}
                        isSelected={selectedCarpark?.id === carpark.id}
                        isFavorite={favorites.includes(carpark.id)}
                        onSelect={() => setSelectedCarpark(carpark)}
                        onToggleFavorite={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(carpark.id);
                        }}
                        onOpenFeeCalculator={(e) => {
                          e.stopPropagation();
                          setSelectedCarpark(carpark);
                          setIsFeeCalcModalOpen(true);
                        }}
                        userDistanceMeters={distanceMeters}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Interactive Singapore Map (7 cols on lg) */}
            <div className="lg:col-span-7 h-full flex flex-col">
              <CarparkMap
                carparks={filteredCarparks}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={(cp) => {
                  setSelectedCarpark(cp);
                  setDetailCarpark(cp);
                }}
                selectedVehicle={filters.selectedVehicle}
                darkMode={darkMode}
                userLocation={userLocation}
                onLocateUser={handleLocateUser}
              />
            </div>
          </div>
        )}

        {viewMode === 'map' && (
          <div className="w-full h-[calc(100vh-230px)] min-h-[580px]">
            <CarparkMap
              carparks={filteredCarparks}
              selectedCarpark={selectedCarpark}
              onSelectCarpark={(cp) => {
                setSelectedCarpark(cp);
                setDetailCarpark(cp);
              }}
              selectedVehicle={filters.selectedVehicle}
              darkMode={darkMode}
              userLocation={userLocation}
              onLocateUser={handleLocateUser}
            />
          </div>
        )}

        {viewMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCarparks.map((carpark) => {
              const distanceMeters = userLocation
                ? calculateDistanceKm(
                    userLocation.lat,
                    userLocation.lng,
                    carpark.coordinates.lat,
                    carpark.coordinates.lng
                  ) * 1000
                : undefined;

              return (
                <CarparkCard
                  key={carpark.id}
                  carpark={carpark}
                  selectedVehicle={filters.selectedVehicle}
                  isSelected={selectedCarpark?.id === carpark.id}
                  isFavorite={favorites.includes(carpark.id)}
                  onSelect={() => {
                    setSelectedCarpark(carpark);
                    setDetailCarpark(carpark);
                  }}
                  onToggleFavorite={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(carpark.id);
                  }}
                  onOpenFeeCalculator={(e) => {
                    e.stopPropagation();
                    setSelectedCarpark(carpark);
                    setIsFeeCalcModalOpen(true);
                  }}
                  userDistanceMeters={distanceMeters}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>SG ParkWatch © {new Date().getFullYear()}</span>
            <span className="mx-2">·</span>
            <span>Singapore Carpark Availability Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="hover:text-blue-600 transition-colors"
            >
              Developer API Specs
            </button>
            <span>·</span>
            <button
              onClick={() => setIsFeeCalcModalOpen(true)}
              className="hover:text-blue-600 transition-colors"
            >
              Fee Calculator
            </button>
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      <CarparkDetailModal
        carpark={detailCarpark}
        onClose={() => setDetailCarpark(null)}
        selectedVehicle={filters.selectedVehicle}
        isFavorite={detailCarpark ? favorites.includes(detailCarpark.id) : false}
        onToggleFavorite={() => {
          if (detailCarpark) handleToggleFavorite(detailCarpark.id);
        }}
      />

      {/* Backend Integration & API Spec Modal */}
      <BackendConnectorModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={apiConfig}
        onSaveConfig={setApiConfig}
        onTestConnection={handleTestBackendConnection}
      />

      {/* Standalone Fee Calculator Drawer */}
      <FeeCalculatorDrawer
        isOpen={isFeeCalcModalOpen}
        onClose={() => setIsFeeCalcModalOpen(false)}
        carparks={carparks}
        selectedCarparkId={selectedCarpark?.id}
        onSelectCarparkForDetail={(cp) => {
          setSelectedCarpark(cp);
          setDetailCarpark(cp);
        }}
      />
    </div>
  );
}
