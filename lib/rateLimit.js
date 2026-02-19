// Simple in-memory rate limiter
const requestCounts = new Map();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

export function checkRateLimit(identifier) {
  const now = Date.now();
  const userRequests = requestCounts.get(identifier) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(recentRequests[0] + WINDOW_MS)
    };
  }
  
  // Add current request
  recentRequests.push(now);
  requestCounts.set(identifier, recentRequests);
  
  return {
    allowed: true,
    remaining: MAX_REQUESTS - recentRequests.length,
    resetAt: new Date(now + WINDOW_MS)
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, requests] of requestCounts.entries()) {
    const recentRequests = requests.filter(timestamp => now - timestamp < WINDOW_MS);
    if (recentRequests.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, recentRequests);
    }
  }
}, 300000);
