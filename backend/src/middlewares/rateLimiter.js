// Simple in-memory rate limiter middleware with zero external dependencies
const requests = new Map();

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // Default: 15 minutes
  const maxHits = options.max || 10; // Default: 10 requests per window
  const message = options.message || { message: 'Demasiados intentos. Por favor intente nuevamente en 15 minutos.' };

  // Periodic cleanup of expired IP keys to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(ip);
      }
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!requests.has(ip)) {
      requests.set(ip, { hits: 1, resetTime: now + windowMs });
      return next();
    }

    const record = requests.get(ip);

    if (now > record.resetTime) {
      record.hits = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.hits += 1;

    if (record.hits > maxHits) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json(message);
    }

    next();
  };
};

module.exports = rateLimiter;
