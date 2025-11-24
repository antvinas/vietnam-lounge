import rateLimit from "express-rate-limit";

export const publicLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  keyGenerator: (req) => (req as any)?.user?.uid || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});
