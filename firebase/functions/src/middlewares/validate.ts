import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type Where = "body" | "query" | "params";

export const validate =
  (schema: ZodSchema, where: Where = "query") =>
  (req: Request, res: Response, next: NextFunction) => {
    const data = where === "body" ? req.body : where === "params" ? req.params : req.query;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      res.status(400).send({ error: "ValidationError", issues: parsed.error.flatten() });
      return;
    }
    // attach parsed
    (req as any)._validated = { ...(req as any)._validated, [where]: parsed.data };
    next();
  };