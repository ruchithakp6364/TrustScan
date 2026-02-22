import getRedisClient from './redis';

const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

export async function checkRateLimit(identifier) {
  try {
    const redis = getRedisClient();
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    // Remove old requests outside the window
    await redis.zremrangebyscore(key, '-inf', windowStart);

    // Count requests in current window
    const requestCount = await redis.zcard(key);

    if (requestCount >= MAX_REQUESTS) {
      // Get the oldest request timestamp to calculate reset time
      const oldestRequests = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTimestamp = oldestRequests[1] ? parseInt(oldestRequests[1]) : now;
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(oldestTimestamp + WINDOW_MS)
      };
    }

    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, Math.ceil(WINDOW_MS / 1000));

    return {
      allowed: true,
      remaining: MAX_REQUESTS - requestCount - 1,
      resetAt: new Date(now + WINDOW_MS)
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fallback: allow request if Redis is down
    return {
      allowed: true,
      remaining: MAX_REQUESTS,
      resetAt: new Date(Date.now() + WINDOW_MS)
    };
  }
}
