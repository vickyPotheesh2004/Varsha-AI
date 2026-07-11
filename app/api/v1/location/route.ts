import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

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
      const results = data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type
      }));
      
      return NextResponse.json(results);
    } else {
      return NextResponse.json({ error: 'Missing parameters q or lat/lng' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Geocoding API failed:', error);
    // Safe fallback defaults
    return NextResponse.json({
      error: 'Geocoding service unavailable',
      message: error.message,
      fallback: true
    }, { status: 500 });
  }
}
