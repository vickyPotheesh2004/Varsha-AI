'use client';

import React, { useState } from 'react';
import { RouteData } from '@/lib/types';
import { Navigation, Clock, AlertTriangle, Check, Loader2, ArrowRight } from 'lucide-react';

interface TravelAdvisoryProps {
  routeData: RouteData | null;
  commuteStart?: string;
  commuteEnd?: string;
  onCalculateRoute: (start: string, end: string) => Promise<void>;
}

export default function TravelAdvisory({ routeData, commuteStart, commuteEnd, onCalculateRoute }: TravelAdvisoryProps) {
  const [start, setStart] = useState(commuteStart || '');
  const [end, setEnd] = useState(commuteEnd || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start.trim() || !end.trim()) return;

    setLoading(true);
    try {
      await onCalculateRoute(start, end);
    } catch (err) {
      console.error(err);
      alert('Could not calculate commute route. Please check the addresses.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/40 border border-rose-900/40';
      case 'HIGH':
        return 'text-orange-400 bg-orange-950/40 border border-orange-900/40';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-950/40 border border-amber-900/30';
      default:
        return 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/30';
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-zinc-900 bg-zinc-950/45 p-6 backdrop-blur-md text-white">
      <div className="flex items-center gap-2 border-b border-zinc-900/80 pb-3">
        <Navigation className="h-5 w-5 text-indigo-400" />
        <div>
          <h3 className="font-bold text-sm">Travel & Route Intelligence</h3>
          <p className="text-[10px] text-zinc-500">Weather-Aware OSRM Routing Guidance</p>
        </div>
      </div>

      {routeData ? (
        <div className="space-y-4 animate-in fade-in duration-300 text-xs">
          {/* Commute Summary Header */}
          <div className="grid grid-cols-2 gap-3 bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4">
            <div>
              <p className="text-zinc-500 text-3xs uppercase font-semibold">Commute Distance</p>
              <p className="text-base font-bold text-zinc-200 mt-0.5">{routeData.distanceKm} km</p>
            </div>
            <div>
              <p className="text-zinc-500 text-3xs uppercase font-semibold">Est. Duration (Normal)</p>
              <p className="text-base font-bold text-zinc-200 mt-0.5 flex items-center gap-1">
                <Clock className="h-4.5 w-4.5 text-zinc-500" /> {routeData.durationMinutes} mins
              </p>
            </div>
          </div>

          {/* Route Risk Callout */}
          <div className={`rounded-2xl p-4 space-y-1.5 ${getRiskStyles(routeData.weatherRisk)}`}>
            <p className="font-semibold text-2xs uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Route Weather Impact: {routeData.weatherRisk} Risk
            </p>
            <p className="text-zinc-300 leading-relaxed text-xs">{routeData.riskReason}</p>
          </div>

          {/* Recalculate / Change Route Form */}
          <details className="text-2xs text-zinc-500 hover:text-zinc-400 cursor-pointer">
            <summary className="font-semibold py-1">Configure different route</summary>
            <form onSubmit={handleSubmit} className="space-y-2 mt-2 cursor-default" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Start address"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="rounded-lg bg-zinc-900 border border-zinc-850 px-3 py-1.5 text-xs text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Destination address"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="rounded-lg bg-zinc-900 border border-zinc-850 px-3 py-1.5 text-xs text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 py-1.5 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Calculate Route'}
              </button>
            </form>
          </details>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Specify your usual commute start and end points below to get weather warnings along your route.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Starting address (e.g. Dadar West)"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-850 px-4 py-2.5 text-xs text-white placeholder-zinc-650"
                required
              />
              <input
                type="text"
                placeholder="Destination address (e.g. BKC, Bandra)"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-850 px-4 py-2.5 text-xs text-white placeholder-zinc-650"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer text-white shadow-lg shadow-indigo-600/5"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Analyze Commute Route <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
