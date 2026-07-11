import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startLat = searchParams.get('startLat');
  const startLng = searchParams.get('startLng');
  const endLat = searchParams.get('endLat');
  const endLng = searchParams.get('endLng');

  if (!startLat || !startLng || !endLat || !endLng) {
    return NextResponse.json({ error: 'Start and end coordinates are required' }, { status: 400 });
  }

  try {
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    
    const res = await fetch(osrmUrl);
    if (!res.ok) throw new Error(`OSRM error: ${res.statusText}`);
    
    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found between coordinates.');
    }

    const primaryRoute = data.routes[0];
    const distanceKm = primaryRoute.distance ? primaryRoute.distance / 1000 : 0;
    const durationMinutes = primaryRoute.duration ? primaryRoute.duration / 60 : 0;
    
    return NextResponse.json({
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      durationMinutes: Math.round(durationMinutes),
      geometry: JSON.stringify(primaryRoute.geometry?.coordinates || []),
      summary: primaryRoute.legs?.[0]?.summary || 'Monsoon commuter route',
      weatherRisk: 'LOW',
      riskReason: 'Route is clear based on static mapping.'
    });
  } catch (error: any) {
    console.warn('OSRM routing failed, calculating straight-line fallback...', error);

    // Straight line distance fallback
    const lat1 = parseFloat(startLat);
    const lon1 = parseFloat(startLng);
    const lat2 = parseFloat(endLat);
    const lon2 = parseFloat(endLng);
    
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    
    // Average speed assumption: 30 km/h in monsoons
    const averageSpeedKmh = 30;
    const durationMinutes = (distanceKm / averageSpeedKmh) * 60;

    return NextResponse.json({
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      durationMinutes: Math.round(durationMinutes),
      geometry: JSON.stringify([[lon1, lat1], [lon2, lat2]]),
      summary: 'Straight line estimate (routing service offline)',
      weatherRisk: 'MEDIUM',
      riskReason: 'Using straight-line calculations due to routing API failure. Drive with extreme caution.'
    });
  }
}
