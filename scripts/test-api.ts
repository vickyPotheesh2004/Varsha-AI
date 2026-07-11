import { GET as locationGET } from '../app/api/v1/location/route';
import { GET as weatherGET } from '../app/api/v1/weather/route';
import { GET as emergencyGET } from '../app/api/v1/emergency/route';
import { GET as routeGET } from '../app/api/v1/route/route';
import { POST as reportPOST } from '../app/api/v1/report/route';
import { POST as uploadPOST } from '../app/api/v1/upload/route';

import { renderToString } from 'react-dom/server';
import React from 'react';
import Navbar from '../components/Navbar';
import RiskBadge from '../components/RiskBadge';
import ActionCards from '../components/ActionCards';
import EmergencyKit from '../components/EmergencyKit';

async function runTests() {
  console.log('🧪 Starting VarshaAI API Route & UI Component Tests...\n');
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
        lat: '250',
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
    let cookieVal: string | null = null;
    
    // Send 12 requests in sequence to trigger rate limit (limit is 10)
    for (let i = 0; i < 12; i++) {
      const headers: Record<string, string> = {
        'x-forwarded-for': '9.8.7.6'
      };
      if (cookieVal) {
        headers['cookie'] = `varsha-rl-report=${cookieVal}`;
      }

      const req = new Request('http://localhost/api/v1/report', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'flood',
          lat: '19.0222',
          lng: '72.8436',
          description: `Rate limit test report #${i}`
        })
      });
      const res = await reportPOST(req);
      lastStatus = res.status;

      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const match = setCookie.match(/varsha-rl-report=([^;]+)/);
        if (match) {
          cookieVal = match[1];
        }
      }

      if (lastStatus === 429) {
        break;
      }
    }
    
    if (lastStatus !== 429) {
      throw new Error(`Expected 429 Too Many Requests, but got ${lastStatus}`);
    }
  });

  // 8. Test Secure File Upload Endpoint
  await testCase('Security: Upload MIME-Type and Size Validation', async () => {
    // 8a. Test invalid MIME type blocked
    const mimeReq = new Request('http://localhost/api/v1/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'malicious.exe',
        fileType: 'application/x-msdownload',
        fileData: Buffer.from('fake exe content').toString('base64')
      })
    });
    const mimeRes = await uploadPOST(mimeReq);
    const mimeData = await mimeRes.json();
    if (mimeRes.status !== 400 || !mimeData.error.includes('type')) {
      throw new Error('Expected 400 for forbidden MIME type');
    }

    // 8b. Test file size > 2MB limit blocked
    const largeData = 'A'.repeat(3 * 1024 * 1024); // ~3MB base64 string
    const sizeReq = new Request('http://localhost/api/v1/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'large.jpg',
        fileType: 'image/jpeg',
        fileData: largeData
      })
    });
    const sizeRes = await uploadPOST(sizeReq);
    const sizeData = await sizeRes.json();
    if (sizeRes.status !== 400 || !sizeData.error.includes('size')) {
      throw new Error('Expected 400 for file size exceeding 2MB');
    }

    // 8c. Test successful base64 fallback URL output
    const okReq = new Request('http://localhost/api/v1/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'screenshot.png',
        fileType: 'image/png',
        fileData: Buffer.from('fake png content').toString('base64')
      })
    });
    const okRes = await uploadPOST(okReq);
    const okData = await okRes.json();
    if (okRes.status !== 200 || !okData.url.startsWith('data:image/png;base64,')) {
      throw new Error('Failed to generate valid local Base64 data URI fallback');
    }
  });

  // 9. Test UI Components Server-Side Rendering
  await testCase('UI: React Component SSR Rendering Checks', async () => {
    // Test Navbar renders
    const navHtml = renderToString(React.createElement(Navbar));
    if (!navHtml.includes('VarshaAI')) throw new Error('Navbar failed to render brand logo text');

    // Test RiskBadge renders
    const badgeHtml = renderToString(
      React.createElement(RiskBadge, {
        riskLevel: 'CRITICAL',
        reason: 'Severe rain warnings',
        confidenceScore: 0.95,
        weatherData: {
          currentTemp: 24,
          currentPrecipitation: 15,
          currentWindSpeed: 35,
          riskLevel: 'CRITICAL',
          riskReason: 'Severe rain warnings',
          dailyForecast: [],
          hourlyPrecipitation: [],
          hourlyTime: [],
          updatedAt: new Date().toISOString()
        },
        routeData: null
      })
    );
    if (!badgeHtml.includes('CRITICAL') || !badgeHtml.includes('Severe')) {
      throw new Error('RiskBadge failed to render details');
    }

    // Test ActionCards renders
    const cardsHtml = renderToString(
      React.createElement(ActionCards, {
        actions: [{ 
          id: '1', 
          title: 'Evacuate low areas', 
          urgency: 'immediate', 
          description: 'Immediate risk', 
          timeframe: 'Immediate', 
          icon: 'shield',
          why: 'Heavy localized flooding risk',
          evidence: 'Rainfall levels exceed 50mm',
          source: 'Open-Meteo API',
          confidence: 0.95
        }],
        avoidList: ['Do not cross flooded streams']
      })
    );
    if (!cardsHtml.includes('Evacuate low areas')) {
      throw new Error('ActionCards failed to render action list');
    }

    // Test EmergencyKit renders
    const kitHtml = renderToString(
      React.createElement(EmergencyKit, {
        userProfile: {
          latitude: 19.0760,
          longitude: 72.8777,
          locationName: 'Mumbai',
          persona: 'farmer',
          hasChildren: false,
          hasElderly: false,
          medicalDependencies: [],
          farmCrop: 'Rice'
        }
      })
    );
    if (!kitHtml.includes('backup') && !kitHtml.includes('Rice')) {
      throw new Error('EmergencyKit failed to render persona checklist');
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
