import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema, property: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation error",
        issues: result.error.issues,
      });
    }

    if (property === "query" || property === "params") {
      Object.assign(req[property], result.data);
    } else {
      req[property] = result.data;
    }

    next();
  };
