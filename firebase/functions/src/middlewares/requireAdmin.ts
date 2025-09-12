import {Request, Response, NextFunction} from 'express';
import {requireAuth} from './requireAuth'; // Assumes requireAuth is in the same directory

/**
 * A middleware that chains after `requireAuth` to check for admin custom claims.
 * If the user is not an admin, it sends a 403 Forbidden response.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // First, ensure the user is authenticated.
  requireAuth(req, res, () => {
    // If authenticated, check for the admin custom claim.
    if (req.user && req.user.admin === true) {
      // User is an admin, proceed to the next handler.
      return next();
    } else {
      // User is not an admin.
      return res.status(403).send({error: 'Forbidden', code: 'auth/not-an-admin'});
    }
  });
};
