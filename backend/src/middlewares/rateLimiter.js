const getClientKey = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const rateLimiter = ({ windowMs = 15 * 60 * 1000, max = 10, message } = {}) => {
  const requests = new Map();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests.entries()) {
      if (record.resetTime <= now) requests.delete(key);
    }
  }, Math.min(windowMs, 60 * 60 * 1000));
  cleanup.unref();

  return (req, res, next) => {
    const key = getClientKey(req);
    const now = Date.now();
    const current = requests.get(key);
    const record = !current || current.resetTime <= now
      ? { hits: 1, resetTime: now + windowMs }
      : { ...current, hits: current.hits + 1 };

    requests.set(key, record);
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - record.hits));
    res.setHeader('RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.hits > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json(message || { message: 'Demasiados intentos. Intenta nuevamente más tarde.' });
    }
    return next();
  };
};

module.exports = rateLimiter;
