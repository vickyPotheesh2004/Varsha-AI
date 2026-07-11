'use client';

import React, { useState } from 'react';
import { MapPin, Users, Tractor, Navigation, Shield, User, Heart, ArrowRight, Loader2 } from 'lucide-react';
import { UserProfile, PersonaType } from '@/lib/types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Form State
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [persona, setPersona] = useState<PersonaType>('individual');
  
  // Context state
  const [householdSize, setHouseholdSize] = useState(4);
  const [hasChildren, setHasChildren] = useState(false);
  const [hasElderly, setHasElderly] = useState(false);
  const [medicalDeps, setMedicalDeps] = useState<string[]>([]);
  const [commuteMode, setCommuteMode] = useState<'bike' | 'car' | 'public' | 'walk' | 'none'>('bike');
  const [commuteStart, setCommuteStart] = useState('');
  const [commuteEnd, setCommuteEnd] = useState('');
  const [farmCrop, setFarmCrop] = useState('rice');
  const [farmLivestock, setFarmLivestock] = useState(false);

  // Detect location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`/api/location?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
          if (res.ok) {
            const data = await res.json();
            setSelectedLocation({
              name: data.name,
              lat: data.lat,
              lng: data.lng
            });
            setLocationQuery(data.name);
          } else {
            // Fallback default
            setSelectedLocation({
              name: 'Mumbai, Maharashtra',
              lat: 19.0760,
              lng: 72.8777
            });
            setLocationQuery('Mumbai, Maharashtra (default fallback)');
          }
        } catch (e) {
          setSelectedLocation({ name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error(error);
        alert('Could not retrieve location. Please search manually.');
        setLoading(false);
      }
    );
  };

  // Search Location
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/location?q=${encodeURIComponent(locationQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (loc: any) => {
    setSelectedLocation({
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng
    });
    setLocationQuery(loc.name);
    setSearchResults([]);
  };

  const toggleMedicalDep = (med: string) => {
    if (medicalDeps.includes(med)) {
      setMedicalDeps(medicalDeps.filter(d => d !== med));
    } else {
      setMedicalDeps([...medicalDeps, med]);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedLocation) {
      alert('Please select or search your location first.');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = () => {
    if (!selectedLocation) return;
    
    const profile: UserProfile = {
      persona,
      locationName: selectedLocation.name,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      ...(persona === 'family' && { householdSize, hasChildren, hasElderly, medicalDependencies: medicalDeps }),
      ...(persona === 'senior' && { householdSize: 1, hasElderly: true, medicalDependencies: medicalDeps }),
      ...(persona === 'traveller' && { commuteMode, commuteStart, commuteEnd }),
      ...(persona === 'farmer' && { farmCrop, farmLivestock })
    };
    
    onComplete(profile);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-zinc-950/70 border border-zinc-900 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl text-white">
      {/* Progress Indicator */}
      <div className="flex justify-between items-center mb-8">
        <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">Step {step} of 3</span>
        <div className="flex gap-1.5">
          <span className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-indigo-500' : 'bg-zinc-800'}`}></span>
          <span className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-indigo-500' : 'bg-zinc-800'}`}></span>
          <span className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-indigo-500' : 'bg-zinc-800'}`}></span>
        </div>
      </div>

      {/* STEP 1: Location selection */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Where are you located?</h2>
            <p className="text-sm text-zinc-400">VarshaAI needs your coordinates to scan local monsoon rainfall, routing, and flood reports.</p>
          </div>

          <button
            onClick={handleDetectLocation}
            disabled={loading}
            className="w-full py-4.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
            Detect My GPS Location
          </button>

          <div className="relative flex items-center justify-center">
            <span className="h-px w-full bg-zinc-900"></span>
            <span className="absolute bg-zinc-950 px-3 text-xs text-zinc-500 uppercase tracking-widest">Or Search Manually</span>
          </div>

          <form onSubmit={handleSearchLocation} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter city, town, or area name"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="flex-1 rounded-2xl bg-zinc-900/50 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-zinc-600"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all text-sm font-semibold flex items-center gap-1 cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-900 overflow-hidden max-h-48 overflow-y-auto">
              {searchResults.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-900/80 transition-colors text-zinc-300 flex items-start gap-2.5"
                >
                  <MapPin className="h-4.5 w-4.5 text-zinc-500 shrink-0 mt-0.5" />
                  <span>{loc.name}</span>
                </button>
              ))}
            </div>
          )}

          {selectedLocation && (
            <div className="rounded-2xl bg-indigo-950/20 border border-indigo-900/40 p-4 text-sm text-indigo-300 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-indigo-400 shrink-0" />
              <div>
                <p className="font-semibold text-zinc-200">Selected Location</p>
                <p className="text-xs text-zinc-400 truncate max-w-xs">{selectedLocation.name}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-900 flex justify-end">
            <button
              onClick={handleNextStep}
              className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Persona Selection */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Select your profile</h2>
            <p className="text-sm text-zinc-400">Personalizing the safety checks depends on who you are caring for or how you travel.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'individual', title: 'Individual', icon: User, desc: 'General preparedness and local safety updates.' },
              { id: 'family', title: 'Caregiver / Family', icon: Users, desc: 'Prioritize children, elderly, and medical needs.' },
              { id: 'traveller', title: 'Daily Commuter', icon: Navigation, desc: 'Route-specific water logging and delay alerts.' },
              { id: 'farmer', title: 'Farmer / Grower', icon: Tractor, desc: 'Harvest warnings, livestock protection schedules.' },
              { id: 'senior', title: 'Senior Citizen', icon: Heart, desc: 'Direct accessibility aids, medical supplies, backup power.' }
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id as PersonaType)}
                  className={`col-span-1 text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                    persona === p.id 
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-600/5' 
                      : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${persona === p.id ? 'text-indigo-400' : 'text-zinc-500'}`} />
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-200">{p.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-normal">{p.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-zinc-900 flex justify-between">
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-xl hover:bg-zinc-900 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Persona Context Form */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Additional details</h2>
            <p className="text-sm text-zinc-400">Just a few optional details to tailor your safety plan checklist.</p>
          </div>

          {/* FAMILY & SENIOR PROFILE DETAILS */}
          {(persona === 'family' || persona === 'senior') && (
            <div className="space-y-4">
              {persona === 'family' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Household Size</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={householdSize}
                      onChange={(e) => setHouseholdSize(parseInt(e.target.value))}
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-850 px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div className="flex flex-col justify-end gap-2.5 pb-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                      <input 
                        type="checkbox" 
                        checked={hasChildren}
                        onChange={(e) => setHasChildren(e.target.checked)}
                        className="rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500" 
                      />
                      Children Present
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                      <input 
                        type="checkbox" 
                        checked={hasElderly}
                        onChange={(e) => setHasElderly(e.target.checked)}
                        className="rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500" 
                      />
                      Elderly Present
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Medical Dependencies (Check all that apply)</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Oxygen Concentrator', 'Regular Dialysis', 'Insulin Cooling', 'Cardiac Support', 'General Medication Storage'].map((med) => (
                    <button
                      key={med}
                      type="button"
                      onClick={() => toggleMedicalDep(med)}
                      className={`text-left px-3 py-2 rounded-xl text-xs border transition-all ${
                        medicalDeps.includes(med)
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 font-medium'
                          : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-zinc-800'
                      }`}
                    >
                      {med}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TRAVELLER / COMMUTER DETAILS */}
          {persona === 'traveller' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Commute Mode</label>
                <select
                  value={commuteMode}
                  onChange={(e) => setCommuteMode(e.target.value as any)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-850 px-4 py-2.5 text-sm"
                >
                  <option value="bike">Two-wheeler / Bike</option>
                  <option value="car">Four-wheeler / Car</option>
                  <option value="public">Metro / Train / Public Transit</option>
                  <option value="walk">Walking</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Usual Route Start (e.g. Home Neighborhood)</label>
                <input
                  type="text"
                  placeholder="e.g. Dadar West"
                  value={commuteStart}
                  onChange={(e) => setCommuteStart(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-850 px-4 py-2.5 text-sm text-white placeholder-zinc-650"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Usual Route End (e.g. Work/Office Area)</label>
                <input
                  type="text"
                  placeholder="e.g. Bandra Kurla Complex"
                  value={commuteEnd}
                  onChange={(e) => setCommuteEnd(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-850 px-4 py-2.5 text-sm text-white placeholder-zinc-650"
                />
              </div>
            </div>
          )}

          {/* FARMER DETAILS */}
          {persona === 'farmer' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Primary Crops Grown</label>
                <select
                  value={farmCrop}
                  onChange={(e) => setFarmCrop(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-850 px-4 py-2.5 text-sm"
                >
                  <option value="rice">Rice (Paddy)</option>
                  <option value="cotton">Cotton</option>
                  <option value="sugarcane">Sugarcane</option>
                  <option value="vegetables">Horticulture / Vegetables</option>
                  <option value="wheat">Wheat</option>
                </select>
              </div>

              <div className="py-2">
                <label className="flex items-center gap-2.5 text-sm text-zinc-300 font-medium">
                  <input 
                    type="checkbox" 
                    checked={farmLivestock}
                    onChange={(e) => setFarmLivestock(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500" 
                  />
                  I own livestock (Cattle, poultry, goats, etc.)
                </label>
              </div>
            </div>
          )}

          {/* INDIVIDUAL DETAILS */}
          {persona === 'individual' && (
            <div className="rounded-2xl bg-zinc-900/40 border border-zinc-900 p-5 text-sm text-zinc-400 leading-relaxed">
              <Shield className="h-5 w-5 text-indigo-400 mb-2" />
              We will set up your dashboard with standard urban flood monitoring, real-time community safety reports, nearby medical clinics, and a custom rain preparation timeline. You can configure custom travel routes or medical alerts at any time.
            </div>
          )}

          <div className="pt-4 border-t border-zinc-900 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-xl hover:bg-zinc-900 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              Generate Action Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
