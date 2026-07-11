/**
 * Validates request origins and referers against the host domain to prevent 
 * Cross-Site Request Forgery (CSRF) and unauthorized cross-origin API abuse.
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host') || 'varsha-ai.vercel.app';

  // Allow local development requests
  if (process.env.NODE_ENV === 'development' || host.includes('localhost') || host.includes('127.0.0.1')) {
    return true;
  }

  const allowedOrigins = [
    `https://${host}`,
    'https://varsha-ai.vercel.app',
    'https://varsha-ai-git-main-vickypotheesh2004s-projects.vercel.app'
  ];

  // 1. Verify Origin Header if present
  if (origin && !allowedOrigins.some(allowed => allowed.includes(origin))) {
    return false;
  }

  // 2. Verify Referer Header if present
  if (referer) {
    try {
      const refUrl = new URL(referer);
      const isAllowed = allowedOrigins.some(allowed => {
        try {
          const allowedUrl = new URL(allowed);
          return refUrl.hostname === allowedUrl.hostname;
        } catch {
          return refUrl.hostname === allowed;
        }
      });
      if (!isAllowed && refUrl.hostname !== 'localhost' && refUrl.hostname !== '127.0.0.1') {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}
