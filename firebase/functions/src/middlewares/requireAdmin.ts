import { Request, Response, NextFunction } from 'express';
import { requireAuth } from './requireAuth';

/**
 * A middleware that chains after `requireAuth` to check for admin custom claims.
 * If the user is not an admin, it sends a 403 Forbidden response.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (req.user?.admin === true) {
      return next();
    } else {
      return res.status(403).send({ error: 'Forbidden', code: 'auth/not-an-admin' });
    }
  });
};
