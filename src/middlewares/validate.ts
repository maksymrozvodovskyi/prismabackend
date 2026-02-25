import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema, property: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const sources = {
      body: req.body,
      query: req.query,
      params: req.params,
    } as const;

    const result = schema.safeParse(sources[property]);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation error",
        issues: result.error.issues,
      });
    }

    res.locals[property] = result.data;
    next();
  };
