'use client';

import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { WeatherData, RouteData } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';

interface RiskBadgeProps {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  weatherData: WeatherData;
  routeData: RouteData | null;
  confidenceScore: number;
}

export default function RiskBadge({ riskLevel, reason, weatherData, routeData, confidenceScore }: RiskBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get color styles based on risk
  const getRiskStyles = () => {
    switch (riskLevel) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/40 border-rose-900/60 text-rose-200',
          badge: 'bg-rose-600 text-white shadow-lg shadow-rose-600/20',
          iconColor: 'text-rose-400'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-950/40 border-orange-900/60 text-orange-200',
          badge: 'bg-orange-600 text-white shadow-lg shadow-orange-600/20',
          iconColor: 'text-orange-400'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-950/30 border-amber-900/40 text-amber-200',
          badge: 'bg-amber-500 text-black font-semibold',
          iconColor: 'text-amber-400'
        };
      default:
        return {
          bg: 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300',
          badge: 'bg-emerald-600 text-white',
          iconColor: 'text-emerald-400'
        };
    }
  };

  const styles = getRiskStyles();

  return (
    <div className={`rounded-3xl border p-5 ${styles.bg} transition-all duration-300`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Risk Badge & Summary */}
        <div className="flex items-start gap-4">
          <div className="mt-1 shrink-0">
            <ShieldAlert className={`h-8 w-8 ${styles.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Personal Risk Assessment</span>
              <span className={`text-2xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest ${styles.badge}`}>
                {riskLevel}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-zinc-100">{reason}</p>
          </div>
        </div>

        {/* Action Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="shrink-0 flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          {isOpen ? (
            <>
              Hide Evidence <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Explain reasoning <Info className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Grounded Evidence Panel */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-zinc-900/60 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 text-zinc-300 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live Weather Metrics */}
            <div className="space-y-2 rounded-2xl bg-zinc-950/65 border border-zinc-900/60 p-4">
              <p className="font-semibold text-zinc-200 border-b border-zinc-900 pb-1 flex items-center gap-1.5">
                <span>🌧️</span> Weather Evidence (Open-Meteo)
              </p>
              <ul className="space-y-1.5 text-zinc-400">
                <li className="flex justify-between">
                  <span>Current Precipitation:</span>
                  <span className="font-bold text-zinc-200">{weatherData.currentPrecipitation} mm/h</span>
                </li>
                <li className="flex justify-between">
                  <span>Current Wind Speed:</span>
                  <span className="font-bold text-zinc-200">{weatherData.currentWindSpeed} km/h</span>
                </li>
                <li className="flex justify-between">
                  <span>3-Day Max Rainfall Forecast:</span>
                  <span className="font-bold text-zinc-200">
                    {Math.max(...weatherData.dailyForecast.map(d => d.precipitationMax), 0).toFixed(1)} mm
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Data Freshness:</span>
                  <span className="font-semibold text-zinc-500">{formatTimeAgo(weatherData.updatedAt)}</span>
                </li>
              </ul>
            </div>

            {/* Commute Route Metrics */}
            <div className="space-y-2 rounded-2xl bg-zinc-950/65 border border-zinc-900/60 p-4">
              <p className="font-semibold text-zinc-200 border-b border-zinc-900 pb-1 flex items-center gap-1.5">
                <span>🚗</span> Commute Route Evidence (OSRM)
              </p>
              {routeData ? (
                <ul className="space-y-1.5 text-zinc-400">
                  <li className="flex justify-between">
                    <span>Commute Mode:</span>
                    <span className="font-bold text-zinc-200 capitalize">{routeData.summary}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Route Distance:</span>
                    <span className="font-bold text-zinc-200">{routeData.distanceKm} km</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Estimated Duration:</span>
                    <span className="font-bold text-zinc-200">{routeData.durationMinutes} mins</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Weather Route Impact:</span>
                    <span className="font-bold text-zinc-200 capitalize">{routeData.weatherRisk} Risk</span>
                  </li>
                </ul>
              ) : (
                <p className="text-zinc-500 italic py-2 leading-relaxed">
                  No daily commute route was configured during guided setup. General regional weather and local hazard signals are being prioritized.
                </p>
              )}
            </div>
          </div>

          {/* Decision Confidence Score */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/40 border border-zinc-900/50 rounded-2xl p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-zinc-200">Retrieval Grounding & Explainability</p>
                <p className="text-2xs text-zinc-500 leading-normal mt-0.5">
                  Decisions are grounded in real-time sensor and crowdsourced networks. Zero hallucination guarantee.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-2xs text-zinc-500 uppercase font-semibold">Grounding Confidence</span>
                <p className="text-base font-bold text-indigo-400">{confidenceScore}%</p>
              </div>
              <div className="h-8 w-px bg-zinc-900" />
              <div className="rounded-full bg-indigo-950/30 border border-indigo-900/50 p-2 text-indigo-400">
                <RefreshCw className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
