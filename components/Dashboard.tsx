'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, WeatherData, RouteData, IncidentReport, ShelterData, AIActionPlan } from '@/lib/types';
import RiskBadge from './RiskBadge';
import ActionCards from './ActionCards';
import TravelAdvisory from './TravelAdvisory';
import EmergencyKit from './EmergencyKit';
import AiAssistant from './AiAssistant';
import { MapPin, RefreshCw, RefreshCcw, WifiOff, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet map component with ssr: false to prevent Next.js build errors
const CommunityMap = dynamic(() => import('./CommunityMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-zinc-950 flex items-center justify-center border border-zinc-900 rounded-3xl">
      <div className="flex flex-col items-center gap-2 text-zinc-500">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
        <span className="text-xs">Initializing Maps & Cartography...</span>
      </div>
    </div>
  )
});

interface DashboardProps {
  userProfile: UserProfile;
  onReset: () => void;
}

export default function Dashboard({ userProfile, onReset }: DashboardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [shelters, setShelters] = useState<ShelterData[]>([]);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [actionPlan, setActionPlan] = useState<AIActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Load weather, shelters, and incidents on initialization
  const loadData = async () => {
    setLoading(true);
    try {
      const lat = userProfile.latitude;
      const lng = userProfile.longitude;

      // 1. Fetch Weather
      const weatherRes = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
      const weatherData = await weatherRes.json();
      const resolvedWeather = weatherData.fallback ? weatherData.fallback : weatherData;
      setWeather(resolvedWeather);

      // 2. Fetch Shelters
      const shelterRes = await fetch(`/api/emergency?lat=${lat}&lng=${lng}`);
      const shelterData = await shelterRes.json();
      setShelters(shelterData);

      // 3. Fetch Incident Reports
      const reportRes = await fetch(`/api/report?lat=${lat}&lng=${lng}`);
      const reportData = await reportRes.json();
      setReports(reportData);

      // 4. Fetch Commute Route if specified
      let resolvedRoute = null;
      if (userProfile.commuteStart && userProfile.commuteEnd) {
        try {
          const geocodeStartRes = await fetch(`/api/location?q=${encodeURIComponent(userProfile.commuteStart)}`);
          const geocodeEndRes = await fetch(`/api/location?q=${encodeURIComponent(userProfile.commuteEnd)}`);
          if (geocodeStartRes.ok && geocodeEndRes.ok) {
            const startLocs = await geocodeStartRes.json();
            const endLocs = await geocodeEndRes.json();
            if (startLocs[0] && endLocs[0]) {
              const routeRes = await fetch(
                `/api/route?startLat=${startLocs[0].lat}&startLng=${startLocs[0].lng}&endLat=${endLocs[0].lat}&endLng=${endLocs[0].lng}`
              );
              if (routeRes.ok) {
                resolvedRoute = await routeRes.json();
                setRoute(resolvedRoute);
              }
            }
          }
        } catch (routeErr) {
          console.error('Failed to pre-load route:', routeErr);
        }
      }

      // 5. Generate AI Action Plan
      await generatePlan(resolvedWeather, resolvedRoute, shelterData, reportData);

      // 6. Cache for Offline Fallback
      if (typeof window !== 'undefined') {
        localStorage.setItem('varsha_cached_weather', JSON.stringify(resolvedWeather));
        localStorage.setItem('varsha_cached_shelters', JSON.stringify(shelterData));
        localStorage.setItem('varsha_cached_reports', JSON.stringify(reportData));
        if (resolvedRoute) localStorage.setItem('varsha_cached_route', JSON.stringify(resolvedRoute));
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      loadOfflineFallback();
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineFallback = () => {
    if (typeof window !== 'undefined') {
      const cachedWeather = localStorage.getItem('varsha_cached_weather');
      const cachedShelters = localStorage.getItem('varsha_cached_shelters');
      const cachedReports = localStorage.getItem('varsha_cached_reports');
      const cachedRoute = localStorage.getItem('varsha_cached_route');
      const cachedPlan = localStorage.getItem('varsha_cached_plan');

      if (cachedWeather) setWeather(JSON.parse(cachedWeather));
      if (cachedShelters) setShelters(JSON.parse(cachedShelters));
      if (cachedReports) setReports(JSON.parse(cachedReports));
      if (cachedRoute) setRoute(JSON.parse(cachedRoute));
      if (cachedPlan) setActionPlan(JSON.parse(cachedPlan));
    }
  };

  const generatePlan = async (
    weatherData: WeatherData,
    routeData: RouteData | null,
    shelterData: ShelterData[],
    reportData: IncidentReport[]
  ) => {
    setAiLoading(true);
    try {
      const provider = localStorage.getItem('varsha_ai_provider') || 'gemini';
      const apiKey = localStorage.getItem('varsha_ai_api_key') || '';

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': provider,
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          userProfile,
          weatherData,
          routeData,
          incidents: reportData,
          shelters: shelterData
        })
      });

      if (!res.ok) throw new Error('AI Plan generation failed.');
      
      const plan: AIActionPlan = await res.json();
      setActionPlan(plan);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('varsha_cached_plan', JSON.stringify(plan));
      }
    } catch (err) {
      console.error('AI plan load failed, loading static safety baseline plan...', err);
      // Construct a high quality static safety fallback plan
      const fallbackPlan: AIActionPlan = {
        summary: 'Heavy monsoon showers occurring locally. Dynamic AI safety engine offline, showing general safety timeline.',
        riskLevel: weatherData.riskLevel,
        actions: [
          {
            id: 'f1',
            title: 'Charge emergency power backups',
            description: 'Ensure phones, batteries, and emergency lamps are fully charged immediately.',
            urgency: 'immediate',
            timeframe: 'Within 30 minutes',
            icon: 'battery-charging',
            why: 'Heavy rain is forecast, making local utility cuts highly probable.',
            evidence: `${weatherData.currentPrecipitation}mm current rain`,
            source: 'Open-Meteo Sensor',
            confidence: 90
          },
          {
            id: 'f2',
            title: 'Check nearby shelter locations',
            description: `Review proximity details of the ${shelterData.length} nearest shelters.`,
            urgency: 'today',
            timeframe: 'Before nightfall',
            icon: 'map',
            why: 'Provides evacuation routes in case of severe waterlogging.',
            evidence: `${shelterData.length} shelters identified`,
            source: 'OpenStreetMap',
            confidence: 85
          }
        ],
        avoidList: ['Low-lying subways', 'Under-construction sites', 'Flooded streets'],
        timeline: [
          { timeframe: 'Next 30 mins', task: 'Charge devices', priority: 'high' }
        ],
        confidenceScore: 70,
        sourcesUsed: ['Local Static Database']
      };
      setActionPlan(fallbackPlan);
    } finally {
      setAiLoading(false);
    }
  };

  // Callback to calculate OSRM route on demand
  const handleCalculateRoute = async (startAddr: string, endAddr: string) => {
    try {
      const geocodeStartRes = await fetch(`/api/location?q=${encodeURIComponent(startAddr)}`);
      const geocodeEndRes = await fetch(`/api/location?q=${encodeURIComponent(endAddr)}`);
      if (!geocodeStartRes.ok || !geocodeEndRes.ok) return;

      const startLocs = await geocodeStartRes.json();
      const endLocs = await geocodeEndRes.json();
      if (!startLocs[0] || !endLocs[0]) return;

      const routeRes = await fetch(
        `/api/route?startLat=${startLocs[0].lat}&startLng=${startLocs[0].lng}&endLat=${endLocs[0].lat}&endLng=${endLocs[0].lng}`
      );
      if (routeRes.ok) {
        const routeData = await routeRes.json();
        setRoute(routeData);
        if (weather) {
          // Re-generate safety plan with route context
          await generatePlan(weather, routeData, shelters, reports);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit community incident report
  const handleSubmitReport = async (type: string, description: string, lat: number, lng: number) => {
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description, lat, lng })
      });
      if (res.ok) {
        // Refetch reports to sync map markers
        const reportRes = await fetch(`/api/report?lat=${userProfile.latitude}&lng=${userProfile.longitude}`);
        const reportData = await reportRes.json();
        setReports(reportData);
        
        // Re-generate action plan to incorporate new safety hazard
        if (weather) {
          await generatePlan(weather, route, shelters, reportData);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();

    // Connection monitoring
    const handleOnline = () => {
      setIsOffline(false);
      loadData();
    };
    const handleOffline = () => {
      setIsOffline(true);
      loadOfflineFallback();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 animate-spin text-indigo-500" />
          <h2 className="text-lg font-semibold tracking-wide">Syncing Environmental Signals...</h2>
          <p className="text-xs text-zinc-500">Retrieving live Open-Meteo, OSRM, and Crowdsource alerts</p>
        </div>
      </div>
    );
  }

  const finalRiskLevel = actionPlan?.riskLevel || weather?.riskLevel || 'LOW';
  const finalRiskReason = actionPlan?.summary || weather?.riskReason || 'Weather conditions are stable and safe.';

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-12">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-rose-950/80 border-b border-rose-900 px-4 py-2 text-center text-xs font-semibold text-rose-200 flex items-center justify-center gap-2 animate-pulse">
          <WifiOff className="h-4 w-4" /> Offline Mode Active. Showing last cached plan and static safety contacts.
        </div>
      )}

      {/* Dashboard Subheader */}
      <div className="bg-zinc-950 border-b border-zinc-900/60 px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-medium">
            <MapPin className="h-4 w-4 text-indigo-400" />
            <span className="truncate max-w-[250px] sm:max-w-[400px]" title={userProfile.locationName}>
              Monitoring: {userProfile.locationName}
            </span>
            <span className="text-zinc-650">•</span>
            <span className="capitalize bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-zinc-300">
              {userProfile.persona} Mode
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={aiLoading}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-zinc-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${aiLoading ? 'animate-spin text-indigo-400' : ''}`} />
              Refresh Signals
            </button>
            <button
              onClick={onReset}
              className="px-3 py-1.5 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Reset Setup
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Risk Assess & AI Safety Recommendations (7 spans) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Risk Engine Visualizer */}
            {weather && (
              <RiskBadge
                riskLevel={finalRiskLevel}
                reason={finalRiskReason}
                weatherData={weather}
                routeData={route}
                confidenceScore={actionPlan?.confidenceScore || 80}
              />
            )}

            {/* AI Recommendations Timeline & Urgencies */}
            {actionPlan && (
              <ActionCards
                actions={actionPlan.actions}
                avoidList={actionPlan.avoidList}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Maps, Travel Advisory, Checklists & Assistant (5 spans) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* OSRM Commuter Advice (Show for commuter or if start/end configured) */}
            {(userProfile.persona === 'traveller' || route) && (
              <TravelAdvisory
                routeData={route}
                commuteStart={userProfile.commuteStart}
                commuteEnd={userProfile.commuteEnd}
                onCalculateRoute={handleCalculateRoute}
              />
            )}

            {/* Live Interactive Leaflet Map */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>🗺️</span> Crowdsourced Monsoon Map
              </h3>
              <p className="text-2xs text-zinc-500 leading-normal mb-1">
                Displays active flood markers, road blocks, power cuts, and nearest shelters/hospitals.
              </p>
              <CommunityMap
                userLat={userProfile.latitude}
                userLng={userProfile.longitude}
                shelters={shelters}
                reports={reports}
                onSubmitReport={handleSubmitReport}
              />
            </div>

            {/* Emergency Checklist */}
            <EmergencyKit userProfile={userProfile} />

            {/* Grounded Q&A Assistant Chat */}
            {weather && (
              <AiAssistant
                userProfile={userProfile}
                weatherData={weather}
                routeData={route}
                incidents={reports}
                shelters={shelters}
              />
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
