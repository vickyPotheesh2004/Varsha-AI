'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { UserProfile, WeatherData, RouteData, IncidentReport, ShelterData } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiAssistantProps {
  userProfile: UserProfile;
  weatherData: WeatherData;
  routeData: RouteData | null;
  incidents: IncidentReport[];
  shelters: ShelterData[];
}

export default function AiAssistant({ userProfile, weatherData, routeData, incidents, shelters }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your VarshaAI Safety Coordinator. I have analyzed your profile as a ${userProfile.persona} and the current local weather. Click any of the suggested safety questions below, or ask me directly.`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions based on Persona
  const getSuggestions = () => {
    const p = userProfile.persona;
    if (p === 'family') {
      return [
        'What should I prepare for a power outage?',
        'What medications should I stock for my elderly family member?',
        'How do I secure my home before a severe storm?'
      ];
    }
    if (p === 'traveller') {
      return [
        'Is it safe to travel right now?',
        'What routes should I avoid during waterlogging?',
        'What safety steps should I follow while driving in heavy rain?'
      ];
    }
    if (p === 'farmer') {
      return [
        'Should I harvest my crops today?',
        'How do I secure my livestock from heavy rain?',
        'What pesticide schedule changes are recommended?'
      ];
    }
    if (p === 'senior') {
      return [
        'Who should I call in a medical emergency?',
        'How do I prepare for mobility disruptions?',
        'What backup power options are recommended for medical devices?'
      ];
    }
    return [
      'What should my immediate emergency kit contain?',
      'How do I check local flood warnings?',
      'What areas near me are currently flooded?'
    ];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    // Append user message
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // Gather local credentials if available
      const provider = localStorage.getItem('varsha_ai_provider') || 'gemini';
      const apiKey = localStorage.getItem('varsha_ai_api_key') || '';

      const response = await fetch('/api/v1/ai', {
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
          incidents,
          shelters,
          question: text // Pass specific question
        })
      });

      if (!response.ok) {
        throw new Error('AI assistant response error');
      }

      const data = await response.json();
      
      // If backend responds with the full action plan JSON because of a fallback, handle it gracefully
      let assistantResponseText = '';
      if (data.answer) {
        assistantResponseText = data.answer;
      } else if (data.summary) {
        assistantResponseText = `${data.summary}\n\n**Immediate Actions:**\n` + 
          data.actions.slice(0, 3).map((a: { title: string; description: string }) => `- ${a.title}: ${a.description}`).join('\n');
      } else if (data.message) {
        assistantResponseText = data.message;
      } else {
        assistantResponseText = JSON.stringify(data);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: assistantResponseText }]);
    } catch (error: unknown) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ I encountered an error checking our AI safety models. Please ensure your API key is correctly saved in the Settings gear above.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputText);
    }
  };

  return (
    <div className="flex flex-col h-[500px] rounded-3xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-md overflow-hidden text-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-900 bg-zinc-950 px-4 py-3 shrink-0">
        <Bot className="h-5 w-5 text-indigo-400" />
        <div>
          <h3 className="font-bold text-sm">VarshaAI Safety Assistant</h3>
          <p className="text-[10px] text-zinc-500">Retrieval-Grounded Decision Intelligence</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm leading-relaxed">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-1.5 shrink-0 text-indigo-400">
                <Bot className="h-4 w-4" />
              </div>
            )}
            
            <div className={`rounded-2xl px-4 py-2.5 max-w-[85%] whitespace-pre-line ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-zinc-900/60 border border-zinc-900 text-zinc-200 rounded-tl-none'
            }`}>
              {msg.content}
            </div>

            {msg.role === 'user' && (
              <div className="rounded-xl bg-indigo-950 border border-indigo-900 p-1.5 shrink-0 text-indigo-300">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-1.5 text-indigo-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl px-4 py-2.5 bg-zinc-900/40 border border-zinc-900 text-zinc-400 flex items-center gap-2 rounded-tl-none">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              Analyzing safety parameters...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Triggers */}
      <div className="px-4 py-2.5 bg-zinc-950 border-t border-zinc-900/60 shrink-0">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Suggested safety checks:</p>
        <div className="flex flex-wrap gap-1.5">
          {getSuggestions().map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sug)}
              disabled={loading}
              className="text-left text-xs bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-700 px-3 py-1.5 rounded-full transition-all text-zinc-300 cursor-pointer disabled:opacity-50"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-900 flex gap-2 shrink-0">
        <input
          type="text"
          placeholder="Ask about travel safety, evacuation, or power backup..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loading}
          className="flex-1 bg-zinc-900 border border-zinc-850 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-zinc-600 disabled:opacity-50"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={loading || !inputText.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
