import { GET as locationGET } from '../app/api/v1/location/route';
import { GET as weatherGET } from '../app/api/v1/weather/route';
import { GET as emergencyGET } from '../app/api/v1/emergency/route';
import { GET as routeGET } from '../app/api/v1/route/route';
import { POST as reportPOST } from '../app/api/v1/report/route';

async function runTests() {
  console.log('🧪 Starting VarshaAI API Route Unit Tests...\n');
  let passed = 0;
  let failed = 0;

  const testCase = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message || err);
      failed++;
    }
  };

  // 1. Test Geocoding Location API
  await testCase('Location Geocoding (Nominatim Forward)', async () => {
    const req = new Request('http://localhost/api/v1/location?q=Mumbai');
    const res = await locationGET(req);
    const data = await res.json();
    
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    if (!Array.isArray(data) || data.length === 0) throw new Error('Response is not a populated array');
    if (!data[0].lat || !data[0].lng) throw new Error('Coordinates missing in output');
  });

  // 2. Test Weather API Risk Engine
  await testCase('Weather & Risk Assessment Engine (Open-Meteo)', async () => {
    const req = new Request('http://localhost/api/v1/weather?lat=19.0760&lng=72.8777');
    const res = await weatherGET(req);
    const data = await res.json();
    
    const target = data.fallback ? data.fallback : data;
    if (res.status !== 200 && res.status !== 500) throw new Error(`Status was ${res.status}`);
    if (!target.riskLevel) throw new Error('Risk assessment calculation missing');
    if (typeof target.currentTemp !== 'number') throw new Error('Temperature must be a number');
  });

  // 3. Test Emergency Shelters API
  await testCase('Emergency Shelters Locator', async () => {
    const req = new Request('http://localhost/api/v1/emergency?lat=19.0760&lng=72.8777');
    const res = await emergencyGET(req);
    const data = await res.json();
    
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    if (!Array.isArray(data) || data.length === 0) throw new Error('Shelters list is empty');
    if (!data[0].distanceKm) throw new Error('Distance parsing missing in shelter details');
  });

  // 4. Test OSRM Routing Fallback
  await testCase('Routing & Travel Advisory (Haversine Fallback)', async () => {
    const req = new Request('http://localhost/api/v1/route?startLat=19.0760&startLng=72.8777&endLat=19.0850&endLng=72.8800');
    const res = await routeGET(req);
    const data = await res.json();
    
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    if (typeof data.distanceKm !== 'number') throw new Error('Distance Km is not a number');
    if (typeof data.durationMinutes !== 'number') throw new Error('Duration Minutes is not a number');
  });

  // 5. Test CSRF Protection
  await testCase('Security: CSRF Origin Protection (Block malicious origin)', async () => {
    const req = new Request('http://localhost/api/v1/report', {
      method: 'POST',
      headers: {
        'origin': 'https://hackerwebsite.com',
        'host': 'varsha-ai.vercel.app'
      },
      body: JSON.stringify({
        type: 'flood',
        lat: '19.0222',
        lng: '72.8436',
        description: 'Mock data'
      })
    });
    
    // Set NODE_ENV to production temporarily to trigger the live domain check
    const prevEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'production';
    
    const res = await reportPOST(req);
    (process.env as any).NODE_ENV = prevEnv;
    
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, but got ${res.status}`);
    }
  });

  // 6. Test Input Range Constraints
  await testCase('Security: Latitude/Longitude Range Validation', async () => {
    const req = new Request('http://localhost/api/v1/report', {
      method: 'POST',
      body: JSON.stringify({
        type: 'flood',
        lat: '250', // Invalid latitude (> 90)
        lng: '72.8436',
        description: 'Mock range validation data'
      })
    });
    const res = await reportPOST(req);
    const data = await res.json();
    
    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request, but got ${res.status}`);
    }
    if (!data.error || !data.error.includes('latitude')) {
      throw new Error(`Expected latitude range error message, but got: ${JSON.stringify(data)}`);
    }
  });

  // 7. Test Rate Limiting
  await testCase('Security: Sliding-Window Rate Limiting', async () => {
    let lastStatus = 200;
    // Send 12 requests in sequence to trigger rate limit (limit is 10)
    for (let i = 0; i < 12; i++) {
      const req = new Request('http://localhost/api/v1/report', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '9.8.7.6'
        },
        body: JSON.stringify({
          type: 'flood',
          lat: '19.0222',
          lng: '72.8436',
          description: `Rate limit test report #${i}`
        })
      });
      const res = await reportPOST(req);
      lastStatus = res.status;
      if (lastStatus === 429) {
        break; // Successfully triggered rate limit
      }
    }
    
    if (lastStatus !== 429) {
      throw new Error(`Expected 429 Too Many Requests, but got ${lastStatus}`);
    }
  });

  console.log(`\n📊 Test Execution Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
