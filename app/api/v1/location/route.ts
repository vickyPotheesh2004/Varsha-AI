import { NextResponse } from 'next/server';
import { z } from 'zod';

const coordRegex = /^-?\d+(\.\d+)?$/;
const locationParamsSchema = z.object({
  q: z.string().min(1).max(100).optional().nullable(),
  lat: z.string().regex(coordRegex).refine(val => {
    const num = parseFloat(val);
    return num >= -90 && num <= 90;
  }).optional().nullable(),
  lng: z.string().regex(coordRegex).refine(val => {
    const num = parseFloat(val);
    return num >= -180 && num <= 180;
  }).optional().nullable()
}).refine(data => data.q || (data.lat && data.lng), {
  message: "Either query 'q' or coordinates 'lat' and 'lng' must be provided."
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parseResult = locationParamsSchema.safeParse({
    q: searchParams.get('q'),
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng')
  });

  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map(e => {
      const path = e.path.join('.');
      const mappedPath = path === 'lat' ? 'latitude' : path === 'lng' ? 'longitude' : path;
      return `${mappedPath}: ${e.message}`;
    }).join(', ');
    return NextResponse.json({ error: `Invalid location parameters: ${errorMsg}` }, { status: 400 });
  }

  const { q, lat, lng } = parseResult.data;

  const userAgent = 'VarshaAI/1.0 (contact: support-varshaai@vercel.app)';
  const headers = { 'User-Agent': userAgent };

  try {
    if (lat && lng) {
      // Reverse geocoding
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Nominatim error: ${res.statusText}`);
      
      const data = await res.json();
      return NextResponse.json({
        name: data.display_name || `${lat}, ${lng}`,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        details: data.address || {}
      });
    } else if (q) {
      // Forward geocoding
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Nominatim error: ${res.statusText}`);
      
      const data = await res.json();
      const results = data.map((item: { display_name: string; lat: string; lon: string; type?: string }) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type
      }));
      
      return NextResponse.json(results);
    } else {
      return NextResponse.json({ error: 'Missing parameters q or lat/lng' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Geocoding API failed:', error);
    // Safe fallback defaults
    return NextResponse.json({
      error: 'Geocoding service unavailable',
      message: (error as Error).message,
      fallback: true
    }, { status: 500 });
  }
}
