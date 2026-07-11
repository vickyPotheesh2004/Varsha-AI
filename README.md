<p align="center">
  <img src="https://img.shields.io/badge/VarshaAI-Monsoon%20Safety-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==&logoColor=white" alt="VarshaAI Badge" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Gemini%20AI-Powered-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/PromptWars-Hackathon-FF6B6B?style=for-the-badge" alt="PromptWars" />
</p>

# 🌧️ VarshaAI — Your Personal AI Monsoon Safety Companion

> **Weather apps tell you what's happening. VarshaAI tells you what to do.**

VarshaAI is an **AI-first monsoon safety coordinator** that aggregates live environmental sensor feeds, crowdsourced community incident reports, and personal context to produce **grounded, personalized, and time-prioritized safety action plans** — with full evidence transparency and zero hallucinations.

Built for the **PromptWars Hackathon** (Google for Developers × Hack2skill).

🔗 **Live Demo**: [varsha-ai.vercel.app](https://varsha-ai.vercel.app)

---

## 🎯 The Problem

During India's monsoon season, millions face flooding, power outages, road blockages, and medical emergencies. Existing weather apps show raw data (temperature, rainfall mm) but fail to translate it into **actionable, persona-specific guidance**. A farmer, a daily commuter, and a senior citizen with medical dependencies all need fundamentally different safety plans — but receive the same generic forecast.

## 💡 The Solution

VarshaAI bridges the gap between raw weather data and actionable intelligence by:

1. **Ingesting real-time data** from Open-Meteo weather sensors, OSRM routing engines, and community crowdsource networks
2. **Understanding the user's context** through persona-based profiling (family size, medical dependencies, commute routes, crop types)
3. **Generating a grounded AI safety plan** via Google Gemini that cites specific evidence, assigns confidence scores, and prioritizes actions by urgency
4. **Providing continuous safety support** through an AI chatbot that answers safety questions with retrieval-augmented, data-grounded responses

---

## ✨ Key Features

### 🔐 Smart Onboarding (3-Step Guided Setup)
- **GPS auto-detection** with Nominatim reverse geocoding fallback
- **Manual location search** for any city, town, or village
- **5 persona profiles**: Individual, Caregiver/Family, Daily Commuter, Farmer, Senior Citizen
- **Context-specific profiling**: household size, children/elderly flags, medical dependencies (oxygen concentrator, dialysis, insulin), commute mode & route, crop type & livestock

### 📊 Real-Time Risk Assessment Dashboard
- **4-tier risk engine** (LOW → MEDIUM → HIGH → CRITICAL) computed from live Open-Meteo precipitation, wind speed, and 3-day forecast aggregation
- **Evidence transparency panel** — every risk assessment shows the exact data points, sources, and confidence scores driving the decision
- **Live weather metrics**: current temperature, precipitation rate, wind speed, hourly/daily forecasts

### 🤖 AI-Powered Personalized Action Plans
- **Google Gemini generates structured JSON safety plans** with:
  - Prioritized action cards with urgency levels (immediate / today / upcoming)
  - Time-specific recommendations ("Within 30 minutes", "Before 4 PM")
  - Per-action evidence citations ("80mm rainfall forecast — Open-Meteo")
  - Confidence scores per recommendation
  - Avoid-lists (flooded roads, unsafe underpasses)
  - Source attribution transparency
- **Persona-tailored intelligence**: family plans prioritize elderly care & medical supplies; farmer plans focus on harvest timelines & livestock; commuter plans highlight route-specific waterlogging

### 💬 AI Safety Assistant (Grounded Q&A Chatbot)
- **Conversational interface** for asking safety questions in natural language
- **Retrieval-Augmented Generation (RAG)** — every response is grounded in the user's live weather data, route details, community incidents, and shelter locations
- **Persona-specific suggested questions** (e.g., "Should I harvest my crops today?" for farmers, "What routes should I avoid?" for commuters)

### 🗺️ Crowdsourced Community Safety Map
- **Interactive Leaflet.js map** with real-time markers for:
  - 💧 Flooding reports
  - 🚫 Road blockages
  - ⚡ Power outages
  - 🌲 Fallen trees
  - 🚨 Medical emergencies
- **Click-to-report** — users can file local hazard reports directly on the map
- **Shelter & hospital markers** with distance calculations (Haversine formula)
- **Dark-themed CartoDB tiles** with animated user location indicator
- **Supabase backend** for persistent community report storage

### 🚗 Commute Route Intelligence
- **OSRM (Open Source Routing Machine)** integration for real driving route calculations
- **Monsoon-adjusted travel time estimation** with weather risk overlay
- **Geocoding via Nominatim** for natural language address resolution
- **Haversine fallback** with 30 km/h monsoon speed assumptions when OSRM is unavailable

### 📋 Emergency Safety Checklist
- **Persona-tailored preparation checklists** organized in 3 phases:
  - ✅ **Before** — preparation (power backups, water storage, medical supplies)
  - ✅ **During** — safety actions (stay indoors, unplug electronics)
  - ✅ **After** — recovery (water purification, stagnant water clearing)
- **Interactive checkboxes** to track completion progress
- **Print & download** as a `.txt` file for offline reference

### 📡 Offline-First Architecture
- **Automatic localStorage caching** of weather data, shelter locations, incident reports, route data, and AI action plans
- **Network loss detection** with graceful fallback to cached safety data
- **Offline banner notification** when operating in degraded mode

### ⚙️ Configurable AI Engine
- **Settings modal** for choosing AI provider (Google Gemini or OpenRouter)
- **Client-side API key management** — keys stored locally in the browser, never on servers
- **Multi-model fallback chain**: Gemini 2.5 Flash → Gemini 1.5 Flash → OpenRouter Gemma 2 → LLaMA 3

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌────────┐  │
│  │Onboarding│ │ Dashboard │ │CommunityMap│ │AI Chat │  │
│  └────┬─────┘ └─────┬─────┘ └─────┬──────┘ └───┬────┘  │
│       │             │             │             │       │
│       └─────────────┴─────────────┴─────────────┘       │
│                         │ API Routes                    │
├─────────────────────────┼───────────────────────────────┤
│   /api/v1/weather    → Open-Meteo (live forecast)       │
│   /api/v1/location   → Nominatim (geocoding)            │
│   /api/v1/route      → OSRM (driving routes)            │
│   /api/v1/emergency  → Shelter/Hospital database        │
│   /api/v1/report     → Supabase (crowdsource DB)        │
│   /api/v1/ai         → Gemini / OpenRouter (LLM)        │
├─────────────────────────────────────────────────────────┤
│           External Services & Data Sources              │
│  ┌──────────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌──────┐  │
│  │Open-Meteo│ │Nominat.│ │ OSRM │ │Supabase│ │Gemini│  │
│  └──────────┘ └────────┘ └──────┘ └────────┘ └──────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **AI Engine** | Google Gemini API (2.5-flash / 1.5-flash) |
| **AI Fallback** | OpenRouter (Gemma 2 9B, LLaMA 3 8B) |
| **Weather Data** | Open-Meteo API (real-time forecasts) |
| **Geocoding** | Nominatim (OpenStreetMap) |
| **Routing** | OSRM (Open Source Routing Machine) |
| **Maps** | Leaflet.js + React-Leaflet (CartoDB dark tiles) |
| **Database** | Supabase (PostgreSQL, community reports) |
| **Animations** | Framer Motion |
| **Forms** | React Hook Form + Zod validation |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([Get one here](https://aistudio.google.com/))
- (Optional) Supabase project for persistent community reports
- (Optional) OpenRouter API key for alternative AI models

### Installation

```bash
# Clone the repository
git clone https://github.com/vickyPotheesh2004/Varsha-AI.git
cd Varsha-AI

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following:

```env
# Required — AI Engine
GEMINI_API_KEY=your_gemini_api_key_here

# Optional — Alternative AI Provider
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL_PRIMARY=google/gemma-2-9b-it:free
OPENROUTER_MODEL_FALLBACK=meta-llama/llama-3-8b-instruct:free

# Optional — Community Reports Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** If no API keys are set in environment variables, users can configure them directly in the app's Settings modal (stored locally in the browser).

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 📱 How It Works

### Step 1: Set Your Location
On first visit, the app presents a guided onboarding flow. Either **auto-detect your GPS location** or **search manually** by typing any city, town, or area name. The location is resolved to precise coordinates via Nominatim geocoding.

### Step 2: Select Your Persona
Choose from 5 profile types that determine how AI recommendations are personalized:
- **Individual** — general urban preparedness
- **Caregiver / Family** — children, elderly, medical needs priority
- **Daily Commuter** — route-specific waterlogging & delay alerts
- **Farmer** — harvest warnings, livestock protection, crop schedules
- **Senior Citizen** — accessibility aids, medical equipment backup power

### Step 3: Provide Context (Optional)
Fill in persona-specific details: household size, medical equipment dependencies (oxygen, dialysis, insulin), commute start/end points, crop types, livestock ownership.

### Step 4: Your AI Safety Dashboard
The app simultaneously:
1. Fetches **live weather data** from Open-Meteo
2. Finds **nearby shelters & hospitals**
3. Loads **community incident reports**
4. Computes your **commute route** via OSRM (if configured)
5. Sends all data to **Google Gemini** which generates a structured, evidence-grounded safety action plan

### Step 5: Stay Safe & Contribute
- Follow the **AI-recommended action timeline**
- **Report local hazards** on the community map (floods, road blocks, power cuts)
- **Ask the AI chatbot** safety questions at any time
- **Print/download** your emergency checklist
- Data is **cached offline** — safety info remains available even when network drops

---

## 🤖 Gen AI Integration

### Google Gemini API (Primary)
- **Model**: `gemini-2.5-flash` (with `gemini-1.5-flash` automatic fallback)
- **Structured JSON output** via `responseMimeType: 'application/json'`
- **Used for**:
  - Generating personalized AI action plans with evidence-grounded recommendations
  - Conversational safety Q&A with retrieval-augmented context injection

### OpenRouter API (Alternative)
- **Models**: `google/gemma-2-9b-it:free` (primary), `meta-llama/llama-3-8b-instruct:free` (fallback)
- **JSON mode** via `response_format: { type: 'json_object' }`
- Acts as a cost-free alternative or backup when Gemini is unavailable

### Prompt Engineering
- System prompts enforce strict JSON schema compliance with zero hallucination rules
- User prompts inject real-time sensor data (weather, routes, incidents, shelters) for RAG-style grounding
- Every AI recommendation must cite its `evidence`, `source`, and `confidence` score

---

## 📂 Project Structure

```
varsha-ai/
├── app/
│   ├── api/v1/
│   │   ├── ai/route.ts          # Gemini/OpenRouter AI action plan & chat
│   │   ├── weather/route.ts     # Open-Meteo weather data proxy
│   │   ├── location/route.ts    # Nominatim geocoding
│   │   ├── route/route.ts       # OSRM driving route calculations
│   │   ├── emergency/route.ts   # Shelter & hospital finder
│   │   └── report/route.ts      # Community incident reports (Supabase)
│   ├── layout.tsx               # Root layout with metadata & fonts
│   ├── page.tsx                 # Landing page & app entry point
│   └── globals.css              # Global styles
├── components/
│   ├── Onboarding.tsx           # 3-step guided setup wizard
│   ├── Dashboard.tsx            # Main safety dashboard orchestrator
│   ├── RiskBadge.tsx            # Risk assessment with evidence panel
│   ├── ActionCards.tsx          # AI-generated action recommendations
│   ├── AiAssistant.tsx          # Conversational safety chatbot
│   ├── CommunityMap.tsx         # Interactive Leaflet crowdsource map
│   ├── TravelAdvisory.tsx       # Commute route intelligence
│   ├── EmergencyKit.tsx         # Printable safety checklist
│   ├── Navbar.tsx               # Top navigation bar
│   └── SettingsModal.tsx        # AI provider & API key configuration
├── lib/
│   ├── ai-client.ts             # Multi-provider AI client (Gemini + OpenRouter)
│   ├── supabase.ts              # Supabase client initialization
│   ├── types.ts                 # TypeScript type definitions
│   ├── rate-limit.ts            # API rate limiting utility
│   └── utils.ts                 # Helper utilities
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🏆 Built For

**PromptWars Hackathon** — Google for Developers × Hack2skill

VarshaAI demonstrates how Generative AI (Google Gemini) can be combined with real-time open data sources to create **life-saving, context-aware decision intelligence** that adapts to each user's unique circumstances during natural disasters.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <b>🌧️ Stay safe this monsoon season with VarshaAI</b><br/>
  <i>Evidence-grounded. Persona-aware. Offline-resilient.</i>
</p>
