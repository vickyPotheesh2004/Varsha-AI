import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' blob: data: https://unpkg.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com; connect-src 'self' https://generativelanguage.googleapis.com https://nominatim.openstreetmap.org https://api.open-meteo.com https://router.project-osrm.org https://*.supabase.co https://openrouter.ai; font-src 'self' data:; frame-src 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
