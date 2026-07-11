'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Wifi, WifiOff, Settings, AlertTriangle } from 'lucide-react';
import SettingsModal from './SettingsModal';

interface NavbarProps {
  onOpenSettings?: () => void;
}

export default function Navbar({ onOpenSettings }: NavbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    // 1. Monitor network status
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // 2. Check if local API Key exists
    if (typeof window !== 'undefined') {
      const localKey = localStorage.getItem('varsha_ai_api_key');
      setHasApiKey(!!localKey);
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-[100] w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6 py-3 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo and Tagline */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-indigo-600 bg-clip-text text-transparent">
              🌧️ VarshaAI
            </span>
            <span className="hidden md:inline text-xs font-normal text-zinc-500 tracking-wide">
              Your Personal AI Monsoon Safety Companion
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* API Status */}
            {hasApiKey ? (
              <div 
                onClick={() => setIsSettingsOpen(true)}
                className="cursor-pointer flex items-center gap-1.5 rounded-full bg-indigo-950/40 border border-indigo-900/50 px-3 py-1 text-xs text-indigo-300 hover:border-indigo-500 transition-colors"
                title="AI Engine Active"
              >
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">AI Active</span>
              </div>
            ) : (
              <div 
                onClick={() => setIsSettingsOpen(true)}
                className="cursor-pointer flex items-center gap-1.5 rounded-full bg-amber-950/40 border border-amber-900/50 px-3 py-1 text-xs text-amber-300 hover:border-amber-500 transition-colors"
                title="Configure API key to enable live AI recommendations"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>AI Configuration Required</span>
              </div>
            )}

            {/* Offline Status */}
            {isOnline ? (
              <div className="flex items-center gap-1 rounded-full bg-emerald-950/30 border border-emerald-900/40 px-2.5 py-0.5 text-[10px] text-emerald-400 font-medium">
                <Wifi className="h-3 w-3" />
                <span className="hidden sm:inline">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-rose-950/50 border border-rose-900 px-2.5 py-0.5 text-[10px] text-rose-400 font-semibold animate-pulse">
                <WifiOff className="h-3 w-3" />
                <span>Offline Mode</span>
              </div>
            )}

            {/* Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-lg p-2 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800 transition-all duration-200"
              title="Settings"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}
