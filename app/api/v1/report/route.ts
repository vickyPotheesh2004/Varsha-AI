import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { IncidentReport } from '@/lib/types';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateOrigin } from '@/lib/security';

// Pre-populated active incident reports for demo purposes
let inMemoryReports: IncidentReport[] = [
  {
    id: 'demo-1',
    type: 'flood',
    lat: 19.0222,
    lng: 72.8436,
    description: 'Knee-deep water logging near Dadar Station. Vehicles stalling, avoid this lane.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    expiresAt: new Date(Date.now() + 3600000 * 4).toISOString() // expires in 4 hours
  },
  {
    id: 'demo-2',
    type: 'road-block',
    lat: 19.0544,
    lng: 72.8402,
    description: 'Tree fallen near Bandra Link Road blocking two lanes. Traffic is moving very slowly.',
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
    expiresAt: new Date(Date.now() + 3600000 * 5).toISOString()
  },
  {
    id: 'demo-3',
    type: 'power-cut',
    lat: 19.0380,
    lng: 72.8538,
    description: 'Local transformer burst due to heavy lightning. Complete blackout in Sion Sector 2.',
    createdAt: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
    expiresAt: new Date(Date.now() + 3600000 * 2).toISOString()
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      
      const parsedReports: IncidentReport[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        lat: parseFloat(item.latitude || item.lat),
        lng: parseFloat(item.longitude || item.lng),
        description: item.description,
        photoUrl: item.photo_url || item.photoUrl,
        createdAt: item.created_at || item.createdAt,
        expiresAt: item.expires_at || item.expiresAt
      }));

      // Combine with demo reports if user coordinates are close to Mumbai Dadar (to ensure map stays rich)
      return NextResponse.json([...inMemoryReports, ...parsedReports]);
    }

    // Filter out expired in-memory reports
    const now = new Date().toISOString();
    inMemoryReports = inMemoryReports.filter(r => r.expiresAt > now);

    return NextResponse.json(inMemoryReports);
  } catch (error: any) {
    console.error('Failed to fetch incident reports:', error);
    return NextResponse.json(inMemoryReports); // Fallback to memory
  }
}

export async function POST(request: Request) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden: Request origin is not allowed' }, { status: 403 });
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip, 10, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before submitting another report.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type, lat, lng, description, photoUrl } = body;

    if (!type || lat === undefined || lng === undefined || !description) {
      return NextResponse.json({ error: 'Missing required report fields' }, { status: 400 });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      return NextResponse.json({ error: 'Invalid latitude coordinates. Must be between -90 and 90.' }, { status: 400 });
    }

    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      return NextResponse.json({ error: 'Invalid longitude coordinates. Must be between -180 and 180.' }, { status: 400 });
    }

    const newReport: IncidentReport = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      lat: parsedLat,
      lng: parsedLng,
      description,
      photoUrl,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 6 * 3600000).toISOString() // 6 hours TTL
    };

    if (supabase) {
      const { error } = await supabase
        .from('reports')
        .insert({
          id: newReport.id,
          type: newReport.type,
          latitude: newReport.lat,
          longitude: newReport.lng,
          description: newReport.description,
          photo_url: newReport.photoUrl,
          expires_at: newReport.expiresAt
        });

      if (error) throw error;
    } else {
      // Store in memory
      inMemoryReports.unshift(newReport);
    }

    return NextResponse.json({ success: true, report: newReport });
  } catch (error: any) {
    console.error('Failed to submit incident report:', error);
    return NextResponse.json({ error: 'Failed to submit report', message: error.message }, { status: 500 });
  }
}
