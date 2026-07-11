'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { ClipboardList, Printer, Download, Square, CheckSquare } from 'lucide-react';

interface EmergencyKitProps {
  userProfile: UserProfile;
}

interface ChecklistItem {
  id: string;
  category: 'before' | 'during' | 'after';
  text: string;
}

export default function EmergencyKit({ userProfile }: EmergencyKitProps) {
  const [completed, setCompleted] = useState<string[]>([]);

  // Generate items dynamically using useMemo (fully SSR-compatible)
  const items = React.useMemo(() => {
    const list: ChecklistItem[] = [];
    const p = userProfile.persona;

    // --- BEFORE THE MONSOON / STORM ---
    list.push({ id: 'b1', category: 'before', text: 'Secure backup power sources (chargers, power banks, torch).' });
    list.push({ id: 'b2', category: 'before', text: 'Store 3-5 days of drinking water (3 liters per person per day).' });
    list.push({ id: 'b3', category: 'before', text: 'Keep dry snacks, non-perishable canned food, and can opener ready.' });
    
    if (userProfile.hasChildren) {
      list.push({ id: 'b-child', category: 'before', text: 'Pack infant formula, baby food, diapers, and clean feeding bottles.' });
    }
    
    if (userProfile.hasElderly || p === 'senior') {
      list.push({ id: 'b-elder', category: 'before', text: 'Verify accessibility pathways are clear of slip hazards.' });
    }

    if (userProfile.medicalDependencies && userProfile.medicalDependencies.length > 0) {
      list.push({ id: 'b-med', category: 'before', text: `Stock at least 14 days of supply for: ${userProfile.medicalDependencies.join(', ')}.` });
      list.push({ id: 'b-med-batt', category: 'before', text: 'Ensure backup battery power is charged for critical medical equipment.' });
    }

    if (p === 'traveller') {
      list.push({ id: 'b-commute', category: 'before', text: 'Pack waterproof emergency gear (poncho, flashlight, high-vis jacket) in your commuter bag/vehicle.' });
      list.push({ id: 'b-commute-map', category: 'before', text: 'Pre-download offline maps for your standard commute path.' });
    }

    if (p === 'farmer') {
      list.push({ id: 'b-crop', category: 'before', text: `Review weather-safe harvest timeline for crop: ${userProfile.farmCrop || 'paddy'}.` });
      if (userProfile.farmLivestock) {
        list.push({ id: 'b-live', category: 'before', text: 'Secure elevated, dry shelters for cattle and poultry; stock dry fodder.' });
      }
    }

    // --- DURING THE MONSOON / STORM ---
    list.push({ id: 'd1', category: 'during', text: 'Stay indoors. Do not drive or walk through flooded waters (even 6 inches can sweep you away).' });
    list.push({ id: 'd2', category: 'during', text: 'Unplug sensitive electronics to protect from voltage surges and lightning.' });
    list.push({ id: 'd3', category: 'during', text: 'Keep tracking real-time community reports and local emergency maps.' });
    
    if (p === 'traveller') {
      list.push({ id: 'd-commute-safe', category: 'during', text: 'If caught in waterlogging, park your vehicle on elevated ground, avoid underpasses, and seek immediate shelter.' });
    }
    
    if (userProfile.medicalDependencies && userProfile.medicalDependencies.length > 0) {
      list.push({ id: 'd-med-check', category: 'during', text: 'Verify backup battery levels on vital medical machines every 3 hours.' });
    }

    // --- AFTER THE MONSOON / STORM ---
    list.push({ id: 'a1', category: 'after', text: 'Watch out for fallen power lines, broken electrical circuits, and dangling branches.' });
    list.push({ id: 'a2', category: 'after', text: 'Boil water before drinking to avoid waterborne diseases (cholera, typhoid, leptospirosis).' });
    list.push({ id: 'a3', category: 'after', text: 'Clear stagnant water pools around your house to prevent mosquito breeding.' });
    
    if (p === 'farmer') {
      list.push({ id: 'a-farm-check', category: 'after', text: 'Audit fields for drainage blockages and report crop damages for insurance coverage.' });
    }

    return list;
  }, [userProfile]);

  const toggleItem = (id: string) => {
    if (completed.includes(id)) {
      setCompleted(completed.filter(x => x !== id));
    } else {
      setCompleted([...completed, id]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const categories = {
      before: 'BEFORE THE MONSOON (PREPARATION)',
      during: 'DURING THE STORM (SAFETY ACTIONS)',
      after: 'AFTER THE EVENT (RECOVERY)'
    };

    let text = `🌧️ VarshaAI Personalized Safety Checklist\n`;
    text += `Location: ${userProfile.locationName}\n`;
    text += `Generated: ${new Date().toLocaleDateString()}\n`;
    text += `=========================================\n\n`;

    (['before', 'during', 'after'] as const).forEach(cat => {
      text += `${categories[cat]}\n`;
      text += `-----------------------------------------\n`;
      items
        .filter(item => item.category === cat)
        .forEach(item => {
          const checked = completed.includes(item.id) ? '[X]' : '[ ]';
          text += `${checked} ${item.text}\n`;
        });
      text += `\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VarshaAI_Safety_Checklist.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderSection = (category: 'before' | 'during' | 'after', title: string) => {
    const list = items.filter(x => x.category === category);
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pl-1">{title}</h4>
        <div className="space-y-1.5">
          {list.map(item => {
            const isDone = completed.includes(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isDone 
                    ? 'bg-zinc-900/25 border-zinc-900/60 opacity-60' 
                    : 'bg-zinc-950/20 border-zinc-900/40 hover:border-zinc-800'
                }`}
              >
                <button className="mt-0.5 text-zinc-500 shrink-0">
                  {isDone ? <CheckSquare className="h-4.5 w-4.5 text-indigo-400" /> : <Square className="h-4.5 w-4.5 text-zinc-700" />}
                </button>
                <span className={`text-xs text-zinc-300 ${isDone ? 'line-through text-zinc-500' : ''}`}>
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-3xl border border-zinc-900 bg-zinc-950/45 p-6 backdrop-blur-md text-white print:border-none print:bg-white print:text-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 print:border-zinc-300">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-indigo-400 print:text-indigo-600" />
          <div>
            <h3 className="font-bold text-sm">Emergency Safety Checklist</h3>
            <p className="text-[10px] text-zinc-500 print:hidden">Tailored Actionable Safety Checklist</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="rounded-lg p-2 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Print Checklist"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            className="rounded-lg p-2 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Download Checklist (.txt)"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {renderSection('before', 'Before - Get Prepared')}
        {renderSection('during', 'During - Take Safe Action')}
        {renderSection('after', 'After - Recover Safely')}
      </div>
    </div>
  );
}
