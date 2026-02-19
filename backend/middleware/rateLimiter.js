const requestCounts = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

export const rateLimiter = (req, res, next) => {
  const clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  const clientData = requestCounts.get(clientId);

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + WINDOW_MS;
    return next();
  }

  if (clientData.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }

  clientData.count++;
  next();
};

setInterval(() => {
  const now = Date.now();
  for (const [clientId, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(clientId);
    }
  }
}, WINDOW_MS);