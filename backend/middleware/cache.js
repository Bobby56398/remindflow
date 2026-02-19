const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

export const cacheMiddleware = (duration = CACHE_DURATION) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.user?.id || 'public'}:${req.originalUrl}`;
    const cachedData = cache.get(key);

    if (cachedData && Date.now() < cachedData.expiry) {
      return res.json(cachedData.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, {
        data,
        expiry: Date.now() + duration
      });
      return originalJson(data);
    };

    next();
  };
};

export const clearCache = (pattern) => {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now > value.expiry) {
      cache.delete(key);
    }
  }
}, 60 * 1000);