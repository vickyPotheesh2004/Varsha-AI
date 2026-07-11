const rateLimitMap = new Map<string, number[]>();

/**
 * Checks if a given IP address has exceeded the rate limit.
 * 
 * @param ip The client IP address
 * @param limit Max allowed requests in the window
 * @param windowMs Time window in milliseconds (default 1 minute)
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  
  // Filter out timestamps outside the sliding window
  const activeTimestamps = timestamps.filter(t => now - t < windowMs);
  
  if (activeTimestamps.length >= limit) {
    return false;
  }
  
  activeTimestamps.push(now);
  rateLimitMap.set(ip, activeTimestamps);
  return true;
}
