import type { Request, Response, NextFunction } from 'express';
import { authenticate } from './auth.js';

export function requireRole(...roles: Array<'STUDENT' | 'ADMIN'>) {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    const ok = authenticate(req);
    if (!ok) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

    next();
  };
}

