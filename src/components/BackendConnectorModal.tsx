import React, { useState } from 'react';
import { ApiConnectionConfig } from '../types/carpark';
import { X, Check, Copy, Server, Globe, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface BackendConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConnectionConfig;
  onSaveConfig: (config: ApiConnectionConfig) => void;
  onTestConnection: (url: string) => Promise<{ success: boolean; message: string; count?: number }>;
}

export const BackendConnectorModal: React.FC<BackendConnectorModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestConnection,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'config' | 'schema' | 'starter_code'>('config');
  const [mode, setMode] = useState<'simulated' | 'custom_api'>(config.mode);
  const [endpointUrl, setEndpointUrl] = useState(config.customEndpointUrl);
  const [pollInterval, setPollInterval] = useState(config.refreshIntervalSeconds);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleTest = async () => {
    if (!endpointUrl) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(endpointUrl);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed. Check CORS headers and endpoint availability.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      mode,
      customEndpointUrl: endpointUrl,
      refreshIntervalSeconds: pollInterval,
    });
    onClose();
  };

  const sampleExpressCode = `// server.ts (Express Backend Route for SG Carpark Tracker)
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// Proxy endpoint for Data.gov.sg Real-Time Carpark Availability
app.get('/api/carparks', async (req, res) => {
  try {
    // 1. Fetch live lot availability from Data.gov.sg
    const response = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability');
    const data = await response.json();
    
    // 2. Format into the standard schema used by SG ParkWatch
    const carparkItems = data.items[0]?.carpark_data || [];
    
    res.json({
      timestamp: data.items[0]?.timestamp,
      count: carparkItems.length,
      carparks: carparkItems.map((item: any) => ({
        id: item.carpark_number,
        totalLots: parseInt(item.carpark_info[0]?.total_lots || '0', 10),
        lotsAvailable: parseInt(item.carpark_info[0]?.lots_available || '0', 10),
        lotType: item.carpark_info[0]?.lot_type || 'C',
        lastUpdated: item.update_datetime
      }))
    });
  } catch (error) {
    console.error('Error fetching Data.gov.sg carpark feed:', error);
    res.status(500).json({ error: 'Failed to fetch carpark availability' });
  }
});

app.listen(5000, () => console.log('Carpark backend service running on port 5000'));`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Backend Connection & API Setup
              </h2>
              <p className="text-xs text-slate-500">
                Front-end is fully built and ready for your backend integration.
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Endpoint Configuration
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Data.gov.sg & Schema Spec
          </button>
          <button
            onClick={() => setActiveTab('starter_code')}
            className={`pb-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'starter_code'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Backend Starter Code
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'config' && (
            <div className="space-y-4">
              {/* Mode Selection */}
              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-2">
                  Data Feed Source Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setMode('simulated')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      mode === 'simulated'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 dark:text-white mb-0.5">
                      Simulated Real-Time Feed
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Uses 30+ comprehensive Singapore carparks with realistic live lot fluctuations.
                    </div>
                  </div>

                  <div
                    onClick={() => setMode('custom_api')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      mode === 'custom_api'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 dark:text-white mb-0.5">
                      Custom Backend API
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Connect to your own Express/FastAPI server or direct endpoint.
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom API Endpoint Inputs */}
              {mode === 'custom_api' && (
                <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-slate-700 dark:text-slate-300">
                        Backend Endpoint URL
                      </label>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setEndpointUrl('/api/carparkavailability')}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
                        >
                          Use /api/carparkavailability
                        </button>
                        <span className="text-slate-400">·</span>
                        <button
                          type="button"
                          onClick={() => setEndpointUrl('/api/health')}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
                        >
                          Use /api/health
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="/api/carparkavailability or https://api.yourdomain.com/carparks"
                        value={endpointUrl}
                        onChange={(e) => setEndpointUrl(e.target.value)}
                        className="flex-1 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
                      />
                      <button
                        onClick={handleTest}
                        disabled={testing || !endpointUrl}
                        className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                      >
                        {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                        <span>Test</span>
                      </button>
                    </div>
                  </div>

                  {/* Test Result Message */}
                  {testResult && (
                    <div
                      className={`p-2.5 rounded-lg border flex items-start gap-2 text-[11px] ${
                        testResult.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                          : 'bg-red-50 dark:bg-red-950/30 border-red-200 text-red-800 dark:text-red-300'
                      }`}
                    >
                      {testResult.success ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong>{testResult.success ? 'Connection Successful!' : 'Connection Error:'}</strong>{' '}
                        {testResult.message}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Polling Frequency
                    </label>
                    <select
                      value={pollInterval}
                      onChange={(e) => setPollInterval(Number(e.target.value))}
                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    >
                      <option value={15}>Every 15 seconds (High frequency)</option>
                      <option value={30}>Every 30 seconds (Standard)</option>
                      <option value={60}>Every 60 seconds (Gentle)</option>
                      <option value={120}>Every 2 minutes</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  Official Singapore Open Data Feeds
                </h4>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Singapore's Government provides real-time carpark availability updated every 1 minute from HDB and URA systems.
                </p>
                <div className="mt-2 space-y-1 font-mono text-[11px]">
                  <div>• Data.gov.sg: <code className="text-blue-600 dark:text-blue-400">https://api.data.gov.sg/v1/transport/carpark-availability</code></div>
                  <div>• LTA DataMall: <code className="text-blue-600 dark:text-blue-400">CarParkAvailabilityv2</code> (Requires Account Key)</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1.5">
                  Expected Frontend Carpark Object Schema
                </h4>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
{`interface CarparkResponse {
  id: string;              // e.g. "ACB", "TM14", "OR01"
  name: string;            // e.g. "Bras Basah Complex"
  address: string;
  agency: "HDB" | "URA" | "LTA" | "Commercial";
  type: "MSCP" | "Surface" | "Basement" | "Mechanised";
  area: "Central / Orchard" | "Downtown / CBD" | "East" | "West" | "North" | "North-East";
  coordinates: { lat: number; lng: number };
  lots: {
    car: { total: number; available: number };
    motorcycle?: { total: number; available: number };
    heavyVehicle?: { total: number; available: number };
  };
  pricing: {
    weekdayDayRate: string;
    sundayHolidayRate: string;
    hasFreeParkingScheme: boolean;
  };
  clearanceHeightMeters: number;
  hasEvCharging: boolean;
}`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'starter_code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Express.js / Node.js Proxy Route
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sampleExpressCode);
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2000);
                  }}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  {copiedSnippet ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-64">
                {sampleExpressCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Currently using: <strong>{mode === 'simulated' ? 'Simulated Live Feed' : 'Custom Endpoint'}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
