import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  res.status(500).json({
    error: "Internal Server Error",
  });
}
