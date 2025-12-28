import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    res.status(401).send({ error: 'Unauthorized: No token provided.' });
    return;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Unauthorized: Invalid token.' });
    return;
  }
};