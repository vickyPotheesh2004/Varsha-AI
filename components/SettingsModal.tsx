'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, Server, Key, Database, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [provider, setProvider] = useState<'openrouter' | 'gemini'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProvider = localStorage.getItem('varsha_ai_provider') as 'openrouter' | 'gemini';
      const savedKey = localStorage.getItem('varsha_ai_api_key');
      const savedSupaUrl = localStorage.getItem('varsha_ai_supabase_url');
      const savedSupaKey = localStorage.getItem('varsha_ai_supabase_key');

      if (savedProvider) setProvider(savedProvider);
      if (savedKey) setApiKey(savedKey);
      if (savedSupaUrl) setSupabaseUrl(savedSupaUrl);
      if (savedSupaKey) setSupabaseKey(savedSupaKey);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('varsha_ai_provider', provider);
      localStorage.setItem('varsha_ai_api_key', apiKey.trim());
      localStorage.setItem('varsha_ai_supabase_url', supabaseUrl.trim());
      localStorage.setItem('varsha_ai_supabase_key', supabaseKey.trim());
      
      // Also trigger a page reload or update global variables if necessary
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
        // Reload page to re-trigger API client configurations
        window.location.reload();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-semibold tracking-wide">Developer & AI Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="rounded-lg bg-zinc-900/50 border border-zinc-900 p-4 text-xs text-zinc-400 leading-relaxed flex gap-2.5">
            <Shield className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-300 mb-1">Local Configuration</p>
              Your credentials are saved **locally in your browser** and never stored on our servers. They are passed directly to our API routes for live operations. If environment variables are already set on Vercel, these local overrides are optional.
            </div>
          </div>

          {/* AI Settings Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" /> AI Engine Configuration
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">AI Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider('gemini')}
                    className={`rounded-lg py-2 text-sm font-medium border transition-all ${
                      provider === 'gemini'
                        ? 'bg-indigo-600/10 border-indigo-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    Google Gemini
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('openrouter')}
                    className={`rounded-lg py-2 text-sm font-medium border transition-all ${
                      provider === 'openrouter'
                        ? 'bg-indigo-600/10 border-indigo-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    OpenRouter API
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center justify-between">
                  <span>API Key</span>
                  <a 
                    href={provider === 'gemini' ? 'https://aistudio.google.com/' : 'https://openrouter.ai/keys'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Get API Key
                  </a>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                    <Key className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    placeholder={`Enter your ${provider === 'gemini' ? 'Gemini' : 'OpenRouter'} API Key`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Supabase Section */}
          <div className="space-y-4 pt-2 border-t border-zinc-900">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" /> Crowdsourcing Database (Optional)
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Supabase Project URL</label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaved}
              className={`rounded-lg px-5 py-2 text-sm font-semibold flex items-center gap-2 transition-all ${
                isSaved 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="h-4 w-4" /> Settings Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
