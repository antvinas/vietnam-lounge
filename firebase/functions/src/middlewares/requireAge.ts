import { Request, Response, NextFunction } from "express";

export const requireAge = (req: Request, res: Response, next: NextFunction) => {
  const user: any = (req as any).user;
  const ok =
    Boolean(user?.ageVerified) ||
    Boolean(user?.adult) ||
    Boolean(user?.claims?.ageVerified) ||
    Boolean(user?.claims?.adult);
  if (!ok) {
    res.status(403).send({ error: "AgeVerificationRequired" });
    return;
  }
  next();
};