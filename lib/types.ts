export type PersonaType = 'individual' | 'family' | 'farmer' | 'traveller' | 'senior';

export interface UserProfile {
  persona: PersonaType;
  locationName: string;
  latitude: number;
  longitude: number;
  householdSize?: number;
  hasChildren?: boolean;
  hasElderly?: boolean;
  medicalDependencies?: string[];
  commuteMode?: 'bike' | 'car' | 'public' | 'walk' | 'none';
  commuteStart?: string;
  commuteEnd?: string;
  farmCrop?: string;
  farmLivestock?: boolean;
}

export interface WeatherData {
  currentTemp: number;
  currentPrecipitation: number; // in mm
  currentWindSpeed: number; // in km/h
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskReason: string;
  dailyForecast: {
    time: string;
    precipitationMax: number;
    windSpeedMax: number;
    tempMax: number;
    tempMin: number;
  }[];
  hourlyPrecipitation: number[]; // next 24 hours
  hourlyTime: string[];
  updatedAt: string;
}

export interface RouteData {
  distanceKm: number;
  durationMinutes: number;
  geometry: string; // polyline or coordinates array string
  summary: string;
  weatherRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskReason: string;
}

export interface IncidentReport {
  id: string;
  type: 'flood' | 'road-block' | 'tree-fallen' | 'power-cut' | 'medical' | 'other';
  lat: number;
  lng: number;
  description: string;
  photoUrl?: string;
  createdAt: string;
  expiresAt: string;
}

export interface ShelterData {
  name: string;
  type: 'shelter' | 'hospital' | 'emergency';
  lat: number;
  lng: number;
  distanceKm: number;
  address?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  urgency: 'immediate' | 'today' | 'upcoming';
  timeframe: string; // e.g. "Within 30 minutes", "Before rain starts"
  icon: string; // icon name
  why: string;
  evidence: string;
  source: string;
  confidence: number;
}

export interface AIActionPlan {
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actions: ActionItem[];
  avoidList: string[];
  timeline: {
    timeframe: string;
    task: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  confidenceScore: number;
  sourcesUsed: string[];
}
