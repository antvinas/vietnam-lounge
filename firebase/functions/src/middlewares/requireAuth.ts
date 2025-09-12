import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {Request, Response, NextFunction} from 'express';

// Add a custom property 'user' to the Express Request interface
declare global {
  namespace Express {
    interface Request {
      user: admin.auth.DecodedIdToken;
    }
  }
}

/**
 * A middleware to verify the Firebase ID token from the Authorization header.
 * If valid, it attaches the decoded token to the request object.
 * If invalid, it sends a 403 Forbidden response.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    functions.logger.warn('Authentication token not found.');
    return res.status(403).send({error: 'Unauthorized', code: 'auth/token-not-found'});
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Attach user to the request object
    return next();
  } catch (error) {
    functions.logger.error('Error while verifying Firebase ID token:', error);
    return res.status(403).send({error: 'Unauthorized', code: 'auth/invalid-token'});
  }
};
