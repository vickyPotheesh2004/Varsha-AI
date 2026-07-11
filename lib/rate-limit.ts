import crypto from 'crypto';

// Server-side fallback secret for HMAC signatures
const SECRET = process.env.RATE_LIMIT_SECRET || 'varsha-ai-monsoon-safety-secret-key-9988';

interface RateLimitPayload {
  ip: string;
  windowStart: number;
  count: number;
}

/**
 * Creates an HMAC-SHA256 signature for a payload string.
 */
function createSignature(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

/**
 * Statelessly checks and increments rate limit count using signed cookie tokens.
 * 
 * @param ip Client IP address
 * @param token Current cookie token value from the request
 * @param limit Max requests allowed in the sliding window
 * @param windowMs Time window in milliseconds (default 1 minute)
 */
export function verifyAndIncrement(
  ip: string,
  token: string | null,
  limit = 10,
  windowMs = 60000
): { allowed: boolean; newToken: string } {
  const now = Date.now();

  if (token) {
    try {
      const [payloadBase64, signature] = token.split('.');
      const payloadStr = Buffer.from(payloadBase64, 'base64').toString('utf8');

      // Verify cryptographic signature matches to prevent client-side tampering
      if (createSignature(payloadBase64) === signature) {
        const payload = JSON.parse(payloadStr) as RateLimitPayload;

        // Ensure the IP address matches to prevent token sharing
        if (payload.ip === ip) {
          const elapsed = now - payload.windowStart;

          if (elapsed < windowMs) {
            if (payload.count >= limit) {
              return { allowed: false, newToken: token };
            }
            // Valid window, increment count
            const updatedPayload: RateLimitPayload = {
              ip,
              windowStart: payload.windowStart,
              count: payload.count + 1
            };
            const updatedBase64 = Buffer.from(JSON.stringify(updatedPayload)).toString('base64');
            const updatedToken = `${updatedBase64}.${createSignature(updatedBase64)}`;
            return { allowed: true, newToken: updatedToken };
          }
        }
      }
    } catch {
      // Reset on tampering or invalid formats
    }
  }

  // Create new sliding window
  const freshPayload: RateLimitPayload = {
    ip,
    windowStart: now,
    count: 1
  };
  const freshBase64 = Buffer.from(JSON.stringify(freshPayload)).toString('base64');
  const freshToken = `${freshBase64}.${createSignature(freshBase64)}`;
  return { allowed: true, newToken: freshToken };
}
