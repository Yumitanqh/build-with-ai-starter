import React from 'react';
import { Moon, Sun, Database, RefreshCw, Bookmark } from 'lucide-react';

interface HeaderProps {
  onOpenBackendModal: () => void;
  onOpenFeeCalculator: () => void;
  onToggleFavoritesOnly: () => void;
  favoritesCount: number;
  favoritesOnly: boolean;
  onRefreshData: () => void;
  isRefreshing: boolean;
  lastUpdatedTime: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBackendModal,
  onOpenFeeCalculator,
  onToggleFavoritesOnly,
  favoritesCount,
  favoritesOnly,
  onRefreshData,
  isRefreshing,
  lastUpdatedTime,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a href="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              SG ParkWatch
            </a>
            <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Singapore
            </span>
          </div>

          {/* Zone 2: Clean single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={onToggleFavoritesOnly}
              className={`flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap ${
                favoritesOnly ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Lots ({favoritesCount})</span>
            </button>

            <button
              onClick={onOpenFeeCalculator}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Fee Calculator
            </button>

            <button
              onClick={onOpenBackendModal}
              className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              <Database className="w-4 h-4" />
              <span>API Specs</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>Synced</span>
              <span className="tabular-nums">{lastUpdatedTime}</span>
              <button
                onClick={onRefreshData}
                disabled={isRefreshing}
                title="Refresh real-time lot availability"
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onToggleDarkMode}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenBackendModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              Connect Backend
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
