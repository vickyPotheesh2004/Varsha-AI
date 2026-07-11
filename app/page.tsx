'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';
import { UserProfile } from '@/lib/types';
import { Shield, Map, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('varsha_profile');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return null;
  });
  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('varsha_profile', JSON.stringify(newProfile));
    }
  };

  const handleReset = () => {
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('varsha_profile');
      localStorage.removeItem('varsha_cached_weather');
      localStorage.removeItem('varsha_cached_shelters');
      localStorage.removeItem('varsha_cached_reports');
      localStorage.removeItem('varsha_cached_route');
      localStorage.removeItem('varsha_cached_plan');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans relative">
      {/* Confined background glowing gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] bg-blue-500/8 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-20%] right-[-15%] w-[700px] h-[700px] bg-indigo-500/8 rounded-full blur-[160px]"></div>
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

      {profile ? (
        <Dashboard userProfile={profile} onReset={handleReset} />
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto px-4 sm:px-6 py-12 items-center justify-center gap-12 w-full">
          {/* Landing / Marketing Pitch (Left) */}
          <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-950/50 border border-indigo-900 px-3 py-1 text-xs text-indigo-300 font-semibold">
                <ShieldCheck className="h-4 w-4" /> Hackathon Prototype v1.0
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent leading-tight">
                Weather apps tell you what is happening.<br />
                <span className="text-indigo-400 font-black">VarshaAI tells you what to do.</span>
              </h1>
              <p className="text-base text-zinc-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                An AI-first monsoon safety coordinator that aggregates live environmental sensor feeds and location context to produce grounded, personalized safety timelines.
              </p>
            </div>

            {/* Core Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex gap-3 items-start">
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-indigo-400 shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-zinc-200">Evidence Grounded</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Every action cites real-time weather and incident records. No hallucinations.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-indigo-400 shrink-0">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-zinc-200">Crowdsourced Alerts</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Live local mapping of road blockages, fallen trees, and flooded streets.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-indigo-400 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-zinc-200">Offline Preparedness</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Automatic client-side caching guarantees safety info is active when network drops.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-indigo-400 shrink-0">
                  <span>🚗</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-zinc-200">Route Intelligence</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Commute delays and flood warnings computed along custom routing paths.</p>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-zinc-600">
              Built for PromptWars (Google for Developers x Hack2skill)
            </div>
          </div>

          {/* Onboarding Form Card (Right) */}
          <div className="lg:w-1/2 w-full">
            <Onboarding onComplete={handleOnboardingComplete} />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
