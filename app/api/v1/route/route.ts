import { NextResponse } from 'next/server';
import { z } from 'zod';

const coordRegex = /^-?\d+(\.\d+)?$/;
const routeParamsSchema = z.object({
  startLat: z.string().regex(coordRegex).refine(val => {
    const num = parseFloat(val);
    return num >= -90 && num <= 90;
  }),
  startLng: z.string().regex(coordRegex).refine(val => {
    const num = parseFloat(val);
    return num >= -180 && num <= 180;
  }),
  endLat: z.string().regex(coordRegex).refine(val => {
    const num = parseFloat(val);
    return num >= -90 && num <= 90;
  }),
  endLng: z.string().regex(coordRegex).refine(val => {
    const num = parseFloat(val);
    return num >= -180 && num <= 180;
  })
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parseResult = routeParamsSchema.safeParse({
    startLat: searchParams.get('startLat'),
    startLng: searchParams.get('startLng'),
    endLat: searchParams.get('endLat'),
    endLng: searchParams.get('endLng')
  });

  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map(e => {
      const path = e.path.join('.');
      const mappedPath = path.toLowerCase().includes('lat') ? 'latitude' : path.toLowerCase().includes('lng') ? 'longitude' : path;
      return `${mappedPath}: ${e.message}`;
    }).join(', ');
    return NextResponse.json({ error: `Invalid coordinates parameters: ${errorMsg}` }, { status: 400 });
  }

  const { startLat, startLng, endLat, endLng } = parseResult.data;

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
  } catch (error: unknown) {
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
