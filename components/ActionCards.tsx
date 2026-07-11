'use client';

import React, { useState } from 'react';
import { ActionItem } from '@/lib/types';
import { 
  BatteryCharging, Map, Pill, Umbrella, Phone, ShieldAlert, AlertTriangle, 
  Square, CheckSquare 
} from 'lucide-react';

interface ActionCardsProps {
  actions: ActionItem[];
  avoidList: string[];
}

export default function ActionCards({ actions, avoidList }: ActionCardsProps) {
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleComplete = (id: string) => {
    if (completedActions.includes(id)) {
      setCompletedActions(completedActions.filter(aid => aid !== id));
    } else {
      setCompletedActions([...completedActions, id]);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'battery-charging':
        return <BatteryCharging className="h-5 w-5" />;
      case 'map':
        return <Map className="h-5 w-5" />;
      case 'pill':
        return <Pill className="h-5 w-5" />;
      case 'umbrella':
        return <Umbrella className="h-5 w-5" />;
      case 'phone':
        return <Phone className="h-5 w-5" />;
      default:
        return <ShieldAlert className="h-5 w-5" />;
    }
  };

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return {
          border: 'border-rose-900/60 bg-rose-950/5',
          iconColor: 'text-rose-400 bg-rose-950/40 border border-rose-900/40',
          badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        };
      case 'today':
        return {
          border: 'border-amber-900/40 bg-amber-950/5',
          iconColor: 'text-amber-400 bg-amber-950/40 border border-amber-900/30',
          badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        };
      default:
        return {
          border: 'border-zinc-900 bg-zinc-900/10',
          iconColor: 'text-indigo-400 bg-indigo-950/20 border border-indigo-900/30',
          badge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
        };
    }
  };

  // Group actions by urgency
  const immediateActions = actions.filter(a => a.urgency === 'immediate');
  const todayActions = actions.filter(a => a.urgency === 'today');
  const upcomingActions = actions.filter(a => a.urgency === 'upcoming');

  const renderActionSection = (title: string, list: ActionItem[], urgency: string) => {
    if (list.length === 0) return null;
    const styles = getUrgencyStyles(urgency);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-widest ${styles.badge}`}>
            {urgency}
          </span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">{title}</h4>
        </div>
        
        <div className="space-y-2.5">
          {list.map((action) => {
            const isCompleted = completedActions.includes(action.id);
            const isExpanded = expandedCard === action.id;

            return (
              <div 
                key={action.id}
                className={`rounded-2xl border transition-all duration-300 ${styles.border} ${
                  isCompleted ? 'opacity-55 border-zinc-900 bg-zinc-950/10' : 'hover:border-zinc-800'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between p-4 gap-3">
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={() => toggleComplete(action.id)}
                      className="mt-0.5 text-zinc-500 hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckSquare className="h-5 w-5 text-indigo-400" />
                      ) : (
                        <Square className="h-5 w-5 text-zinc-700" />
                      )}
                    </button>
                    
                    <div className="space-y-0.5">
                      <p className={`text-sm font-semibold text-zinc-200 transition-all ${isCompleted ? 'line-through text-zinc-500' : ''}`}>
                        {action.title}
                      </p>
                      <p className="text-xs text-zinc-400 leading-relaxed pr-6">{action.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded font-medium">
                          🕒 {action.timeframe}
                        </span>
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : action.id)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 cursor-pointer ml-1"
                        >
                          {isExpanded ? 'Hide info' : 'Explain why?'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-2 rounded-xl shrink-0 ${styles.iconColor}`}>
                    {getIcon(action.icon)}
                  </div>
                </div>

                {/* Expanded Grounding Evidence Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-zinc-900/60 pt-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200 text-2xs text-zinc-400">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/60 rounded-xl p-3 border border-zinc-900">
                      <div>
                        <p className="font-semibold text-zinc-300">Why this action?</p>
                        <p className="leading-relaxed mt-0.5 text-zinc-400">{action.why}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-300">Evidence & Grounding Source</p>
                        <p className="leading-relaxed mt-0.5 text-zinc-400">{action.evidence}</p>
                        <p className="text-3xs text-zinc-500 font-semibold mt-1">Source: {action.source} ({action.confidence}% confidence)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span>📋</span> AI-Generated Safety Plan
        </h3>
        <p className="text-xs text-zinc-500 leading-normal">
          Personalized timeline checklist. Check off completed items to stay organized.
        </p>
      </div>

      {/* urgencies list */}
      <div className="space-y-5">
        {renderActionSection('Immediate Safety Alerts', immediateActions, 'immediate')}
        {renderActionSection("Today's Priorities", todayActions, 'today')}
        {renderActionSection('Upcoming Planning', upcomingActions, 'upcoming')}
      </div>

      {/* What to Avoid warnings */}
      {avoidList.length > 0 && (
        <div className="rounded-2xl border border-rose-900/40 bg-rose-950/5 p-4 space-y-2.5">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5" /> Safety Warnings (Items to Avoid)
          </h4>
          <ul className="space-y-1.5 pl-5 list-disc text-xs text-rose-200/90 leading-relaxed">
            {avoidList.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
