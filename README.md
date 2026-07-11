# 🌧️ VarshaAI — Your Personal AI Monsoon Safety Companion

VarshaAI is an AI-powered disaster preparedness, safety coordination, and decision-support platform built for the **PromptWars** hackathon (Google for Developers x Hack2skill). It translates raw environmental sensor data and crowdsourced reports into actionable, hyper-personalized safety recommendations for vulnerable populations during monsoon hazards.

**Live Site:** [https://varsha-ai.vercel.app/](https://varsha-ai.vercel.app/)  
**GitHub Repository:** [https://github.com/vickyPotheesh2004/Varsha-AI.git](https://github.com/vickyPotheesh2004/Varsha-AI.git)

---

## 🚀 Key Features

1. **⚙️ Guided Personalization (No-Auth)**
   - Guided onboarding captures user location, persona (Commuter, Family/Caregiver, Farmer, Senior Citizen, Individual), and custom options (e.g. crop types, children, medical dependencies). Saves configurations locally.

2. **📡 Real-Time Telemetry & Deterministic Risk Engine**
   - Queries Open-Meteo current & hourly forecasts to compute risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) using rainfall intensity, wind speeds, and temperatures.
   - Integrates with OSRM (Open Source Routing Machine) to check commute paths and flag weather impacts along the route.

3. **🧠 Grounded AI Action Planning (Explainability by Default)**
   - Compiles weather, location, route, shelters, and crowdsourced incident context into a structured prompt.
   - Generates prioritized checklist tasks (Immediate, Today, Upcoming) and items to avoid.
   - Each recommendation links back to the grounding telemetry evidence (e.g. sensor readings, timestamps, and confidence scores).

4. **🗺️ Crowdsourced Incident Mapping & Image Uploads**
   - Renders Leaflet maps with premium dark/light adaptive tiles.
   - Allows users to report local hazards (Flooding, Road Blocks, Power Outages) by clicking the map.
   - Integrates a secure image uploader checking MIME-types and file size (max 2MB), saving to Supabase Storage (with Base64 data URI fallback).

5. **📴 Offline Emergency Mode**
   - Seamlessly caches telemetry and AI safety plans. Displays a warning banner and serves cached offline data when connection is lost.

6. **💬 AI Grounded Chatbot**
   - Features a suggested-prompt assistant grounded in active telemetry to answer safety questions without prompt injection risk.

7. **🌓 Theme Switcher**
   - Responsive dark and light themes, including dynamic map layer swapping (CartoDB Dark Matter / CartoDB Voyager).

---

## 🛡️ Security Architecture (WCAG & OWASP Gaps Closed)

- **Stateless Cryptographic Rate Limiter**: Enforces serverless-safe sliding window rate limits on AI, report, and upload routes using signed cookie tokens (HMAC-SHA256). Prevents container-bypass attacks.
- **CSRF & CORS Origin Verification**: Validates request origins and referers against host domains on all POST routes.
- **Input Gating**: Enforces strict bounds checking for coordinates (-90 to +90 for latitude, -180 to +180 for longitude).
- **Secure HTTP Headers**: Set clickjacking and MIME-sniffing protection headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- **Accessibility Focus Trapping**: Modals trap Tab/Shift+Tab focus cycles and support `Escape` key close events.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (with CSS Variables customization)
- **Mapping**: Leaflet / React Leaflet (Voyager & Dark Matter tiles)
- **Database / Storage**: Supabase (Anon Key REST client)
- **AI Integrations**: OpenRouter Gateway / Direct Google Gemini API

---

## ⚙️ Local Installation & Running Guide

Follow these steps to set up and run the project locally on your machine:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/vickyPotheesh2004/Varsha-AI.git
   cd Varsha-AI
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # API Keys (Provide at least one API key for AI safety checklists)
   OPENROUTER_API_KEY="your-openrouter-key"
   GEMINI_API_KEY="your-gemini-key"

   # Supabase Credentials (optional, falls back to browser localStorage if omitted)
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

5. **Build for Production Compile:**
   ```bash
   npm run build
   ```

6. **Run the Automated Tests:**
   ```bash
   npm run test
   ```

---

## 🗄️ Supabase Database Schema

To initialize the database schema, run the following SQL statement inside your Supabase SQL Editor:
```sql
create table reports (
  id text primary key,
  type text not null,
  latitude double precision not null,
  longitude double precision not null,
  description text not null,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);
```

---

## 🧪 Testing & CI/CD Pipeline

The project features a custom backend and UI pre-rendering test suite. The suite is integrated with a **GitHub Actions CI Pipeline** (`.github/workflows/test.yml`) running checks automatically on every push.

### Run Tests:
```bash
npm run test
```

### Active Test Cases:
1. **Location Geocoding**: Validates OSM Nominatim forward requests.
2. **Weather Risk Engine**: Evaluates weather parsing and risk computations.
3. **Emergency Shelter Locator**: Verifies shelter distance sorting.
4. **OSRM Route Fallback**: Checks travel advisories and Haversine fallbacks.
5. **CSRF Protection**: Verifies that malicious origins (e.g. `hackerwebsite.com`) are blocked with `403`.
6. **Input Bounds Validation**: Confirms out-of-range coordinates are rejected with `400`.
7. **Sliding-Window Rate Limiting**: Confirms that spam requests (11+ POSTs) are dropped with `429`.
8. **MIME-Type & Size Uploads**: Confirms non-image uploads and files >2MB are rejected with `400`.
9. **UI Component SSR Checks**: Pre-renders core views (`Navbar`, `RiskBadge`, `ActionCards`, `EmergencyKit`) to verify zero compile or runtime crashes during page pre-rendering.
