import { NextResponse } from 'next/server';
import { z } from 'zod';

const weatherParamsSchema = z.object({
  lat: z.union([z.number(), z.string()]).transform(val => Number(val)).pipe(z.number().min(-90).max(90)),
  lng: z.union([z.number(), z.string()]).transform(val => Number(val)).pipe(z.number().min(-180).max(180))
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parseResult = weatherParamsSchema.safeParse({
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng')
  });

  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map(e => {
      const path = e.path.join('.');
      const mappedPath = path === 'lat' ? 'latitude' : path === 'lng' ? 'longitude' : path;
      return `${mappedPath}: ${e.message}`;
    }).join(', ');
    return NextResponse.json({ error: `Invalid coordinates parameters: ${errorMsg}` }, { status: 400 });
  }

  const { lat, lng } = parseResult.data;

  try {
    const openmeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,wind_speed_10m&hourly=precipitation,temperature_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
    
    const res = await fetch(openmeteoUrl);
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.statusText}`);
    
    const data = await res.json();
    
    const currentTemp = data.current?.temperature_2m || 0;
    const currentPrecipitation = data.current?.precipitation || 0;
    const currentWindSpeed = data.current?.wind_speed_10m || 0;
    
    // Aggregate daily forecast
    const dailyForecast = (data.daily?.time || []).map((time: string, idx: number) => ({
      time,
      precipitationMax: data.daily?.precipitation_sum?.[idx] || 0,
      windSpeedMax: data.daily?.wind_speed_10m_max?.[idx] || 0,
      tempMax: data.daily?.temperature_2m_max?.[idx] || 0,
      tempMin: data.daily?.temperature_2m_min?.[idx] || 0
    }));

    // Find max precipitation sum in the next 3 days
    const nextThreeDaysPrecip = dailyForecast.slice(0, 3).map((d: { precipitationMax: number }) => d.precipitationMax);
    const maxPrecipNextThreeDays = Math.max(...nextThreeDaysPrecip, 0);

    // Compute basic weather risk
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let riskReason = 'Weather conditions are stable and safe.';

    if (currentPrecipitation > 15 || maxPrecipNextThreeDays > 100 || currentWindSpeed > 60) {
      riskLevel = 'CRITICAL';
      riskReason = `Critical weather conditions detected: ${currentPrecipitation > 15 ? 'Extremely heavy rainfall occurring right now.' : 'Extremely high rainfall sum forecast.'} Wind speeds up to ${currentWindSpeed} km/h. High potential for flooding and infrastructure disruption.`;
    } else if (currentPrecipitation > 5 || maxPrecipNextThreeDays > 50 || currentWindSpeed > 40) {
      riskLevel = 'HIGH';
      riskReason = `High weather risk. Heavy precipitation (${maxPrecipNextThreeDays.toFixed(1)} mm) and strong winds detected/forecast. Low-lying areas might experience flooding.`;
    } else if (currentPrecipitation > 1 || maxPrecipNextThreeDays > 20 || currentWindSpeed > 25) {
      riskLevel = 'MEDIUM';
      riskReason = `Moderate monsoon activity. Periodic showers and gusty winds. Keep updated on route status and local forecasts.`;
    }

    const hourlyPrecipitation = (data.hourly?.precipitation || []).slice(0, 24);
    const hourlyTime = (data.hourly?.time || []).slice(0, 24);

    return NextResponse.json({
      currentTemp,
      currentPrecipitation,
      currentWindSpeed,
      riskLevel,
      riskReason,
      dailyForecast,
      hourlyPrecipitation,
      hourlyTime,
      updatedAt: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Weather API failed:', error);
    return NextResponse.json({
      error: 'Weather service unavailable',
      message: (error as Error).message,
      // Default safe weather context
      fallback: {
        currentTemp: 25,
        currentPrecipitation: 0,
        currentWindSpeed: 10,
        riskLevel: 'LOW',
        riskReason: 'Weather service is currently offline. Showing local safety baseline.',
        dailyForecast: [],
        hourlyPrecipitation: [],
        hourlyTime: [],
        updatedAt: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
