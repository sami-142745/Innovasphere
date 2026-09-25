import rateLimitImpl from 'express-rate-limit';

export const rateLimit = rateLimitImpl({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

